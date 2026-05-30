import { normalizeDispatcherName } from "./admin-stats";
import { getEffectiveDispatcherRoster } from "./dispatchers";
import {
  buildDesignerHomeStoreIndex,
  getEffectiveDesignerHomeStore,
  getEffectiveDesignersInStores,
} from "./designer-staff-store";
import type { EvaluationViewMode } from "./evaluation-stats";
import {
  hasFullOrderScope,
  hasStoreLevelLookupScope,
  isPersonalAccess,
  isStoreManagerAccess,
  resolveDesignerLookupStores,
  resolveManagedStoreForLookup,
  scopeOrdersForAdminBoard,
  scopeOrdersForDesignerLookup,
  type SessionUser,
} from "./permissions";
import { resolveAssignedStoresForUser } from "./assigned-stores";
import type { MonthlyMetricsSnapshot } from "./monthly-snapshot-types";
import type { StaffRecord } from "./staff-roster";
import { resolveUserHomeStore } from "./store-manager-scope";
import { isHeadquartersStore } from "./stores";
import { STORES } from "./designers";
import type { Order, StoreName } from "./types";

export interface EvaluationRowScope {
  dispatcherNames: string[] | null;
  designerNames: string[] | null;
  storeNames: StoreName[] | null;
}

/** 评价看板可见 Tab：本人不可进入；管理员全量；店长/设计经理仅本店相关 */
export function getVisibleEvaluationViewModes(
  user: SessionUser | null,
): EvaluationViewMode[] {
  if (!user || isPersonalAccess(user)) return [];
  if (hasFullOrderScope(user)) return ["dispatcher", "designer", "store", "acceptance"];
  if (
    user.accessLevel === "store_manager" ||
    user.accessLevel === "design_manager" ||
    user.accessLevel === "general_manager"
  ) {
    return ["dispatcher", "designer", "store", "acceptance"];
  }
  return [];
}

export function getDefaultEvaluationViewMode(
  user: SessionUser | null,
): EvaluationViewMode {
  const modes = getVisibleEvaluationViewModes(user);
  if (!user || modes.length === 0) return "dispatcher";
  if (hasStoreLevelLookupScope(user) && modes.includes("store")) {
    return "store";
  }
  return modes[0] ?? "dispatcher";
}

export function scopeOrdersForEvaluationView(
  mode: EvaluationViewMode,
  orders: Order[],
  user: SessionUser | null,
  staffRecords: StaffRecord[],
): Order[] {
  switch (mode) {
    case "dispatcher":
      return scopeOrdersForEvaluationBoard(orders, user);
    case "designer":
      return scopeOrdersForDesignerLookup(
        scopeOrdersForEvaluationBoard(orders, user),
        user,
        staffRecords,
      );
    case "store":
    case "acceptance":
      return scopeOrdersForEvaluationBoard(orders, user);
  }
}

/** 综合看板 · 驾驶舱 / 简报 / 趋势统一订单范围 */
export function scopeOrdersForEvaluationBoard(
  orders: Order[],
  user: SessionUser | null,
): Order[] {
  return scopeOrdersForAdminBoard(orders, user);
}

/** 登录账号是否限定为实体门店（非总部全公司） */
export function isEvaluationStoreScoped(user: SessionUser | null): boolean {
  return resolveEvaluationScopeLabel(user) != null;
}

/** 月报存档文件名后缀（门店名 URL 编码） */
export function evaluationSnapshotScopeKey(
  scopeLabel: string | null | undefined,
): string | null {
  if (!scopeLabel) return null;
  return encodeURIComponent(scopeLabel);
}

export function monthlySnapshotMatchesScope(
  snapshot: MonthlyMetricsSnapshot | null | undefined,
  scopeLabel: string | null,
): boolean {
  if (!snapshot) return false;
  if (!scopeLabel) return !snapshot.scopeLabel;
  return snapshot.scopeLabel === scopeLabel;
}

export interface MonthlySnapshotIndexItem {
  yearMonth: string;
  scopeLabel?: string;
}

/** 门店账号仅可见本 scope 归档；总部仅可见全公司（无 scopeLabel）归档 */
export function filterMonthlySnapshotMonthsForScope(
  items: MonthlySnapshotIndexItem[],
  scopeLabel: string | null,
): string[] {
  const matched = scopeLabel
    ? items.filter((item) => item.scopeLabel === scopeLabel)
    : items.filter((item) => !item.scopeLabel);
  return [...new Set(matched.map((item) => item.yearMonth))].sort((a, b) =>
    b.localeCompare(a),
  );
}

export interface ReportPersonScope {
  designerNames: string[] | null;
  dispatcherNames: string[] | null;
}

/** 门店报告：设计师/客户经理按本店过滤；安装师等总部岗位不在此限制 */
export function resolveReportPersonScope(
  user: SessionUser | null,
  scopedOrders: Order[],
  staffRecords: StaffRecord[],
): ReportPersonScope {
  if (!user || hasFullOrderScope(user)) {
    return { designerNames: null, dispatcherNames: null };
  }
  if (isPersonalAccess(user)) {
    if (user.role === "designer") {
      return {
        designerNames: [user.displayName],
        dispatcherNames: null,
      };
    }
    if (user.role === "dispatcher") {
      return {
        designerNames: null,
        dispatcherNames: [user.displayName],
      };
    }
    return { designerNames: [], dispatcherNames: [] };
  }
  const rowScope = resolveEvaluationRowScope(user, staffRecords, scopedOrders);
  return {
    designerNames: rowScope.designerNames,
    dispatcherNames: rowScope.dispatcherNames,
  };
}

