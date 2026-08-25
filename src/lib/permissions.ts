import { normalizeDispatcherName } from "./admin-stats";
import { getOrderStoreByDispatcher } from "./dispatchers";
import { filterOrdersByDesignerHomeStores } from "./designer-staff-store";
import { buildDesignerHomeStoreIndex } from "./designer-staff-store";
import type { StaffRecord } from "./staff-roster";
import type { StaffAccessLevel } from "./staff-access";
import type { UserRole } from "./staff-roster";
import {
  filterOrdersByDispatcherAffiliatedStore,
  filterOrdersByDispatcherAffiliatedStores,
  isStoreManagerAccess,
  resolveManagedStoreForLookup,
  resolveUserHomeStore,
} from "./store-manager-scope";
import { resolveAssignedStoresForUser } from "./assigned-stores";
import { isHeadquartersStore } from "./stores";
import { ADMIN_ONLY_REVERT_STATUSES } from "./constants";
import type { FlowOrderStatus, Order } from "./types";

import type { StoreName } from "./types";

export {
  isStoreManagerAccess,
  resolveManagedStoreForLookup,
  resolveUserHomeStore,
} from "./store-manager-scope";
export { resolveAssignedStoresForUser } from "./assigned-stores";

/** 设计师查找：限定为所属门店名册（总部/管理员不限） */
export function resolveDesignerLookupStores(
  user: SessionUser | null,
): StoreName[] | null {
  if (!user || hasFullOrderScope(user)) return null;
  const assigned = resolveAssignedStoresForUser(user);
  if (assigned.length > 0) return assigned;
  const managed = resolveManagedStoreForLookup(user);
  return managed ? [managed] : null;
}

export interface SessionUser {
  username: string;
  displayName: string;
  role: UserRole;
  accessLevel: StaffAccessLevel;
  /** 人员岗位（派单人 / 设计师 / 安装师等） */
  position?: string;
  homeStore?: StoreName;
  /** 设计经理所属实体门店（最多 3 个） */
  assignedStores?: StoreName[];
  /** 所属公司（默认公司为 undefined，兼容旧会话/旧数据） */
  companyId?: string;
}

/** 当前用户是否跨公司总管理员（admin 属于任意公司，权限不因公司切换改变） */
export function isGlobalAdmin(user: SessionUser | null): boolean {
  return user?.accessLevel === "admin";
}

export function isInstallerSession(user: SessionUser | null): boolean {
  return user?.position === "安装师";
}

/** 本人·派单人/设计师：项目节点含本周简报与订单查询 */
export function isPersonalManagerLookupOnly(
  user: SessionUser | null,
): boolean {
  if (!user || !isPersonalAccess(user) || isInstallerSession(user)) {
    return false;
  }
  return user.role === "dispatcher" || user.role === "designer";
}

export function isAdminAccess(user: SessionUser | null): boolean {
  return user?.accessLevel === "admin";
}

/** 设计经理且有所属实体门店（非总部） */
export function isStoreScopedDesignManager(
  user: SessionUser | null,
): boolean {
  return (
    (user?.accessLevel === "design_manager" ||
      user?.accessLevel === "general_manager") &&
    resolveAssignedStoresForUser(user).length > 0
  );
}

/** 设计经理且所属门店为总部（或未指定）→ 等同管理员数据范围 */
export function isHeadquartersDesignManager(
  user: SessionUser | null,
): boolean {
  if (
    user?.accessLevel !== "design_manager" &&
    user?.accessLevel !== "general_manager"
  ) {
    return false;
  }
  return !user.homeStore || isHeadquartersStore(user.homeStore);
}

/** 店长或本店设计经理：查找范围限定为所在门店 */
export function hasStoreLevelLookupScope(user: SessionUser | null): boolean {
  return isStoreManagerAccess(user) || isStoreScopedDesignManager(user);
}

/** 设计经理 / 总经理 / 管理员 */
export function isDesignManagerAccess(user: SessionUser | null): boolean {
  return (
    user?.accessLevel === "design_manager" ||
    user?.accessLevel === "general_manager" ||
    user?.accessLevel === "admin"
  );
}

export function isAcceptanceManagerAccess(user: SessionUser | null): boolean {
  return user?.accessLevel === "acceptance_manager";
}

