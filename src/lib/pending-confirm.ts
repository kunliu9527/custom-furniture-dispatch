import {
  countDesignerInProgress,
  DESIGNER_MAX_IN_PROGRESS,
  getPendingAcceptanceOrders,
  isAcceptanceOverdue,
  needsDesignerAcceptance,
} from "./designer-load";
import { resolveOrderDisplayName } from "./order-remark";
import type { Order } from "./types";

export type PendingConfirmKind =
  | "designer-accept"
  | "undispatched"
  | "pending-refund"
  | "designer-capacity";

export interface PendingConfirmOrderItem {
  kind: PendingConfirmKind;
  orderId: string;
  customerName: string;
  designer: string;
  dispatchStore: Order["dispatchStore"];
  status: Order["status"];
  label: string;
  hint?: string;
  isOverdue?: boolean;
}

export interface PendingConfirmDesignerItem {
  kind: "designer-capacity";
  designer: string;
  inProgressCount: number;
  pendingAcceptCount: number;
  undispatchedBacklog: number;
  label: string;
  hint: string;
}

export interface PendingConfirmSnapshot {
  orderItems: PendingConfirmOrderItem[];
  designerItems: PendingConfirmDesignerItem[];
  countByKind: Record<PendingConfirmKind, number>;
  totalCount: number;
}

const ORDER_KIND_ORDER: PendingConfirmKind[] = [
  "designer-accept",
  "undispatched",
  "pending-refund",
];

const KIND_LABELS: Record<PendingConfirmKind, string> = {
  "designer-accept": "待确认接单",
  undispatched: "未派单待指派",
  "pending-refund": "待退单确认",
  "designer-capacity": "超额派单协调",
};

export function pendingConfirmKindLabel(kind: PendingConfirmKind): string {
  return KIND_LABELS[kind];
}

export function buildPendingConfirmSnapshot(
  orders: Order[],
  now = new Date(),
): PendingConfirmSnapshot {
  const orderItems: PendingConfirmOrderItem[] = [];
  const undispatchedTotal = orders.filter((o) => o.status === "未派单").length;

  for (const order of getPendingAcceptanceOrders(orders)) {
    const overdue = isAcceptanceOverdue(order, now);
    orderItems.push({
      kind: "designer-accept",
      orderId: order.id,
      customerName: resolveOrderDisplayName(order),
      designer: order.designer ?? "—",
      dispatchStore: order.dispatchStore,
      status: order.status,
      label: overdue ? "接单超时" : "待确认接单",
      hint: overdue ? "超 24h 未确认" : undefined,
      isOverdue: overdue,
    });
  }

  for (const order of orders) {
    if (order.status !== "待退单") continue;
    orderItems.push({
      kind: "pending-refund",
      orderId: order.id,
      customerName: resolveOrderDisplayName(order),
      designer: order.designer ?? "—",
      dispatchStore: order.dispatchStore,
      status: order.status,
      label: "待退单确认",
    });
  }

  const designerItems = buildDesignerCapacityItems(orders, undispatchedTotal);

  const countByKind: Record<PendingConfirmKind, number> = {
    "designer-accept": orderItems.filter((i) => i.kind === "designer-accept")
      .length,
    undispatched: orderItems.filter((i) => i.kind === "undispatched").length,
    "pending-refund": orderItems.filter((i) => i.kind === "pending-refund")
      .length,
    "designer-capacity": designerItems.length,
  };

  return {
    orderItems,
    designerItems,
    countByKind,
    totalCount:
      orderItems.length +
      (designerItems.length > 0 ? designerItems.length : 0),
  };
}

function buildDesignerCapacityItems(
  orders: Order[],
  undispatchedTotal: number,
): PendingConfirmDesignerItem[] {
  const designers = new Set<string>();
  for (const order of orders) {
    if (order.designer) designers.add(order.designer);
  }

  const items: PendingConfirmDesignerItem[] = [];

  for (const designer of designers) {
    const inProgressCount = countDesignerInProgress(orders, designer);
    if (inProgressCount < DESIGNER_MAX_IN_PROGRESS) continue;

    const pendingAcceptCount = orders.filter(
      (o) => needsDesignerAcceptance(o) && o.designer === designer,
    ).length;

    if (pendingAcceptCount === 0 && undispatchedTotal === 0) continue;

    items.push({
      kind: "designer-capacity",
      designer,
      inProgressCount,
      pendingAcceptCount,
      undispatchedBacklog: undispatchedTotal,
      label: "在途已满",
      hint: `在途 ${inProgressCount}/${DESIGNER_MAX_IN_PROGRESS} 单${
        pendingAcceptCount > 0 ? ` · 待确认接单 ${pendingAcceptCount}` : ""
      }${undispatchedTotal > 0 ? ` · 未派单积压 ${undispatchedTotal}` : ""} · 超额派单需在「新客户开发」勾选「经理确认超额派单」`,
    });
  }

  return items.sort(
    (a, b) =>
      b.inProgressCount - a.inProgressCount ||
      a.designer.localeCompare(b.designer, "zh-CN"),
  );
}

export { ORDER_KIND_ORDER as PENDING_CONFIRM_GROUP_ORDER };
