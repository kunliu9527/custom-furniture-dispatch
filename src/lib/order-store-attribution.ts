import {
  getDispatcherHomeStore,
  getOrderStoreByDispatcher,
} from "./dispatchers";
import type { StaffRecord } from "./staff-roster";
import type { Order, StoreName } from "./types";

/** 门店业绩 / 门店归总 / 派单人归属：派单人所属门店（跨店单计入派单人店） */
export function getOrderStoreByDispatcherAffiliation(
  order: Order,
  staffRecords: StaffRecord[] = [],
): StoreName {
  return getOrderStoreByDispatcher(order, staffRecords);
}

/** 设计师业绩 / 验收：订单派单门店 */
export function getOrderStoreByDispatchLocation(order: Order): StoreName {
  return order.dispatchStore;
}

export function orderBelongsToDispatcherStore(
  order: Order,
  store: StoreName,
  staffRecords: StaffRecord[] = [],
): boolean {
  return getOrderStoreByDispatcherAffiliation(order, staffRecords) === store;
}

export function orderBelongsToDispatchStore(
  order: Order,
  store: StoreName,
): boolean {
  return order.dispatchStore === store;
}

/** @deprecated 使用 {@link orderBelongsToDispatcherStore}（店级统计统一为派单人归属） */
export function orderBelongsToStoreSummary(
  order: Order,
  store: StoreName,
  staffRecords: StaffRecord[] = [],
): boolean {
  return orderBelongsToDispatcherStore(order, store, staffRecords);
}

export function filterOrdersByDispatcherStore(
  orders: Order[],
  store: StoreName | "全部",
  staffRecords: StaffRecord[] = [],
): Order[] {
  if (store === "全部") return orders;
  return orders.filter((o) => orderBelongsToDispatcherStore(o, store, staffRecords));
}

/** 设计师订单涉及的主要派单门店（多店时返回 undefined，由调用方展示「多店」） */
export function resolveDesignerDispatchStoreSubtitle(
  orders: Order[],
): StoreName | "多店" | undefined {
  const stores = new Set<StoreName>();
  for (const order of orders) {
    stores.add(order.dispatchStore);
  }
  if (stores.size === 0) return undefined;
  if (stores.size === 1) return [...stores][0];
  return "多店";
}
