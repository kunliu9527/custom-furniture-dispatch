import { STORES } from "./designers";
import { loadCustomStoreNames } from "./staff-config-storage";
import type { StoreName } from "./types";

export const HEADQUARTERS_STORE = "总部" as const satisfies StoreName;

/** 订单派单/统计用实体门店（不含总部） */
export const PHYSICAL_STORES = [...STORES] as const;

function dedupeStoreNames(names: string[]): StoreName[] {
  const seen = new Set<string>();
  const result: StoreName[] = [];
  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed as StoreName);
  }
  return result;
}

/** 内置 + 自定义实体门店（不含总部） */
export function getMergedPhysicalStores(): StoreName[] {
  return dedupeStoreNames([...PHYSICAL_STORES, ...loadCustomStoreNames()]);
}

/** 派单录入等使用的门店列表 */
export function getDispatchStoreOptions(): StoreName[] {
  return getMergedPhysicalStores();
}

/** 人员管理 · 门店设置可选项（含总部） */
export function getStaffStoreSettingOptions(): StoreName[] {
  return dedupeStoreNames([
    ...getMergedPhysicalStores(),
    HEADQUARTERS_STORE,
  ]);
}

export function isHeadquartersStore(
  store: StoreName | undefined | null,
): boolean {
  return store === HEADQUARTERS_STORE;
}

export function isBuiltinPhysicalStore(name: string): boolean {
  return (PHYSICAL_STORES as readonly string[]).includes(name);
}

/** @deprecated 使用 getStaffStoreSettingOptions */
export function getStaffHomeStoreOptions(
  _position?: string,
  _accessLevel?: string,
): StoreName[] {
  return getStaffStoreSettingOptions();
}
