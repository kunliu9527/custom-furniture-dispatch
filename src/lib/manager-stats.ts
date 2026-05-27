import { DESIGNER_ROSTER } from "./designers";
import {
  getEffectiveDesignerHomeStore,
  getEffectiveDesignerRoster,
  type DesignerHomeStoreIndex,
} from "./designer-staff-store";
import { ORDER_STATUSES } from "./constants";
import type { DesignerName, Order, OrderStatus, StoreName } from "./types";

export type ViewMode = "status" | "dispatcher" | "designer" | "store";

export function createEmptyStatusCounts(): Record<OrderStatus, number> {
  return ORDER_STATUSES.reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {} as Record<OrderStatus, number>,
  );
}

export function countOrdersByStatus(orders: Order[]): Record<OrderStatus, number> {
  const counts = createEmptyStatusCounts();
  for (const order of orders) {
    counts[order.status] += 1;
  }
  return counts;
}

export interface DesignerOrderStats {
  designer: DesignerName;
  homeStore: string;
  total: number;
  byStatus: Record<OrderStatus, number>;
}

export function getDesignerStats(
  orders: Order[],
  designerStores?: StoreName[] | null,
  designerStoreIndex?: DesignerHomeStoreIndex,
): DesignerOrderStats[] {
  const roster = designerStoreIndex
    ? designerStores?.length
      ? getEffectiveDesignerRoster(designerStoreIndex).filter((d) =>
          designerStores.includes(d.homeStore),
        )
      : getEffectiveDesignerRoster(designerStoreIndex)
    : designerStores?.length
      ? DESIGNER_ROSTER.filter((d) => designerStores.includes(d.homeStore))
      : [...DESIGNER_ROSTER];
  return roster.map((profile) => {
    const designerOrders = orders.filter((o) => o.designer === profile.name);
    const byStatus = createEmptyStatusCounts();
    for (const order of designerOrders) {
      byStatus[order.status] += 1;
    }
    const homeStore = designerStoreIndex
      ? getEffectiveDesignerHomeStore(profile.name, designerStoreIndex)
      : profile.homeStore;
    return {
      designer: profile.name as DesignerName,
      homeStore,
      total: designerOrders.length,
      byStatus,
    };
  });
}

export function filterOrdersByStatus(
  orders: Order[],
  status: OrderStatus | "全部",
): Order[] {
  if (status === "全部") return orders;
  return orders.filter((o) => o.status === status);
}

export function filterOrdersByDesigner(
  orders: Order[],
  designer: DesignerName | "全部",
): Order[] {
  if (designer === "全部") return orders;
  return orders.filter((o) => o.designer === designer);
}
