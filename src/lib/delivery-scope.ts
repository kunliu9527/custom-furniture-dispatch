import { getOrderStoreByDispatcher } from "./dispatchers";
import { resolveAssignedStoresForUser } from "./assigned-stores";
import {
  hasFullOrderScope,
  isAcceptanceManagerAccess,
  isInstallerSession,
  isPersonalAccess,
  isStoreScopedDesignManager,
  type SessionUser,
} from "./permissions";
import {
  filterOrdersByDispatcherAffiliatedStore,
  filterOrdersByDispatcherAffiliatedStores,
  isStoreManagerAccess,
  resolveManagedStoreForLookup,
  resolveUserHomeStore,
} from "./store-manager-scope";
import type { FlowOrderStatus, Order, StoreName } from "./types";

export const DELIVERY_FLOW_STATUSES: FlowOrderStatus[] = [
  "已下单",
  "已安装",
  "已验收",
];

function isDeliveryOrder(order: Order): boolean {
  return DELIVERY_FLOW_STATUSES.includes(order.status as FlowOrderStatus);
}

/** 订单是否与登录人本人岗位相关 */
export function isPersonallyRelatedOrder(
  user: SessionUser,
  order: Order,
): boolean {
  if (
    user.role === "dispatcher" &&
    order.dispatcherName === user.displayName
  ) {
    return true;
  }
  if (user.role === "designer" && order.designer === user.displayName) {
    return true;
  }
  const installer = order.installation?.installerName?.trim();
  if (installer && installer === user.displayName) {
    return true;
  }
  return false;
}

/**
 * 门店设计经理交付范围：所属门店 ∪ 本人关联订单的派单门店（B-备选）
 */
export function resolveDeliveryStoreScope(
  user: SessionUser,
  orders: Order[],
): StoreName[] {
  const stores = new Set<StoreName>();
  const assigned = resolveAssignedStoresForUser(user);
  if (assigned.length > 0) {
    for (const store of assigned) stores.add(store);
  } else {
    const managed = resolveManagedStoreForLookup(user);
    if (managed) stores.add(managed);
  }
  for (const order of orders) {
    if (!isPersonallyRelatedOrder(user, order)) continue;
    stores.add(getOrderStoreByDispatcher(order));
  }
  return [...stores];
}

/** 验收与交付板块订单范围 */
export function scopeOrdersForDelivery(
  orders: Order[],
  user: SessionUser | null,
): Order[] {
  if (!user) return [];
  const delivery = orders.filter(isDeliveryOrder);

  if (
    isAcceptanceManagerAccess(user) ||
    hasFullOrderScope(user) ||
    user.accessLevel === "admin"
  ) {
    return delivery;
  }

  if (isStoreManagerAccess(user)) {
    const store =
      resolveManagedStoreForLookup(user) ?? resolveUserHomeStore(user);
    return filterOrdersByDispatcherAffiliatedStore(delivery, store);
  }

  if (
    isStoreScopedDesignManager(user) ||
    ((user.accessLevel === "design_manager" ||
      user.accessLevel === "general_manager") &&
      resolveManagedStoreForLookup(user))
  ) {
    const stores = resolveDeliveryStoreScope(user, orders);
    if (stores.length === 0) return [];
    return filterOrdersByDispatcherAffiliatedStores(delivery, stores);
  }

  if (isPersonalAccess(user) && isInstallerSession(user)) {
    return delivery.filter(
      (o) =>
        (o.installation?.installerName?.trim() || "") === user.displayName,
    );
  }

  return [];
}

export function isPersonalInstallerDelivery(user: SessionUser | null): boolean {
  return Boolean(user && isPersonalAccess(user) && isInstallerSession(user));
}

/**
 * 验收与交付 · 按门店查找可见门店。
 * `null` = 全公司（验收经理 / 总部权限）；`[]` = 无门店 Tab；否则为允许门店列表。
 */
export function resolveDeliveryLookupStores(
  user: SessionUser,
  orders: Order[],
): StoreName[] | null {
  if (
    isAcceptanceManagerAccess(user) ||
    hasFullOrderScope(user) ||
    user.accessLevel === "admin"
  ) {
    return null;
  }

  if (isStoreManagerAccess(user)) {
    const store =
      resolveManagedStoreForLookup(user) ?? resolveUserHomeStore(user);
    return [store];
  }

  if (
    isStoreScopedDesignManager(user) ||
    ((user.accessLevel === "design_manager" ||
      user.accessLevel === "general_manager") &&
      resolveManagedStoreForLookup(user))
  ) {
    return resolveDeliveryStoreScope(user, orders);
  }

  return [];
}
