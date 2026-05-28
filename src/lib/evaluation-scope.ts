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
  resolveDesignerLookupStores,
  resolveManagedStoreForLookup,
  scopeOrdersForAdminBoard,
  scopeOrdersForDesignerLookup,
  scopeOrdersForDispatcherLookup,
  type SessionUser,
} from "./permissions";
import { resolveAssignedStoresForUser } from "./assigned-stores";
import type { StaffRecord } from "./staff-roster";
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
  if (hasFullOrderScope(user)) return ["dispatcher", "designer", "store"];
  if (
    user.accessLevel === "store_manager" ||
    user.accessLevel === "design_manager"
  ) {
    return ["dispatcher", "designer", "store"];
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
      return scopeOrdersForDispatcherLookup(orders, user);
    case "designer":
      return scopeOrdersForDesignerLookup(orders, user, staffRecords);
    case "store":
      return scopeOrdersForAdminBoard(orders, user);
  }
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
