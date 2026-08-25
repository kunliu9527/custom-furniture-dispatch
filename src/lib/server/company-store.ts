import { mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
import {
  DEFAULT_COMPANY_ID,
  DEFAULT_COMPANY_NAME,
  isDefaultCompany,
  isValidCompanyId,
  isValidCompanyName,
  type CompanyInfo,
} from "@/lib/company";
import { createShortId } from "@/lib/create-id";
import { isReservedStoreName } from "@/lib/staff-config-storage";
import { permissionsTextForAccessLevel } from "@/lib/staff-access";
import { roleForPositionAndAccess } from "@/lib/staff-positions";
import { isValidCnMobile, normalizeCnMobile } from "@/lib/phone";
import { HEADQUARTERS_STORE } from "@/lib/stores";
import type { StoreName } from "@/lib/types";
import { resolveStorageBackendId } from "./storage-backend";
import { resolveUpstashRestCredentials } from "./redis-credentials";
import { createEmptyCompanySnapshot } from "./snapshot-normalize";
import type { AppSnapshot } from "./snapshot-types";
import { readAppSnapshot, writeAppSnapshot } from "./app-store";
import { isWecomConfigured, sendWecomText } from "./wecom-push";

const COMPANIES_FILE = "companies.json";
const COMPANIES_KV_KEY = "custom-furniture-dispatch:companies";

const DATA_DIR =
  process.env.SYNC_DATA_DIR?.trim() || path.join(process.cwd(), "data");

const MAX_STORES_PER_COMPANY = 20;
const MAX_REGISTRANT_NAME_LENGTH = 30;

function companiesFilePath(): string {
  return path.join(DATA_DIR, COMPANIES_FILE);
}

function readFileRegistry(): CompanyInfo[] {
  try {
    const raw = readFileSync(companiesFilePath(), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return [];
    throw err;
  }
}

function writeFileRegistry(companies: CompanyInfo[]): void {
  mkdirSync(DATA_DIR, { recursive: true });
  const filePath = companiesFilePath();
  const tmp = `${filePath}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(companies, null, 2), "utf8");
  renameSync(tmp, filePath);
}

async function readKvRegistry(): Promise<CompanyInfo[]> {
  const creds = resolveUpstashRestCredentials();
  if (!creds) {
    throw new Error(
      "未配置 Redis（需要 UPSTASH_REDIS_REST_* 或 Vercel 注入的 REDIS_URL）",
    );
  }
  const redis = new Redis({ url: creds.url, token: creds.token });
  const raw = await redis.get<CompanyInfo[]>(COMPANIES_KV_KEY);
  return Array.isArray(raw) ? raw : [];
}

async function writeKvRegistry(companies: CompanyInfo[]): Promise<void> {
  const creds = resolveUpstashRestCredentials();
  if (!creds) {
    throw new Error(
      "未配置 Redis（需要 UPSTASH_REDIS_REST_* 或 Vercel 注入的 REDIS_URL）",
    );
  }
  const redis = new Redis({ url: creds.url, token: creds.token });
  await redis.set(COMPANIES_KV_KEY, companies);
}

function isKv(): boolean {
  return resolveStorageBackendId() === "kv";
}

async function readRegistry(): Promise<CompanyInfo[]> {
  return isKv() ? readKvRegistry() : readFileRegistry();
}

async function writeRegistry(companies: CompanyInfo[]): Promise<void> {
  return isKv() ? writeKvRegistry(companies) : writeFileRegistry(companies);
}

function sortCompanies(companies: CompanyInfo[]): CompanyInfo[] {
  return [...companies].sort((a, b) => {
    if (isDefaultCompany(a.id)) return -1;
    if (isDefaultCompany(b.id)) return 1;
    return a.name.localeCompare(b.name, "zh-CN");
  });
}

/** 首次读取时自动注册默认公司（万象天冠），幂等 */
export async function ensureCompanyRegistry(): Promise<CompanyInfo[]> {
  const existing = await readRegistry();
  if (existing.some((c) => c.id === DEFAULT_COMPANY_ID)) {
    return existing;
  }
  const next = sortCompanies([
    ...existing,
    {
      id: DEFAULT_COMPANY_ID,
      name: DEFAULT_COMPANY_NAME,
      createdAt: new Date().toISOString(),
    },
  ]);
  await writeRegistry(next);
  return next;
}

export async function listCompanies(): Promise<CompanyInfo[]> {
  return ensureCompanyRegistry();
}

export async function findCompany(
  companyId: string,
): Promise<CompanyInfo | null> {
  const companies = await ensureCompanyRegistry();
  return companies.find((c) => c.id === companyId) ?? null;
}

export interface CreateCompanyInput {
  name: string;
  stores: string[];
  registrant: { name: string; password: string; phone: string };
}

export interface CreateCompanyResult {
  company: CompanyInfo;
  snapshot: AppSnapshot;
}

/** 手机号全局唯一：注册表（各公司注册手机号）+ 默认公司现有人员手机号 */
async function assertPhoneAvailable(
  phone: string,
  companies: CompanyInfo[],
): Promise<void> {
  if (companies.some((c) => c.phone === phone)) {
    throw new Error("该手机号已被其他公司注册");
  }
  const defaultSnapshot = await readAppSnapshot(DEFAULT_COMPANY_ID);
  const taken = new Set<string>();
  for (const staff of defaultSnapshot.staffConfig.customStaff) {
    if (staff.phone) taken.add(staff.phone.trim());
  }
  for (const overridePhone of Object.values(
    defaultSnapshot.staffConfig.phoneOverrides ?? {},
  )) {
    if (overridePhone) taken.add(overridePhone.trim());
  }
  if (taken.has(phone)) {
    throw new Error("该手机号已被注册");
  }
}

/** 通知 admin（admin 首页应用内提醒 + 企业微信推送，企微未配置时静默跳过） */
function notifyAdminOfNewCompany(
  company: CompanyInfo,
  registrantName: string,
  phone: string,
): void {
  if (!isWecomConfigured()) return;
  const text = [
    "【新公司注册】",
    `公司：${company.name}`,
    `账号：${registrantName}`,
    `手机号：${phone}`,
    `注册时间：${company.createdAt}`,
  ].join("\n");
  void sendWecomText(text).catch((err) => {
    console.error("[company-store] 企微推送新公司注册提醒失败", err);
  });
}

export async function createCompany(
  input: CreateCompanyInput,
): Promise<CreateCompanyResult> {
  const name = input.name.trim();
  if (!isValidCompanyName(name)) {
    throw new Error("公司名称需为 1-40 个字符");
  }
  const stores = normalizeStores(input.stores);
  const registrantName = input.registrant.name.trim();
  if (!registrantName || registrantName.length > MAX_REGISTRANT_NAME_LENGTH) {
    throw new Error(`账号名称需为 1-${MAX_REGISTRANT_NAME_LENGTH} 个字符`);
  }
  if (registrantName === "admin") {
    throw new Error("账号名称不可为 admin");
  }
  if (!input.registrant.password.trim()) {
    throw new Error("密码不能为空");
  }
  const phone = normalizeCnMobile(input.registrant.phone);
  if (!isValidCnMobile(phone)) {
    throw new Error("请输入有效的 11 位手机号码");
  }

  const companies = await ensureCompanyRegistry();
  if (companies.some((c) => c.name === name)) {
    throw new Error("该公司名称已存在");
  }
  if (companies.some((c) => c.id === registrantName)) {
    throw new Error("该公司名称已存在");
  }
  await assertPhoneAvailable(phone, companies);

  const company: CompanyInfo = {
    id: createShortId("company-"),
    name,
    createdAt: new Date().toISOString(),
    registrantName,
    phone,
  };

  const snapshot = createEmptyCompanySnapshot();
  snapshot.staffConfig.customStores = stores;
  snapshot.staffConfig.customStaff = [
    {
      id: createShortId("custom-"),
      name: registrantName,
      position: "设计经理",
      homeStore: HEADQUARTERS_STORE,
      role: roleForPositionAndAccess("设计经理", "design_manager"),
      password: input.registrant.password.trim(),
      accessLevel: "design_manager",
      permissions: permissionsTextForAccessLevel("design_manager"),
      phone,
    },
  ];

  await writeAppSnapshot(company.id, snapshot);
  await writeRegistry(sortCompanies([...companies, company]));
  notifyAdminOfNewCompany(company, registrantName, phone);
  return { company, snapshot };
}

function normalizeStores(raw: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of raw) {
    const trimmed = typeof item === "string" ? item.trim() : "";
    if (!trimmed || isReservedStoreName(trimmed)) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  if (result.length === 0) {
    throw new Error("至少需要添加一个门店");
  }
  if (result.length > MAX_STORES_PER_COMPANY) {
    throw new Error(`门店数量不能超过 ${MAX_STORES_PER_COMPANY} 个`);
  }
  return result;
}

export function isValidCompanyIdForLookup(id: string): boolean {
  return isValidCompanyId(id);
}

export type { StoreName };
