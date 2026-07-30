import type { Order } from "@/lib/types";
import {
  hasFullOrderScope,
  scopeOrdersForAdminBoard,
  scopeOrdersForUser,
  type SessionUser,
} from "@/lib/permissions";
import { ACCESS_LEVEL_LABELS } from "@/lib/staff-access";
import {
  formatManagedStoresLabel,
  resolveAssignedStoresForUser,
} from "@/lib/assigned-stores";
import { isHeadquartersStore } from "@/lib/stores";

/** 与首页 KPI 相同的订单可见范围 */
export function resolveAssistantScopedOrders(
  orders: Order[],
  user: SessionUser,
): Order[] {
  if (
    user.accessLevel === "design_manager" ||
    user.accessLevel === "general_manager" ||
    user.accessLevel === "admin" ||
    user.accessLevel === "store_manager"
  ) {
    return scopeOrdersForAdminBoard(orders, user);
  }
  return scopeOrdersForUser(orders, user);
}

export function describeAssistantDataScope(user: SessionUser): string {
  if (hasFullOrderScope(user)) {
    return "全站订单";
  }
  const assigned = formatManagedStoresLabel(resolveAssignedStoresForUser(user));
  if (assigned) {
    return `所属门店：${assigned}`;
  }
  if (user.homeStore && !isHeadquartersStore(user.homeStore)) {
    return `门店：${user.homeStore}`;
  }
  if (user.accessLevel === "personal" || user.role === "designer") {
    if (user.role === "designer") return `本人设计师订单（${user.displayName}）`;
    if (user.role === "dispatcher") return `本人派单订单（${user.displayName}）`;
  }
  if (user.accessLevel === "acceptance_manager") {
    return "验收与交付相关订单（全站可见范围内）";
  }
  return `${ACCESS_LEVEL_LABELS[user.accessLevel]}可见范围`;
}
