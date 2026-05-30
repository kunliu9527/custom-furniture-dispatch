import {
  isCrossStoreOrderForDesigner,
  type DesignerHomeStoreIndex,
} from "./designer-staff-store";
import {
  buildAcceptanceBadReviewLabels,
} from "./acceptance-rating";
import { isAcceptanceOverdue, needsDesignerAcceptance } from "./designer-load";
import { getStageTimeoutAlert } from "./stage-intervals";
import { hasBeenTransferred } from "./transfer-utils";
import { resolveOrderDisplayName } from "./order-remark";
import type { Order } from "./types";
import { filterOrdersByWeek } from "./week-filter";

export type OrderAnomalySeverity = "danger" | "mild" | "warn" | "info";

export interface OrderAnomalyMarker {
  id: string;
  label: string;
  severity: OrderAnomalySeverity;
}

export interface OrderAnomalyOptions {
  now?: Date;
  highlightCrossStore?: boolean;
  designerHomeStoreIndex?: DesignerHomeStoreIndex;
  /** 跨店、已转派等运营提示，默认展示 */
  includeOperationalHints?: boolean;
}

export function getOrderAnomalyMarkers(
  order: Order,
  options: OrderAnomalyOptions = {},
): OrderAnomalyMarker[] {
  const now = options.now ?? new Date();
  const includeOperationalHints = options.includeOperationalHints !== false;
  const markers: OrderAnomalyMarker[] = [];

  const stageAlert = getStageTimeoutAlert(order, now);
  if (stageAlert) {
    markers.push({
      id: `stage-${stageAlert}`,
      label: stageAlert,
      severity: "danger",
    });
  }

  if (needsDesignerAcceptance(order)) {
    const overdue = isAcceptanceOverdue(order, now);
    markers.push({
      id: overdue ? "accept-overdue" : "accept-pending",
      label: overdue ? "接单超时" : "待确认接单",
      severity: overdue ? "danger" : "warn",
    });
  }

  if (order.status === "待退单") {
    markers.push({
      id: "pending-refund",
      label: "待退单",
      severity: "danger",
    });
  }

  for (const label of buildAcceptanceBadReviewLabels(order)) {
    markers.push({
      id: `bad-review-${label}`,
      label,
      severity: label === "综合低评" ? "danger" : "warn",
    });
  }

  if (includeOperationalHints) {
    if (
      options.highlightCrossStore &&
      order.designer &&
      options.designerHomeStoreIndex &&
      isCrossStoreOrderForDesigner(
        order.dispatchStore,
        order.designer,
        options.designerHomeStoreIndex,
      )
    ) {
      markers.push({
        id: "cross-store",
        label: "跨店派单",
        severity: "danger",
      });
    }
    if (hasBeenTransferred(order)) {
      markers.push({
        id: "transferred",
        label: "已转派",
        severity: "mild",
      });
    }
  }

  return markers;
}

export function hasOrderAnomaly(
  order: Order,
  options?: OrderAnomalyOptions,
): boolean {
  return getOrderAnomalyMarkers(order, options).length > 0;
}

export function countOrderAnomalies(
  orders: Order[],
  options?: OrderAnomalyOptions,
): { ordersWithAnomalies: number; byLabel: Map<string, number> } {
  const byLabel = new Map<string, number>();
  let ordersWithAnomalies = 0;
  for (const order of orders) {
    const markers = getOrderAnomalyMarkers(order, options);
    if (markers.length === 0) continue;
    ordersWithAnomalies += 1;
    for (const marker of markers) {
      byLabel.set(marker.label, (byLabel.get(marker.label) ?? 0) + 1);
    }
  }
  return { ordersWithAnomalies, byLabel };
}

export function formatOrderAnomalySummary(
  orders: Order[],
  options?: OrderAnomalyOptions,
): string | null {
  const { ordersWithAnomalies, byLabel } = countOrderAnomalies(orders, options);
  if (ordersWithAnomalies === 0) return null;
  const parts = [...byLabel.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => `${label} ${count}`);
  return `异常 ${ordersWithAnomalies} 笔 · ${parts.join(" · ")}`;
}

export type OrderAnomalyHighlightLevel = "danger" | "warn";

export const ORDER_ANOMALY_NAME_CLASS: Record<OrderAnomalyHighlightLevel, string> = {
  danger: "text-red-600 font-semibold",
  warn: "text-amber-700 font-semibold",
};

/** 未消除的异常对应名称高亮级别；danger 优先于 warn */
export function orderAnomalyHighlightLevel(
  order: Order,
  options?: OrderAnomalyOptions,
): OrderAnomalyHighlightLevel | null {
  const markers = getOrderAnomalyMarkers(order, options);
  if (markers.some((m) => m.severity === "danger")) return "danger";
  if (markers.some((m) => m.severity === "warn")) return "warn";
  return null;
}

export function getOrderDisplayNameClass(
  order: Order,
  options?: OrderAnomalyOptions,
  defaultClass = "text-slate-900 font-medium",
): string {
  const level = orderAnomalyHighlightLevel(order, options);
  if (!level) return defaultClass;
  return ORDER_ANOMALY_NAME_CLASS[level];
}

export interface WeeklyAnomalyItem {
  orderId: string;
  orderName: string;
  labels: string[];
}

/** 本周有节点活动的订单中，当前仍存在的异常项（按订单名列出） */
export function buildWeeklyAnomalyItems(
  orders: Order[],
  ref = new Date(),
  options: OrderAnomalyOptions = {},
): WeeklyAnomalyItem[] {
  const { orders: weekOrders } = filterOrdersByWeek(orders, ref);
  const anomalyOptions: OrderAnomalyOptions = {
    ...options,
    now: options.now ?? ref,
    includeOperationalHints: false,
  };
  const items: WeeklyAnomalyItem[] = [];

  for (const order of weekOrders) {
    const markers = getOrderAnomalyMarkers(order, anomalyOptions);
    if (markers.length === 0) continue;
    items.push({
      orderId: order.id,
      orderName: resolveOrderDisplayName(order),
      labels: markers.map((marker) => marker.label),
    });
  }

  return items.sort((a, b) =>
    a.orderName.localeCompare(b.orderName, "zh-CN"),
  );
}

export function formatWeeklyAnomalyText(items: WeeklyAnomalyItem[]): string[] {
  if (items.length === 0) {
    return ["本周已产生异常项：暂无"];
  }
  return [
    "本周已产生异常项：",
    ...items.map(
      (item) => `- ${item.orderName} · ${item.labels.join("、")}`,
    ),
  ];
}
