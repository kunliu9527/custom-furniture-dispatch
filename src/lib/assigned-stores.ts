import type { SessionUser } from "./permissions";
import type { StaffRecord } from "./staff-roster";
import { getMergedPhysicalStores, isHeadquartersStore } from "./stores";
import type { StoreName } from "./types";

export const MAX_DESIGN_MANAGER_STORES = 3;

/** 去重并排除总部，保留顺序 */
export function dedupePhysicalStores(stores: StoreName[]): StoreName[] {
  const seen = new Set<StoreName>();
  const result: StoreName[] = [];
  for (const store of stores) {
    if (isHeadquartersStore(store) || seen.has(store)) continue;
    seen.add(store);
    result.push(store);
  }
  return result;
}

/** 人员名册 → 设计经理所属实体门店（不含总部） */
export function resolveStaffAssignedStores(
  staff: Pick<StaffRecord, "accessLevel" | "homeStore" | "extraStores">,
): StoreName[] | undefined {
  if (staff.accessLevel !== "design_manager") return undefined;
  if (!staff.homeStore || isHeadquartersStore(staff.homeStore)) return undefined;
  return dedupePhysicalStores([
    staff.homeStore,
    ...(staff.extraStores ?? []),
  ]).slice(0, MAX_DESIGN_MANAGER_STORES);
}

/** 登录用户 → 数据范围门店列表（不含全公司） */
export function resolveAssignedStoresForUser(
  user: SessionUser | null,
): StoreName[] {
  if (!user) return [];
  if (user.assignedStores?.length) return user.assignedStores;
  if (
    user.homeStore &&
    !isHeadquartersStore(user.homeStore) &&
    user.accessLevel === "design_manager"
  ) {
    return [user.homeStore];
  }
  return [];
}

export function formatManagedStoresLabel(stores: StoreName[]): string {
  if (stores.length === 0) return "";
  if (stores.length === 1) return stores[0];
  return stores.join("、");
}

export function getPhysicalStoreOptions(): StoreName[] {
  return getMergedPhysicalStores();
}
