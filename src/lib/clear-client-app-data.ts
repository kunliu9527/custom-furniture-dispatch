import {
  APP_STORAGE_PREFIX,
  AUTH_STORAGE_KEY,
  AUTH_SESSION_STORAGE_KEY,
  AUTHOR_CREDIT_STORAGE_KEY,
  DIGEST_HISTORY_STORAGE_PREFIX,
  isAppLocalStorageKey,
  isAppSessionStorageKey,
  LEGACY_ORDERS_STORAGE_KEYS,
  ordersStorageKey,
  SESSION_UI_KEY_PREFIXES,
  STAFF_CONFIG_STORAGE_KEYS,
} from "./app-storage-keys";

function removeLocalStorageKeys(keys: readonly string[]): void {
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}

function removeSessionKeysForUser(username: string): void {
  for (const prefix of SESSION_UI_KEY_PREFIXES) {
    sessionStorage.removeItem(`${prefix}${username}`);
  }
}

function removeDigestHistoryForUser(username: string): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(DIGEST_HISTORY_STORAGE_PREFIX)) continue;
    if (key.endsWith(`:${username}`)) keysToRemove.push(key);
  }
  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
}

/** 退出登录：清除会话 UI、简报归档、跟进确认等（保留订单与人员名册） */
export function clearClientSessionRecordsForUser(username: string | undefined): void {
  if (typeof window === "undefined" || !username) return;
  removeSessionKeysForUser(username);
  removeDigestHistoryForUser(username);
}

/** 清除全部简报归档（所有用户） */
export function clearAllDigestHistory(): void {
  if (typeof window === "undefined") return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(DIGEST_HISTORY_STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
}

/** 清除浏览器内全部应用数据（登录、订单、人员覆盖、UI 态、简报归档） */
export function clearAllClientAppData(): void {
  if (typeof window === "undefined") return;

  const localKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && isAppLocalStorageKey(key)) {
      localKeys.push(key);
    }
  }
  for (const key of localKeys) {
    localStorage.removeItem(key);
  }
  localStorage.removeItem(AUTHOR_CREDIT_STORAGE_KEY);

  const sessionKeys: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && isAppSessionStorageKey(key)) {
      sessionKeys.push(key);
    }
  }
  for (const key of sessionKeys) {
    sessionStorage.removeItem(key);
  }
  sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

/** 重新初始化本地：清空缓存并刷新（需配合服务端 snapshot 重置） */
export function reinitializeClientApp(): void {
  clearAllClientAppData();
  window.location.href = "/";
}

/** 仅重置订单 localStorage 为给定 JSON（orders-context 外部工具用） */
export function writeFreshOrdersLocalStorage(payload: {
  orders: unknown[];
  supplements: unknown[];
}): void {
  if (typeof window === "undefined") return;
  removeLocalStorageKeys([...LEGACY_ORDERS_STORAGE_KEYS]);
  localStorage.setItem(
    ordersStorageKey(),
    JSON.stringify({
      orders: payload.orders,
      supplements: payload.supplements,
    }),
  );
}

export {
  AUTH_STORAGE_KEY,
  STAFF_CONFIG_STORAGE_KEYS,
  APP_STORAGE_PREFIX,
};
