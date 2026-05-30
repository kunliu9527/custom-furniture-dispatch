import { LEGACY_STORAGE_KEYS, STORAGE_KEY } from "./constants";
import { INITIAL_DATA } from "./initial-data";
import type { AppSnapshot } from "./server/snapshot-types";

/** 本地模式：从本机 Next /api/sync 拉一次快照（读 data/snapshot.json，非云端轮询） */
export async function fetchLocalDevSnapshot(): Promise<AppSnapshot | null> {
  try {
    const res = await fetch("/api/sync", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as AppSnapshot;
  } catch {
    return null;
  }
}

export function readRawOrdersStorage(): string | null {
  if (typeof window === "undefined") return null;
  let raw = localStorage.getItem(STORAGE_KEY);
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
