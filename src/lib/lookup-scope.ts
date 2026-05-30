import { normalizeDispatcherName } from "./admin-stats";
import type { DispatcherOrderStats } from "./admin-stats";
import {
  buildDesignerHomeStoreIndex,
  getEffectiveDesignersInStores,
  type DesignerHomeStoreIndex,
} from "./designer-staff-store";
import type { DeliveryViewMode } from "./delivery-stats";
import { isPersonalInstallerDelivery } from "./delivery-scope";
import type { DesignerOrderStats, ViewMode } from "./manager-stats";
import { createEmptyStatusCounts } from "./manager-stats";
import {
  isPersonalDispatcherLookup,
  isPersonalDesignerLookup,
  isPersonalManagerLookupOnly,
  type SessionUser,
} from "./permissions";
import type { StaffRecord } from "./staff-roster";
import { resolveUserHomeStore } from "./store-manager-scope";
import type { Order } from "./types";

const ALL_MANAGER_VIEW_MODES: ViewMode[] = [
  "status",
  "dispatcher",
  "designer",
  "store",
];

const ALL_DELIVERY_VIEW_MODES: DeliveryViewMode[] = [
  "status",
  "installer",
  "store",
  "acceptance",
];

/** 项目节点 · 查找 Tab：本人不可见「按门店汇总」 */
export function getVisibleManagerViewModes(
  user: SessionUser | null,
): ViewMode[] {
  if (!user) return ALL_MANAGER_VIEW_MODES;
  if (isPersonalManagerLookupOnly(user)) {
    return ["status", "dispatcher", "designer"];
  }
  return ALL_MANAGER_VIEW_MODES;
}

/** 验收与交付 · 查找 Tab：本人安装师仅状态与本人安装单 */
export function getVisibleDeliveryViewModes(
  user: SessionUser | null,
): DeliveryViewMode[] {
  if (isPersonalInstallerDelivery(user)) {
    return ["status", "installer"];
  }
  return ALL_DELIVERY_VIEW_MODES;
}

export function isManagerViewModeVisible(
  user: SessionUser | null,
  mode: ViewMode,
): boolean {
  return getVisibleManagerViewModes(user).includes(mode);
}

export function isDeliveryViewModeVisible(
  user: SessionUser | null,
  mode: DeliveryViewMode,
): boolean {
  return getVisibleDeliveryViewModes(user).includes(mode);
}

/** 本人派单人 · 按设计师查找：同店设计师 ∪ 本人订单关联设计师（含跨店） */
export function resolvePersonalDispatcherDesignerNames(
  user: SessionUser,
  orders: Order[],
  staffRecords: StaffRecord[],
  designerHomeStoreIndex: DesignerHomeStoreIndex,
): string[] {
  const homeStore = resolveUserHomeStore(user);
  const names = new Set<string>();
  for (const profile of getEffectiveDesignersInStores(
    [homeStore],
    designerHomeStoreIndex,
    staffRecords,
  )) {
    names.add(profile.name);
  }
  for (const order of orders) {
    if (order.dispatcherName !== user.displayName) continue;
    if (order.designer) names.add(order.designer);
  }
  return [...names];
}

/** 本人设计师 · 按派单人查找：仅本人订单涉及的派单人（含跨店） */
export function resolvePersonalDesignerDispatcherNames(
  user: SessionUser,
  orders: Order[],
): string[] {
  const names = new Set<string>();
  for (const order of orders) {
    if (order.designer !== user.displayName) continue;
    names.add(normalizeDispatcherName(order.dispatcherName));
  }
  return [...names];
}

/** 项目节点 · 设计师汇总条可见姓名；null 表示不过滤 */
export function resolveManagerDesignerNameAllowList(
  user: SessionUser | null,
  scopedOrders: Order[],
  staffRecords: StaffRecord[],
  designerHomeStoreIndex: DesignerHomeStoreIndex,
): string[] | null {
  if (!user) return null;
  if (isPersonalDesignerLookup(user)) {
    return [user.displayName];
  }
  if (isPersonalDispatcherLookup(user)) {
    return resolvePersonalDispatcherDesignerNames(
      user,
      scopedOrders,
      staffRecords,
      designerHomeStoreIndex,
    );
  }
  return null;
}

/** 项目节点 · 派单人汇总条可见姓名；null 表示不过滤 */
export function resolveManagerDispatcherNameAllowList(
  user: SessionUser | null,
  scopedOrders: Order[],
): string[] | null {
  if (!user) return null;
  if (isPersonalDispatcherLookup(user)) {
    return [user.displayName];
  }
  if (isPersonalDesignerLookup(user)) {
    return resolvePersonalDesignerDispatcherNames(user, scopedOrders);
  }
  return null;
}

export function filterDesignerStatsByAllowList(
  stats: DesignerOrderStats[],
  allowList: string[] | null,
): DesignerOrderStats[] {
  if (!allowList) return stats;
  const allowed = new Set(allowList);
  const filtered = stats.filter((s) => allowed.has(s.designer));
  const seen = new Set<string>(filtered.map((s) => s.designer));
  for (const name of allowList) {
    if (seen.has(name)) continue;
    filtered.push({
      designer: name as DesignerOrderStats["designer"],
      homeStore: stats.find((s) => s.designer === name)?.homeStore ?? "",
      total: 0,
      byStatus: createEmptyStatusCounts(),
    });
  }
  return filtered.sort(
    (a, b) =>
      b.total - a.total || a.designer.localeCompare(b.designer, "zh-CN"),
  );
}

export function filterDispatcherStatsByAllowList(
  stats: DispatcherOrderStats[],
  allowList: string[] | null,
): DispatcherOrderStats[] {
  if (!allowList) return stats;
  const allowed = new Set(allowList);
  const filtered = stats.filter((s) => allowed.has(s.dispatcher));
  const seen = new Set(filtered.map((s) => s.dispatcher));
  for (const name of allowList) {
    if (seen.has(name)) continue;
    filtered.push({
      dispatcher: name,
      total: 0,
      byStatus: createEmptyStatusCounts(),
    });
  }
  return filtered.sort(
    (a, b) =>
      b.total - a.total || a.dispatcher.localeCompare(b.dispatcher, "zh-CN"),
  );
}

/** 构建设计师门店索引（lookup-scope 内便捷封装） */
export function buildLookupDesignerStoreIndex(
  staffRecords: StaffRecord[],
): DesignerHomeStoreIndex {
  return buildDesignerHomeStoreIndex(staffRecords);
}