/** 可强制忽略地址重复（经理/店长确认） */
export function canForceDuplicateAddress(user: SessionUser | null): boolean {
  if (!user) return false;
  return (
    isDesignManagerAccess(user) ||
    isStoreManagerAccess(user) ||
    isAdminAccess(user)
  );
}

/** @deprecated 使用 accessLevel；保留给岗位角色判断 */
export function isAdminRole(role: UserRole): boolean {
  return role === "admin" || role === "design_manager";
}

export function isLoggedIn(user: SessionUser | null): user is SessionUser {
  return user !== null;
}

/** 设计经理 / 管理员：具备订单修改能力（单笔仍受 {@link canModifyOrderInUserScope} 约束） */
export function canModifyAnyOrder(user: SessionUser | null): boolean {
  return isLoggedIn(user) && isDesignManagerAccess(user);
}

/** 当前用户是否可修改该笔订单（门店层级仅限所属门店） */
export function canModifyOrderInUserScope(
  user: SessionUser | null,
  order: Order,
): boolean {
  if (!user) return false;
  if (hasFullOrderScope(user)) return true;
  const assignedStores = resolveAssignedStoresForUser(user);
  if (assignedStores.length > 0) {
    return assignedStores.includes(getOrderStoreByDispatcher(order));
  }
  const managedStore = resolveManagedStoreForLookup(user);
  if (managedStore) {
    return getOrderStoreByDispatcher(order) === managedStore;
  }
  return true;
}

export function canDispatcherModifyOrder(
  user: SessionUser,
  order: Order,
): boolean {
  return (
    normalizeDispatcherName(order.dispatcherName) === user.displayName
  );
}

export function canDesignerModifyOrder(
  user: SessionUser,
  order: Order,
): boolean {
  return order.designer === user.displayName;
}

export function canEditOrderOnDesignerPage(
  user: SessionUser | null,
  order: Order,
): boolean {
  if (!user) return false;
  if (isDesignManagerAccess(user)) {
    return canModifyOrderInUserScope(user, order);
  }
  if (user.role !== "designer") return false;
  return canDesignerModifyOrder(user, order);
}

/** 设计师页 / 本人订单：待签约时可线下签约（与发起电子签约权限一致） */
export function canOfflineSignContract(user: SessionUser | null): boolean {
  if (!user) return false;
  if (isDesignManagerAccess(user)) return true;
  return user.role === "designer";
}

export function canCreateDispatch(user: SessionUser | null): boolean {
  if (!user) return false;
  if (isDesignManagerAccess(user)) return true;
  return user.role === "dispatcher" || user.role === "designer";
}

/** 销售/店长/经理可「仅录信息」；设计师个人账号只能直接派单给自己 */
export function canChooseEntryOnlyMode(user: SessionUser | null): boolean {
  if (!user) return false;
  if (isDesignManagerAccess(user) || isStoreManagerAccess(user)) return true;
  return user.role === "dispatcher";
}

/** 未派单订单：指派设计师 */
export function canAssignDesigner(
  user: SessionUser | null,
  order: Order,
): boolean {
  if (!user || order.status !== "未派单") return false;
  if (!canModifyOrderInUserScope(user, order)) return false;
  if (isDesignManagerAccess(user) || isStoreManagerAccess(user)) return true;
  if (user.role === "dispatcher") {
    return canDispatcherModifyOrder(user, order);
  }
  return false;
}

export function canAccessAdminPage(user: SessionUser | null): boolean {
  if (!user || isAcceptanceManagerAccess(user) || isInstallerSession(user)) {
    return false;
  }
  if (isDesignManagerAccess(user) || user.accessLevel === "store_manager") {
    return true;
  }
  return user.role === "dispatcher" || user.role === "designer";
}

export function canAccessDeliveryPage(user: SessionUser | null): boolean {
  if (!user) return false;
  if (isAcceptanceManagerAccess(user)) return true;
  if (isPersonalAccess(user) && isInstallerSession(user)) return true;
  if (isDesignManagerAccess(user)) return true;
  if (user.accessLevel === "store_manager") return true;
  if (isAdminAccess(user)) return true;
  return false;
}

/** 验收与交付写操作：验收经理、设计经理、总经理、管理员 */
export function canEditDeliveryPage(user: SessionUser | null): boolean {
  if (!user) return false;
  if (isAcceptanceManagerAccess(user)) return true;
  if (isDesignManagerAccess(user)) return true;
  return false;
}

export function canEditManagerPage(user: SessionUser | null): boolean {
  return isLoggedIn(user) && isDesignManagerAccess(user);
}

