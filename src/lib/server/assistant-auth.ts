import { createHmac, timingSafeEqual } from "node:crypto";
import { buildAuthUsers, authenticate } from "@/lib/auth-users";
import type { SessionUser } from "@/lib/permissions";
import {
  DEFAULT_COMPANY_ID,
  isDefaultCompany,
  normalizeCompanyId,
} from "@/lib/company";
import { readAppSnapshot } from "@/lib/server/app-store";
import type { AppSnapshot } from "@/lib/server/snapshot-types";
import { computePasswordRevision } from "@/lib/auth-session";

function assistantSecret(): string {
  return (
    process.env.ASSISTANT_HMAC_SECRET?.trim() ||
    process.env.SYNC_API_KEY?.trim() ||
    process.env.DIGEST_PUSH_KEY?.trim() ||
    "dev-assistant-secret"
  );
}

function signPayload(payload: string): string {
  return createHmac("sha256", assistantSecret())
    .update(payload)
    .digest("base64url");
}

/** 登录后签发，短时有效；载荷不含明文密码，携带所属公司 */
export function mintAssistantToken(
  username: string,
  passwordRevision: string,
  companyId?: string,
  ttlMs = 12 * 60 * 60 * 1000,
): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + ttlMs;
  const company = companyId ?? DEFAULT_COMPANY_ID;
  const payload = `${username}\n${expiresAt}\n${passwordRevision}\n${company}`;
  const sig = signPayload(payload);
  const token = Buffer.from(`${payload}\n${sig}`, "utf8").toString("base64url");
  return { token, expiresAt };
}

export function verifyAssistantToken(
  token: string,
): { username: string; passwordRevision: string; companyId: string } | null {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parts = raw.split("\n");
    // 新版：username\n expiresAt\n passwordRevision\n companyId\n sig
    if (parts.length === 5) {
      const [username, expStr, passwordRevision, companyId, sig] = parts;
      const expiresAt = Number(expStr);
      if (
        !username ||
        !passwordRevision ||
        !companyId ||
        !sig ||
        !Number.isFinite(expiresAt)
      ) {
        return null;
      }
      if (Date.now() > expiresAt) return null;
      const payload = `${username}\n${expiresAt}\n${passwordRevision}\n${companyId}`;
      const expected = signPayload(payload);
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
      return {
        username,
        passwordRevision,
        companyId: normalizeCompanyId(companyId),
      };
    }
    // 旧版（无公司）→ 默认公司
    if (parts.length === 4) {
      const [username, expStr, passwordRevision, sig] = parts;
      const expiresAt = Number(expStr);
      if (
        !username ||
        !passwordRevision ||
        !sig ||
        !Number.isFinite(expiresAt)
      ) {
        return null;
      }
      if (Date.now() > expiresAt) return null;
      const payload = `${username}\n${expiresAt}\n${passwordRevision}`;
      const expected = signPayload(payload);
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
      return {
        username,
        passwordRevision,
        companyId: DEFAULT_COMPANY_ID,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function sessionUserFromAuth(
  auth: {
    username: string;
    displayName: string;
    role: SessionUser["role"];
    accessLevel: SessionUser["accessLevel"];
    position: string;
    homeStore?: SessionUser["homeStore"];
    assignedStores?: SessionUser["assignedStores"];
  },
  companyId?: string,
): SessionUser {
  return {
    username: auth.username,
    displayName: auth.displayName,
    role: auth.role,
    accessLevel: auth.accessLevel,
    position: auth.position,
    homeStore: auth.homeStore,
    assignedStores: auth.assignedStores,
    companyId: companyId ? normalizeCompanyId(companyId) : undefined,
  };
}

function buildUsersForCompany(companyId: string, snapshot: AppSnapshot) {
  return buildAuthUsers(
    snapshot.staffConfig.customStaff,
    snapshot.staffConfig.accessOverrides,
    snapshot.staffConfig.passwordOverrides,
    snapshot.staffConfig.homeStoreOverrides,
    snapshot.staffConfig.extraStoreOverrides,
    snapshot.staffConfig.phoneOverrides,
    {
      includeBuiltins: isDefaultCompany(companyId),
      companyId: normalizeCompanyId(companyId),
    },
  );
}

export async function resolveAssistantActor(input: {
  token?: string;
  username?: string;
  password?: string;
  companyId?: string;
}): Promise<
  | { ok: true; user: SessionUser; snapshot: AppSnapshot }
  | { ok: false; error: string; status: number }
> {
  if (input.token) {
    const parsed = verifyAssistantToken(input.token);
    if (!parsed) {
      return { ok: false, error: "助手登录已失效，请重新打开对话", status: 401 };
    }
    const companyId = normalizeCompanyId(parsed.companyId);
    const snapshot = await readAppSnapshot(companyId);
    const users = buildUsersForCompany(companyId, snapshot);
    const auth = users.find((u) => u.username === parsed.username);
    if (!auth || computePasswordRevision(auth) !== parsed.passwordRevision) {
      return { ok: false, error: "账号权限已变更，请重新登录", status: 401 };
    }
    return {
      ok: true,
      user: sessionUserFromAuth(auth, companyId),
      snapshot,
    };
  }

  const companyId = normalizeCompanyId(input.companyId);
  const snapshot = await readAppSnapshot(companyId);
  const users = buildUsersForCompany(companyId, snapshot);

  if (input.username && input.password != null) {
    const auth = authenticate(users, input.username, input.password);
    if (!auth) {
      return { ok: false, error: "账号或密码错误", status: 401 };
    }
    return {
      ok: true,
      user: sessionUserFromAuth(auth, companyId),
      snapshot,
    };
  }

  return { ok: false, error: "未授权", status: 401 };
}