export function getEvaluationBoardTitle(scopeLabel: string | null): string {
  return scopeLabel ? `${scopeLabel} · 经营看板` : "综合系统看板";
}

/** 单店门店视角不展示门店排名；分管多店仍保留 */
export function shouldShowStoreRankingSubView(
  storeNames: StoreName[] | null,
  storeScoped: boolean,
): boolean {
  if (!storeScoped) return true;
  return Boolean(storeNames && storeNames.length > 1);
}

export function resolveEvaluationRowScope(
  user: SessionUser | null,
  staffRecords: StaffRecord[],
  scopedOrders: Order[],
): EvaluationRowScope {
  return {
    dispatcherNames: resolveEvaluationDispatcherNames(
      user,
      scopedOrders,
      staffRecords,
    ),
    designerNames: resolveEvaluationDesignerNames(user, staffRecords),
    storeNames: resolveEvaluationStoreNames(user),
  };
}

function resolveEvaluationDispatcherNames(
  user: SessionUser | null,
  orders: Order[],
  staffRecords: StaffRecord[],
): string[] | null {
  if (!user || hasFullOrderScope(user)) return null;
  if (isPersonalAccess(user)) return [];

  const assignedStores = resolveAssignedStoresForUser(user);
  if (assignedStores.length > 0) {
    return collectDispatcherNamesForStores(assignedStores, orders, staffRecords);
  }

  const managedStore = resolveManagedStoreForLookup(user);
  if (managedStore) {
    return collectDispatcherNamesForStores(
      [managedStore],
      orders,
      staffRecords,
    );
  }

  if (
    user.role === "dispatcher" &&
    user.accessLevel === "store_manager" &&
    user.homeStore &&
    !isHeadquartersStore(user.homeStore)
  ) {
    return collectDispatcherNamesForStores(
      [user.homeStore],
      orders,
      staffRecords,
    );
  }

  return [];
}

function collectDispatcherNamesForStores(
  stores: StoreName[],
  orders: Order[],
  staffRecords: StaffRecord[],
): string[] {
  const allowed = new Set(stores);
  const names = new Set<string>();
  const roster = getEffectiveDispatcherRoster(staffRecords);
  for (const profile of roster) {
    if (allowed.has(profile.homeStore)) {
      names.add(profile.name);
    }
  }
  for (const order of orders) {
    const name = normalizeDispatcherName(order.dispatcherName);
    const profile = roster.find((d) => d.name === name);
    if (profile && allowed.has(profile.homeStore)) {
      names.add(name);
    }
  }
  return [...names];
}

function resolveEvaluationDesignerNames(
  user: SessionUser | null,
  staffRecords: StaffRecord[],
): string[] | null {
  if (!user || hasFullOrderScope(user)) return null;
  if (isPersonalAccess(user)) return [];

  const lookupStores = resolveDesignerLookupStores(user);
  if (lookupStores?.length) {
    const index = buildDesignerHomeStoreIndex(staffRecords);
    return getEffectiveDesignersInStores(lookupStores, index, staffRecords).map(
      (d) => d.name,
    );
  }

  return [];
}

function resolveEvaluationStoreNames(
  user: SessionUser | null,
): StoreName[] | null {
  if (!user || hasFullOrderScope(user)) return null;

  const assigned = resolveAssignedStoresForUser(user);
  if (assigned.length > 0) return assigned;

  const managed = resolveManagedStoreForLookup(user);
  if (managed) return [managed];

  if (isStoreManagerAccess(user)) {
    return [resolveUserHomeStore(user)];
  }

  if (
    user.homeStore &&
    !isHeadquartersStore(user.homeStore) &&
    (user.accessLevel === "store_manager" ||
      user.role === "dispatcher" ||
      user.role === "designer")
  ) {
    return [user.homeStore];
  }

  return null;
}

export function resolveEvaluationScopeLabel(
  user: SessionUser | null,
): string | null {
  if (!user || hasFullOrderScope(user)) return null;
  const assigned = resolveAssignedStoresForUser(user);
  if (assigned.length > 0) {
    return assigned.length === 1 ? assigned[0] : assigned.join("、");
  }
  const managed = resolveManagedStoreForLookup(user);
  if (managed) return managed;
  if (isStoreManagerAccess(user)) {
    return resolveUserHomeStore(user);
  }
  if (user.homeStore && !isHeadquartersStore(user.homeStore)) {
    return user.homeStore;
  }
  return null;
}

export function getDesignerSubtitleForEvaluation(
  name: string,
  staffRecords: StaffRecord[],
): string | undefined {
  const index = buildDesignerHomeStoreIndex(staffRecords);
  return getEffectiveDesignerHomeStore(name, index);
}

export function getAllStoreNamesForEvaluation(
  storeFilter: StoreName[] | null,
): StoreName[] {
  if (storeFilter?.length) return storeFilter;
  return [...STORES];
}