/** 超额派单：仅设计经理/管理员可确认突破在途上限 */
export function canOverrideDispatchLimit(user: SessionUser | null): boolean {
  return isAdminAccess(user) || isDesignManagerAccess(user);
}

export function canManageStaff(user: SessionUser | null): boolean {
  return isAdminAccess(user);
}

/** 仅管理员可永久删除订单（含关联增补单） */
export function canDeleteOrder(user: SessionUser | null): boolean {
  return isAdminAccess(user);
}

export function isPageReadOnly(
  user: SessionUser | null,
  page: "admin" | "designer" | "manager",
): boolean {
  if (!user) return true;
  if (isDesignManagerAccess(user)) return false;
  if (page === "admin") {
    return !canAccessAdminPage(user);
  }
  if (page === "designer") {
    if (isDesignManagerAccess(user)) return false;
    return user.role !== "designer" && user.accessLevel !== "store_manager";
  }
  return true;
}

export function canUseDesignerSwitcher(user: SessionUser | null): boolean {
  return isLoggedIn(user) && isDesignManagerAccess(user);
}

export function lockedDesignerName(user: SessionUser | null): string | null {
  if (!user || user.role !== "designer") return null;
  if (user.accessLevel !== "personal") return null;
  return user.displayName;
}

export function lockedDispatcherName(user: SessionUser | null): string | null {
  if (!user || user.role !== "dispatcher") return null;
  if (user.accessLevel !== "personal") return null;
  return user.displayName;
}

/** 个人权限派单人：按派单人查找仅本人，且不显示「全部」 */
export function isPersonalDispatcherLookup(user: SessionUser | null): boolean {
  return (
    isLoggedIn(user) &&
    user.role === "dispatcher" &&
    user.accessLevel === "personal"
  );
}

/** 个人权限设计师：按设计师查找仅本人，且不显示「全部」 */
export function isPersonalDesignerLookup(user: SessionUser | null): boolean {
  return (
    isLoggedIn(user) &&
    user.role === "designer" &&
    user.accessLevel === "personal"
  );
}

/** 管理员 / 总部设计经理：全公司派单人「全部」 */
export function hasGlobalDispatcherLookup(user: SessionUser | null): boolean {
  if (!user) return false;
  if (user.accessLevel === "admin") return true;
  return isHeadquartersDesignManager(user);
}

/** 店长 / 本店设计经理：本店派单人「全部」 */
export function hasStoreDispatcherLookup(user: SessionUser | null): boolean {
  return hasStoreLevelLookupScope(user);
}

/** 按门店汇总是否显示「全部门店」（全公司或多门店所属汇总） */
export function showStoreSummaryAllOption(user: SessionUser | null): boolean {
  if (!user) return false;
  if (hasFullOrderScope(user)) return true;
  if (isPersonalManagerLookupOnly(user)) return false;
  const assigned = resolveAssignedStoresForUser(user);
  if (assigned.length > 1) return true;
  if (assigned.length === 1) return false;
  if (resolveManagedStoreForLookup(user)) return false;
  return false;
}

/** 按派单人/设计师查找是否显示「全部」选项 */
export function showLookupAllOption(
  user: SessionUser | null,
  lookup: "dispatcher" | "designer" = "dispatcher",
): boolean {
  if (!user) return false;
  if (lookup === "dispatcher" && isPersonalDispatcherLookup(user)) {
    return false;
  }
  if (lookup === "designer" && isPersonalDesignerLookup(user)) {
    return false;
  }
  return true;
}

/** 全公司订单范围（管理员；设计经理且门店为总部或未指定） */
export function hasFullOrderScope(user: SessionUser | null): boolean {
  if (!user) return false;
  if (user.accessLevel === "admin") return true;
  return isHeadquartersDesignManager(user);
}

/** 店长看板 / 运营看板订单范围 */
export function scopeOrdersForAdminBoard(
  orders: Order[],
  user: SessionUser | null,
): Order[] {
  if (!user || hasFullOrderScope(user)) return orders;
  const assignedStores = resolveAssignedStoresForUser(user);
  if (assignedStores.length > 0) {
    return filterOrdersByDispatcherAffiliatedStores(orders, assignedStores);
  }
  const managedStore = resolveManagedStoreForLookup(user);
  if (managedStore) {
    return filterOrdersByDispatcherAffiliatedStore(orders, managedStore);
  }
  if (user.homeStore && !isHeadquartersStore(user.homeStore)) {
    return filterOrdersByDispatcherAffiliatedStore(orders, user.homeStore);
  }
  return scopeOrdersForUser(orders, user);
}

