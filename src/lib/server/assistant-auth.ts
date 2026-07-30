import { createHmac, timingSafeEqual } from "node:crypto";
import { buildAuthUsers, authenticate } from "@/lib/auth-users";
import type { SessionUser } from "@/lib/permissions";
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

/** 登录后签发，短时有效；载荷不含明文密码 */
export function mintAssistantToken(
  username: string,
  passwordRevision: string,
  ttlMs = 12 * 60 * 60 * 1000,
): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + ttlMs;
  const payload = `${username}\n${expiresAt}\n${passwordRevision}`;
  const sig = createHmac("sha256", assistantSecret())
    .update(payload)
    .digest("base64url");
  const token = Buffer.from(`${payload}\n${sig}`, "utf8").toString("base64url");
  return { token, expiresAt };
}

export function verifyAssistantToken(
  token: string,
): { username: string; passwordRevision: string } | null {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parts = raw.split("\n");
    if (parts.length !== 4) return null;
    const [username, expStr, passwordRevision, sig] = parts;
    const expiresAt = Number(expStr);
    if (!username || !passwordRevision || !sig || !Number.isFinite(expiresAt)) {
      return null;
    }
    if (Date.now() > expiresAt) return null;
    const payload = `${username}\n${expiresAt}\n${passwordRevision}`;
    const expected = createHmac("sha256", assistantSecret())
      .update(payload)
      .digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return { username, passwordRevision };
  } catch {
    return null;
  }
}

export function sessionUserFromAuth(auth: {
  username: string;
  displayName: string;
  role: SessionUser["role"];
  accessLevel: SessionUser["accessLevel"];
  position: string;
  homeStore?: SessionUser["homeStore"];
  assignedStores?: SessionUser["assignedStores"];
}): SessionUser {
  return {
    username: auth.username,
    displayName: auth.displayName,
    role: auth.role,
    accessLevel: auth.accessLevel,
    position: auth.position,
    homeStore: auth.homeStore,
    assignedStores: auth.assignedStores,
  };
}

export async function resolveAssistantActor(input: {
  token?: string;
  username?: string;
  password?: string;
}): Promise<
  | { ok: true; user: SessionUser; snapshot: AppSnapshot }
  | { ok: false; error: string; status: number }
> {
  const snapshot = await readAppSnapshot();
  const users = buildAuthUsers(
    snapshot.staffConfig.customStaff,
    snapshot.staffConfig.accessOverrides,
    snapshot.staffConfig.passwordOverrides,
    snapshot.staffConfig.homeStoreOverrides,
    snapshot.staffConfig.extraStoreOverrides,
    snapshot.staffConfig.phoneOverrides,
  );

  if (input.token) {
    const parsed = verifyAssistantToken(input.token);
    if (!parsed) {
      return { ok: false, error: "助手登录已失效，请重新打开对话", status: 401 };
    }
    const auth = users.find((u) => u.username === parsed.username);
    if (!auth || computePasswordRevision(auth) !== parsed.passwordRevision) {
      return { ok: false, error: "账号权限已变更，请重新登录", status: 401 };
    }
    return {
      ok: true,
      user: sessionUserFromAuth(auth),
      snapshot,
    };
  }

  if (input.username && input.password != null) {
    const auth = authenticate(users, input.username, input.password);
    if (!auth) {
      return { ok: false, error: "账号或密码错误", status: 401 };
    }
    return {
      ok: true,
      user: sessionUserFromAuth(auth),
      snapshot,
    };
  }

  return { ok: false, error: "未授权", status: 401 };
}
