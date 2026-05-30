import { DESIGNER_ROSTER } from "./designers";
import {
  buildEffectiveDesignerRoster,
  filterRosterByStores,
  isDesignerStaff,
} from "./personnel-roster";
import type { StaffRecord } from "./staff-roster";
import type { Order, StoreName } from "./types";

export type DesignerHomeStoreIndex = Map<string, StoreName>;

/** 人员管理名册覆盖静态设计师门店，并包含新增设计师 */
export function buildDesignerHomeStoreIndex(
  staffRecords: StaffRecord[],
): DesignerHomeStoreIndex {
  const index: DesignerHomeStoreIndex = new Map();
  for (const d of DESIGNER_ROSTER) {
    index.set(d.name, d.homeStore);
  }
  for (const row of staffRecords) {
    if (isDesignerStaff(row)) {
      index.set(row.name, row.homeStore);
    }
  }
  return index;
}

export function getEffectiveDesignerHomeStore(
  name: string,
  index: DesignerHomeStoreIndex,
): StoreName {
  return (
    index.get(name) ??
    DESIGNER_ROSTER.find((d) => d.name === name)?.homeStore ??
    "东岸天冠"
  );
}

export function getEffectiveDesignerRoster(
  index: DesignerHomeStoreIndex,
  staffRecords: StaffRecord[] = [],
) {
  return buildEffectiveDesignerRoster(staffRecords, index);
}

export function getEffectiveDesignersInStores(
  stores: StoreName[],
  index: DesignerHomeStoreIndex,
  staffRecords: StaffRecord[] = [],
) {
  return filterRosterByStores(
    getEffectiveDesignerRoster(index, staffRecords),
    stores,
  );
}

export function filterOrdersByDesignerHomeStores(
  orders: Order[],
  stores: StoreName[] | null | undefined,
  index: DesignerHomeStoreIndex,
): Order[] {
  if (!stores?.length) return orders;
  const allowed = new Set(stores);
  return orders.filter((o) => {
    if (!o.designer) return true;
    return allowed.has(getEffectiveDesignerHomeStore(o.designer, index));
  });
}

export function isCrossStoreOrderForDesigner(
  dispatchStore: StoreName,
  designer: string,
  index: DesignerHomeStoreIndex,
): boolean {
  return dispatchStore !== getEffectiveDesignerHomeStore(designer, index);
}

export function isOrderCrossStoreForDesigner(
  order: Pick<Order, "dispatchStore" | "designer">,
  index: DesignerHomeStoreIndex,
): boolean {
  if (!order.designer) return false;
  return isCrossStoreOrderForDesigner(
    order.dispatchStore,
    order.designer,
    index,
  );
}
