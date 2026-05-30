import {
  getDispatcherHomeStore,
  getEffectiveDispatcherRoster,
  getOrderStoreByDispatcher,
} from "./dispatchers";
import type { SessionUser } from "./permissions";
import {
  getEffectiveDesignerHomeStore,
  type DesignerHomeStoreIndex,
} from "./designer-staff-store";
import { getDesignerHomeStore } from "./designers";
import { createEmptyStatusCounts } from "./manager-stats";
import type { StaffRecord } from "./staff-roster";
import type { DesignerName, Order, OrderStatus, StoreName } from "./types";
import { isHeadquartersStore } from "./stores";

export function isStoreManagerAccess(user: SessionUser | null): boolean {
  return user?.accessLevel === "store_manager";
}

/** 店长/派单人所属门店（用于数据范围） */
export function resolveUserHomeStore(user: SessionUser): StoreName {
  if (user.homeStore && !isHeadquartersStore(user.homeStore)) {
    return user.homeStore;
  }
  if (user.role === "dispatcher") {
    return getDispatcherHomeStore(user.displayName, "东岸天冠");
  }
  if (user.role === "designer") {
    if (user.homeStore && !isHeadquartersStore(user.homeStore)) {
      return user.homeStore;
    }
    return getDesignerHomeStore(user.displayName as DesignerName);
  }
  return "东岸天冠";
}

/** 派单录入页：按账号所属门店作为默认/优先（全公司权限且无 homeStore 时不偏置） */
export function resolveDispatchPreferredStore(
  user: SessionUser | null,
): StoreName | null {
  if (!user) return null;
  if (user.homeStore && !isHeadquartersStore(user.homeStore)) {
    return user.homeStore;
  }
  if (
    user.role === "dispatcher" ||
    user.role === "designer" ||
    isStoreManagerAccess(user)
  ) {
    return resolveUserHomeStore(user);
  }
  return null;
}

/** 店长 / 本店设计经理 / 非总部总经理：运营看板与查找的数据范围门店 */
export function resolveManagedStoreForLookup(
  user: SessionUser | null,
): StoreName | null {
  if (!user) return null;
  if (isStoreManagerAccess(user)) {
    return resolveUserHomeStore(user);
  }
  if (
    (user.accessLevel === "design_manager" ||
      user.accessLevel === "general_manager") &&
    user.homeStore &&
    !isHeadquartersStore(user.homeStore)
  ) {
    return user.homeStore;
  }
  return null;
}

/** 订单归属门店 = 派单人所属门店 */
export function filterOrdersByDispatcherAffiliatedStore(
  orders: Order[],
  store: StoreName,
): Order[] {
  return orders.filter((o) => getOrderStoreByDispatcher(o) === store);
}

/** 多门店数据范围 */
export function filterOrdersByDispatcherAffiliatedStores(
  orders: Order[],
  stores: StoreName[],
): Order[] {
  if (stores.length === 0) return orders;
  if (stores.length === 1) {
    return filterOrdersByDispatcherAffiliatedStore(orders, stores[0]);
  }
  const allowed = new Set(stores);
  return orders.filter((o) => allowed.has(getOrderStoreByDispatcher(o)));
}

export function getDispatcherNamesInStore(
  store: StoreName,
  staffRecords: StaffRecord[] = [],
): string[] {
  return getEffectiveDispatcherRoster(staffRecords)
    .filter((d) => d.homeStore === store)
    .map((d) => d.name);
}

export interface StoreDesignerOrderStats {
  designer: string;
  homeStore: StoreName;
  total: number;
  byStatus: Record<OrderStatus, number>;
}

/** 按门店订单中出现的设计师汇总（店长看板用） */
export function getDesignerStatsFromStoreOrders(
  orders: Order[],
  designerStoreIndex?: DesignerHomeStoreIndex,
): StoreDesignerOrderStats[] {
  const map = new Map<string, Order[]>();

  for (const order of orders) {
    const key = order.designer ?? "未指派";
    const list = map.get(key) ?? [];
    list.push(order);
    map.set(key, list);
  }

  return [...map.entries()]
    .map(([designer, designerOrders]) => {
      const byStatus = createEmptyStatusCounts();
      for (const order of designerOrders) {
        byStatus[order.status] += 1;
      }
      return {
        designer,
        homeStore: designerStoreIndex
          ? getEffectiveDesignerHomeStore(designer, designerStoreIndex)
          : getDesignerHomeStore(designer as DesignerName),
        total: designerOrders.length,
        byStatus,
      };
    })
    .sort(
      (a, b) =>
        b.total - a.total ||
        a.designer.localeCompare(b.designer, "zh-CN"),
    );
}
