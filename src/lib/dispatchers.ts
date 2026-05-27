import { normalizeDispatcherName } from "./admin-stats";
import type { Order, StoreName } from "./types";

/** 派单人所属门店（静态名册，来源：2026 直营门店订单数据归纳） */
export const DISPATCHER_ROSTER = [
  { name: "曾丹", homeStore: "郁金香天冠" },
  { name: "江庆华", homeStore: "高桥天冠" },
  { name: "罗丹", homeStore: "东岸万象" },
  { name: "彭慧敏", homeStore: "东岸万象" },
  { name: "盛慧", homeStore: "东岸天冠" },
  { name: "石薇", homeStore: "东岸天冠" },
  { name: "帅菊元", homeStore: "高桥天冠" },
  { name: "夏丹丹", homeStore: "东岸天冠" },
  { name: "肖金", homeStore: "郁金香万象" },
  { name: "熊美珍", homeStore: "高桥天冠" },
  { name: "杨金林", homeStore: "郁金香万象" },
  { name: "杨永", homeStore: "郁金香天冠" },
  { name: "袁环宇", homeStore: "东岸天冠" },
  { name: "周红艳", homeStore: "东岸天冠" },
  { name: "周静", homeStore: "东岸万象" },
  { name: "周琴", homeStore: "郁金香天冠" },
] as const satisfies readonly { name: string; homeStore: StoreName }[];

export type DispatcherName = (typeof DISPATCHER_ROSTER)[number]["name"];

export function getDispatcherHomeStore(
  dispatcherName: string,
  fallback?: StoreName,
): StoreName {
  const name = normalizeDispatcherName(dispatcherName);
  if (name === "未填写") {
    return fallback ?? "东岸天冠";
  }
  const found = DISPATCHER_ROSTER.find((d) => d.name === name);
  if (found) return found.homeStore;
  return fallback ?? "东岸天冠";
}

export function getDispatchersInStore(store: StoreName) {
  return DISPATCHER_ROSTER.filter((d) => d.homeStore === store);
}

export function getDefaultDispatcherForStore(store: StoreName): string {
  return getDispatchersInStore(store)[0]?.name ?? DISPATCHER_ROSTER[0].name;
}

/** 店长看板：订单归属门店 = 派单人所属门店（名册外派单人用该单派单门店） */
export function getOrderStoreByDispatcher(order: Order): StoreName {
  return getDispatcherHomeStore(order.dispatcherName, order.dispatchStore);
}

/** 按门店汇总 / 筛选：派单门店一致，或派单人所属门店一致 */
export function orderBelongsToStoreSummary(
  order: Order,
  store: StoreName,
): boolean {
  if (order.dispatchStore === store) return true;
  return getDispatcherHomeStore(order.dispatcherName, order.dispatchStore) === store;
}
