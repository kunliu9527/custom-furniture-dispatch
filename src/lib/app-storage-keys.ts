import { companyQualifiedKey } from "./active-company";
import {
  CUSTOM_POSITIONS_STORAGE_KEY,
  CUSTOM_STORES_STORAGE_KEY,
} from "./staff-config-storage";
import { STAFF_PASSWORD_STORAGE_KEY } from "./staff-password-storage";

/** 浏览器端应用数据前缀 */
export const APP_STORAGE_PREFIX = "custom-furniture-dispatch-";

export const AUTH_STORAGE_KEY = `${APP_STORAGE_PREFIX}auth-v1`;

/** @deprecated 登录态已迁至 sessionStorage；保留键名供清理旧数据 */
export const LEGACY_AUTH_STORAGE_KEY = AUTH_STORAGE_KEY;

export const AUTH_SESSION_STORAGE_KEY = `${APP_STORAGE_PREFIX}auth-session-v1`;

export const LAST_LOGIN_USERNAME_KEY = `${APP_STORAGE_PREFIX}last-login-username`;

export const ORDERS_STORAGE_KEY = `${APP_STORAGE_PREFIX}data-v13`;

/** 当前公司生效的订单本地镜像 key（默认公司保持原 key，其它公司带公司后缀） */
export function ordersStorageKey(): string {
  return companyQualifiedKey(ORDERS_STORAGE_KEY);
}

export const LEGACY_ORDERS_STORAGE_KEYS = [
  `${APP_STORAGE_PREFIX}data-v12`,
  `${APP_STORAGE_PREFIX}data-v11`,
] as const;

export const COMMISSION_SETTINGS_STORAGE_KEY = `${APP_STORAGE_PREFIX}commission-settings-v1`;

export const STAFF_CONFIG_STORAGE_KEYS = [
  COMMISSION_SETTINGS_STORAGE_KEY,
  `${APP_STORAGE_PREFIX}site-branding-v1`,
  `${APP_STORAGE_PREFIX}staff-v1`,
  `${APP_STORAGE_PREFIX}staff-access-v1`,
  `${APP_STORAGE_PREFIX}staff-home-store-v1`,
  `${APP_STORAGE_PREFIX}staff-extra-stores-v1`,
  `${APP_STORAGE_PREFIX}staff-phone-v1`,
  STAFF_PASSWORD_STORAGE_KEY,
  `${APP_STORAGE_PREFIX}staff-removed-v1`,
  CUSTOM_POSITIONS_STORAGE_KEY,
  CUSTOM_STORES_STORAGE_KEY,
] as const;

/** sessionStorage：各板块 UI 与操作确认态 */
export const SESSION_UI_KEY_PREFIXES = [
  `${APP_STORAGE_PREFIX}admin-ui:`,
  `${APP_STORAGE_PREFIX}manager-ui:`,
  `${APP_STORAGE_PREFIX}designer-ui:`,
  `${APP_STORAGE_PREFIX}delivery-ui:`,
  `${APP_STORAGE_PREFIX}evaluation-ui:`,
  `${APP_STORAGE_PREFIX}workbench-period:`,
  `${APP_STORAGE_PREFIX}digest-read:`,
  `${APP_STORAGE_PREFIX}follow-up-ack:`,
] as const;

export const DIGEST_HISTORY_STORAGE_PREFIX = `${APP_STORAGE_PREFIX}digest-history:`;

export const AUTHOR_CREDIT_STORAGE_KEY = "author-credit-clicks";

export function isStaffConfigStorageKey(key: string | null): boolean {
  if (!key) return false;
  // 兼容默认公司的原 key 与其它公司的 `${key}:${companyId}` 后缀 key
  return (STAFF_CONFIG_STORAGE_KEYS as readonly string[]).some(
    (base) => key === base || key.startsWith(`${base}:`),
  );
}

export function isAppLocalStorageKey(key: string): boolean {
  return (
    key.startsWith(APP_STORAGE_PREFIX) || key === AUTHOR_CREDIT_STORAGE_KEY
  );
}

export function isAppSessionStorageKey(key: string): boolean {
  return key.startsWith(APP_STORAGE_PREFIX);
}
