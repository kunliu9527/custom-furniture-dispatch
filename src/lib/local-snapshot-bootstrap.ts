import { normalizeCompanyId } from "./company";
import { LEGACY_STORAGE_KEYS } from "./constants";
import { ordersStorageKey } from "./app-storage-keys";
import { INITIAL_DATA } from "./initial-data";
import type { AppSnapshot } from "./server/snapshot-types";

/** 本地模式：从本机 Next /api/sync 拉一次指定公司的快照（读对应公司数据文件，非云端轮询） */
export async function fetchLocalDevSnapshot(
  companyId?: string,
): Promise<AppSnapshot | null> {
  try {
    const id = normalizeCompanyId(companyId);
    const query = id ? `?company=${encodeURIComponent(id)}` : "";
    const res = await fetch(`/api/sync${query}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as AppSnapshot;
  } catch {
    return null;
  }
}

export function readRawOrdersStorage(): string | null {
  if (typeof window === "undefined") return null;
  let raw = localStorage.getItem(ordersStorageKey());
  if (!raw) {
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      raw = localStorage.getItem(legacyKey);
      if (raw) break;
    }
  }
  return raw;
}

/** 是否尚无可用本地订单缓存（空 key 或 orders 为空数组） */
export function isLocalOrdersCacheEmpty(): boolean {
  const raw = readRawOrdersStorage();
  if (!raw) return true;
  try {
    const parsed = JSON.parse(raw) as { orders?: unknown[] };
    return !Array.isArray(parsed.orders) || parsed.orders.length === 0;
  } catch {
    return true;
  }
}

export function hasUsableLocalOrdersData(): boolean {
  return !isLocalOrdersCacheEmpty();
}

export function getLocalFallbackData() {
  return INITIAL_DATA;
}
