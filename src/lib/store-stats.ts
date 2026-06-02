import { orderBelongsToDispatcherStore } from "./order-store-attribution";
import { STORES } from "./designers";
import { createEmptyStatusCounts } from "./manager-stats";
import type { Order, OrderStatus, StoreName } from "./types";

export interface StoreOrderStats {
  store: StoreName;
  total: number;
  byStatus: Record<OrderStatus, number>;
}

export function getStoreStatsByDispatcher(orders: Order[]): StoreOrderStats[] {
  return STORES.map((store) => {
    const storeOrders = orders.filter((o) =>
      orderBelongsToDispatcherStore(o, store),
    );
    const byStatus = createEmptyStatusCounts();
    for (const order of storeOrders) {
      byStatus[order.status] += 1;
    }
    return { store, total: storeOrders.length, byStatus };
  });
}

/** @deprecated 按门店汇总请使用 {@link getStoreStatsByDispatcher} */
export function getStoreStatsByDesigner(orders: Order[]): StoreOrderStats[] {
  return getStoreStatsByDispatcher(orders);
}

export function filterStoreStatsByStores(
  stats: StoreOrderStats[],
  stores: StoreName[],
): StoreOrderStats[] {
  if (stores.length === 0) return stats;
  const allowed = new Set(stores);
  return stats.filter((item) => allowed.has(item.store));
}

export function filterOrdersByDesignerStore(
  orders: Order[],
  store: StoreName | "全部",
): Order[] {
  return filterOrdersByDispatcherStore(orders, store);
}

export function filterOrdersByDispatcherStore(
  orders: Order[],
  store: StoreName | "全部",
): Order[] {
  if (store === "全部") return orders;
  return orders.filter((o) => orderBelongsToDispatcherStore(o, store));
}