/** 非全量：订单范围限定为本人姓名 */
export function scopeOrdersForUser(
  orders: Order[],
  user: SessionUser | null,
): Order[] {
  if (!user || hasFullOrderScope(user)) return orders;
  const assignedStores = resolveAssignedStoresForUser(user);
  if (assignedStores.length > 0) {
    return filterOrdersByDispatcherAffiliatedStores(orders, assignedStores);
  }
  const managedStore = resolveManagedStoreForLookup(user);
  if (managedStore) {
    return filterOrdersByDispatcherAffiliatedStore(orders, managedStore);
  }
  if (user.role === "dispatcher") {
    return orders.filter((o) => o.dispatcherName === user.displayName);
  }
  if (user.role === "designer") {
    return orders.filter((o) => o.designer === user.displayName);
  }
  if (isAcceptanceManagerAccess(user)) {
    return orders;
  }
  return orders;
}

/** 店长看板查找类 Tab 的订单范围 */
export function scopeOrdersForDispatcherLookup(
  orders: Order[],
  user: SessionUser | null,
): Order[] {
  return scopeOrdersForAdminBoard(orders, user);
}

/** 按派单人查找汇总条：非全公司时仅展示所属门店派单人 */
export function resolveDispatcherStatsStoreFilter(
  user: SessionUser | null,
): StoreName[] | null {
  if (!user || hasFullOrderScope(user)) return null;
  const assignedStores = resolveAssignedStoresForUser(user);
  if (assignedStores.length > 0) return assignedStores;
  const managedStore = resolveManagedStoreForLookup(user);
  if (managedStore) return [managedStore];
  return null;
}

export function scopeOrdersForDesignerLookup(
  orders: Order[],
  user: SessionUser | null,
  staffRecords: StaffRecord[],
): Order[] {
  const base = scopeOrdersForAdminBoard(orders, user);
  const index = buildDesignerHomeStoreIndex(staffRecords);
  return filterOrdersByDesignerHomeStores(
    base,
    resolveDesignerLookupStores(user),
    index,
  );
}

export function isPersonalAccess(user: SessionUser | null): boolean {
  return user?.accessLevel === "personal";
}

/** 确认已退单：设计经理/管理员在权限范围内可操作 */
export function canUserConfirmRefund(
  user: SessionUser | null,
  order: Order,
): boolean {
  if (!user || order.status !== "待退单") return false;
  if (!canModifyOrderInUserScope(user, order)) return false;
  if (!canPersonalModifyOrderContent(user, order)) return false;
  return isAdminAccess(user) || isDesignManagerAccess(user);
}

/** 撤回更新：已验收流程完结不可撤；管理员可撤其余；已签约锁定后非管理员不可撤；已下单起仅管理员 */
export function canUserRevertOrderStatus(
  user: SessionUser | null,
  order: Order,
): boolean {
  if (!user) return false;
  if (!canModifyOrderInUserScope(user, order)) return false;
  if (order.status === "已验收") return false;
  if (isAdminAccess(user)) return true;

  if (order.contract?.signLocked) {
    const locked: FlowOrderStatus[] = [
      "已签约",
      "已下单",
      "已安装",
      "已验收",
    ];
    if (locked.includes(order.status as FlowOrderStatus)) {
      return false;
    }
  }

  if (
    ADMIN_ONLY_REVERT_STATUSES.includes(order.status as FlowOrderStatus)
  ) {
    return false;
  }

  if (isDesignManagerAccess(user)) {
    return true;
  }
  return !(order.revertedFromStatuses ?? []).includes(order.status);
}

/** 已退单订单：个人权限不可改备注与流程 */
export function canPersonalModifyOrderContent(
  user: SessionUser | null,
  order: Order,
): boolean {
  if (!user || !isPersonalAccess(user)) return true;
  return order.status !== "已退单";
}

export function canEditWorkflowRemarkOnOrder(
  user: SessionUser | null,
  order: Order,
): boolean {
  if (!user) return false;
  if (isDesignManagerAccess(user)) {
    return canModifyOrderInUserScope(user, order);
  }
  return canPersonalModifyOrderContent(user, order);
}
