import type { Order, StoreName } from "./types";

export type { DesignerHomeStoreIndex } from "./designer-staff-store";
export {
  buildDesignerHomeStoreIndex,
  filterOrdersByDesignerHomeStores,
  getEffectiveDesignerHomeStore,
  getEffectiveDesignerRoster,
  getEffectiveDesignersInStores,
  isCrossStoreOrderForDesigner,
  isOrderCrossStoreForDesigner,
} from "./designer-staff-store";

export const STORES = [
  "东岸天冠",
  "东岸万象",
  "高桥天冠",
  "郁金香天冠",
  "郁金香万象",
] as const satisfies readonly StoreName[];

export const DESIGNER_ROSTER = [
  { name: "汤雷", homeStore: "东岸天冠" },
  { name: "唐姣君", homeStore: "东岸天冠" },
  { name: "练汪理", homeStore: "东岸万象" },
  { name: "刘鑫", homeStore: "东岸万象" },
  { name: "钱海霞", homeStore: "东岸万象" },
  { name: "周坤", homeStore: "高桥天冠" },
  { name: "李炜浪", homeStore: "高桥天冠" },
  { name: "罗晨", homeStore: "高桥天冠" },
  { name: "伏迪胜", homeStore: "郁金香天冠" },
  { name: "刘芸", homeStore: "郁金香天冠" },
  { name: "欧伟明", homeStore: "郁金香万象" },
  { name: "肖亮斌", homeStore: "郁金香万象" },
  { name: "汤勇", homeStore: "郁金香万象" },
  { name: "何美玲", homeStore: "郁金香万象" },
] as const satisfies readonly { name: string; homeStore: StoreName }[];

export type DesignerName = (typeof DESIGNER_ROSTER)[number]["name"];

export function getDesignerHomeStore(name: DesignerName): StoreName {
  const found = DESIGNER_ROSTER.find((d) => d.name === name);
  if (!found) return "东岸天冠";
  return found.homeStore;
}

/** @deprecated 使用 {@link getEffectiveDesignerHomeStore} + 人员名册索引 */
export function getDesignersInStore(store: StoreName) {
  return DESIGNER_ROSTER.filter((d) => d.homeStore === store);
}

/** @deprecated 使用 {@link getEffectiveDesignersInStores} */
export function getDesignersInStores(stores: StoreName[]) {
  const allowed = new Set(stores);
  return DESIGNER_ROSTER.filter((d) => allowed.has(d.homeStore));
}

export function getDefaultDesignerForStore(store: StoreName): DesignerName {
  return getDesignersInStore(store)[0]?.name ?? DESIGNER_ROSTER[0].name;
}

export function sortByHomeStore<T extends { homeStore: StoreName }>(
  items: readonly T[],
  preferredStore: StoreName | null | undefined,
): T[] {
  if (!preferredStore) return [...items];
  const same = items.filter((d) => d.homeStore === preferredStore);
  const rest = items.filter((d) => d.homeStore !== preferredStore);
  return [...same, ...rest];
}

export function sortStoresByPreferred(
  stores: readonly StoreName[],
  preferredStore: StoreName | null | undefined,
): StoreName[] {
  if (!preferredStore) return [...stores];
  const rest = stores.filter((s) => s !== preferredStore);
  return [preferredStore, ...rest];
}

export function isCrossStoreOrder(
  dispatchStore: StoreName,
  designer: DesignerName,
): boolean {
  return dispatchStore !== getDesignerHomeStore(designer);
}

/** 带人员名册索引的跨店判断（管理员改门店后即时生效） */
export { isCrossStoreOrderForDesigner as isCrossStoreOrderWithIndex } from "./designer-staff-store";

export function formatDeposit(deposit: number): string {
  if (deposit <= 0) return "未交定金";
  return `¥${deposit.toLocaleString("zh-CN")}`;
}
