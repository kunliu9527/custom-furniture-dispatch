import { DESIGNER_ROSTER } from "./designers";
import type { StaffRecord } from "./staff-roster";
import type { DesignerName, Order, StoreName } from "./types";

export type DesignerHomeStoreIndex = Map<string, StoreName>;

/** 人员管理名册覆盖静态设计师门店 */
export function buildDesignerHomeStoreIndex(
  staffRecords: StaffRecord[],
): DesignerHomeStoreIndex {
  const index: DesignerHomeStoreIndex = new Map();
  for (const d of DESIGNER_ROSTER) {
    index.set(d.name, d.homeStore);
  }
  for (const row of staffRecords) {
    if (row.role === "designer") {
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

export function getEffectiveDesignerRoster(index: DesignerHomeStoreIndex) {
  return DESIGNER_ROSTER.map((d) => ({
    name: d.name,
    homeStore: getEffectiveDesignerHomeStore(d.name, index),
  }));
}

export function getEffectiveDesignersInStores(
  stores: StoreName[],
  index: DesignerHomeStoreIndex,
) {
  const allowed = new Set(stores);
  return getEffectiveDesignerRoster(index).filter((d) =>
    allowed.has(d.homeStore),
  );
}

export function filterOrdersByDesignerHomeStores(
  orders: Order[],
  stores: StoreName[] | null | undefined,
  index: DesignerHomeStoreIndex,
): Order[] {
  if (!stores?.length) return orders;
  const allowed = new Set(stores);
  return orders.filter((o) =>
    allowed.has(getEffectiveDesignerHomeStore(o.designer, index)),
  );
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
  return isCrossStoreOrderForDesigner(
    order.dispatchStore,
    order.designer,
    index,
  );
}
