import type { CompanyInfo } from "./company";
import type { AppSnapshot } from "./server/snapshot-types";
import { apiFetch } from "./client-api";

/** 公司列表（id + name），供登录下拉、管理员切换公司使用 */
export async function fetchCompanies(): Promise<CompanyInfo[]> {
  const res = await apiFetch("/api/companies", { cache: "no-store" });
  if (!res.ok) throw new Error("读取公司列表失败");
  return (await res.json()) as CompanyInfo[];
}

export interface RegisterCompanyInput {
  name: string;
  stores: string[];
  registrant: { name: string; password: string; phone: string };
}

/** 注册新公司：创建公司 + 空数据快照 + 注册者账号（个人版设计经理） */
export async function registerCompany(
  input: RegisterCompanyInput,
): Promise<{ company: CompanyInfo; snapshot: AppSnapshot }> {
  const res = await apiFetch("/api/companies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? "注册失败");
  }
  return (await res.json()) as { company: CompanyInfo; snapshot: AppSnapshot };
}
