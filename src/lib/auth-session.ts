import type { AuthUser } from "./auth-users";
import { findAuthUser } from "./auth-users";
import {
  AUTH_SESSION_STORAGE_KEY,
  LAST_LOGIN_USERNAME_KEY,
} from "./app-storage-keys";
import type { SessionUser } from "./permissions";
import { sessionUsersEqual } from "./session-user";

/** 空闲 2 小时无操作则失效 */
export const AUTH_IDLE_MS = 2 * 60 * 60 * 1000;

/** 登录后最长 12 小时（不随操作延长） */
export const AUTH_MAX_MS = 12 * 60 * 60 * 1000;

export const AUTH_CHECK_INTERVAL_MS = 60 * 1000;

export interface StoredAuthSession {
  user: SessionUser;
  loggedInAt: number;
  lastActiveAt: number;
  passwordRevision: string;
  /** 会话所属公司（默认公司为 undefined 以兼容旧会话） */
  companyId?: string;
}

export type SessionExpiryReason =
  | "idle"
  | "max"
  | "permission"
  | "password"
  | "account"
  | "invalid";

export function computePasswordRevision(authUser: AuthUser): string {
  return `${authUser.username}:${authUser.password}`;
}

export function createStoredAuthSession(
  user: SessionUser,
  authUser: AuthUser,
  now = Date.now(),
): StoredAuthSession {
  return {
    user,
    loggedInAt: now,
    lastActiveAt: now,
    passwordRevision: computePasswordRevision(authUser),
    companyId: user.companyId ?? authUser.companyId,
  };
}

export function readStoredAuthSession(): StoredAuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredAuthSession;
    if (
      !parsed?.user?.username ||
      typeof parsed.loggedInAt !== "number" ||
      typeof parsed.lastActiveAt !== "number" ||
      typeof parsed.passwordRevision !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredAuthSession(record: StoredAuthSession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(record));
}

export function clearStoredAuthSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
}

export function touchStoredAuthSession(now = Date.now()): void {
  const stored = readStoredAuthSession();
  if (!stored) return;
  writeStoredAuthSession({ ...stored, lastActiveAt: now });
}

export function checkStoredSessionExpiry(
  record: StoredAuthSession,
  now = Date.now(),
): SessionExpiryReason | null {
  if (now - record.loggedInAt > AUTH_MAX_MS) return "max";
  if (now - record.lastActiveAt > AUTH_IDLE_MS) return "idle";
  return null;
}

export function validateAuthSessionRecord(
  record: StoredAuthSession,
  authUsers: AuthUser[],
  now = Date.now(),
): SessionExpiryReason | null {
  const timeReason = checkStoredSessionExpiry(record, now);
  if (timeReason) return timeReason;

  const found = findAuthUser(authUsers, record.user.username);
  if (!found) return "account";

  if (computePasswordRevision(found) !== record.passwordRevision) {
    return "password";
  }

  const liveUser: SessionUser = {
    username: found.username,
    displayName: found.displayName,
    role: found.role,
    accessLevel: found.accessLevel,
    position: found.position,
    homeStore: found.homeStore,
    assignedStores: found.assignedStores,
    companyId: record.companyId,
  };

  if (!sessionUsersEqual(record.user, liveUser)) {
    return "permission";
  }

  return null;
}

export function loadLastLoginUsername(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(LAST_LOGIN_USERNAME_KEY)?.trim() ?? "";
}

export function saveLastLoginUsername(username: string): void {
  if (typeof window === "undefined") return;
  const trimmed = username.trim();
  if (!trimmed) return;
  localStorage.setItem(LAST_LOGIN_USERNAME_KEY, trimmed);
}

export function sessionExpiryMessage(reason: SessionExpiryReason): string {
  switch (reason) {
    case "permission":
      return "账号权限已变更，请重新登录";
    case "password":
      return "密码已变更，请重新登录";
    case "account":
      return "账号已失效，请重新登录";
    case "idle":
    case "max":
    case "invalid":
    default:
      return "登录已过期，请重新登录";
  }
}
