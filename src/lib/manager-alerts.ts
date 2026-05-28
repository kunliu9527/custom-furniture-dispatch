import {
  getStatusEnteredAt,
  getStageTimeoutAlert,
  rawIntervalDays,
  type StageTimeoutAlert,
} from "./stage-intervals";
import type { FlowOrderStatus, Order } from "./types";

export interface ManagerAlertItem {
  orderId: string;
  customerName: string;
  designer: string;
  status: Order["status"];
  dispatchStore: Order["dispatchStore"];
  budget: number;
  alert: StageTimeoutAlert;
  daysStuck: number;
}

function stuckDays(order: Order, now: Date): number {
  if (order.status === "待退单" || order.status === "已退单") return 0;
  const status = order.status as FlowOrderStatus;
  const from = getStatusEnteredAt(order, status);
  if (!from) return 0;
  return Math.floor(rawIntervalDays(from, now.toISOString()));
}

export function getManagerAlerts(
  orders: Order[],
  now = new Date(),
): ManagerAlertItem[] {
  const items: ManagerAlertItem[] = [];

  for (const order of orders) {
    const alert = getStageTimeoutAlert(order, now);
    if (!alert) continue;
    items.push({
      orderId: order.id,
      customerName: order.customerName,
      designer: order.designer,
      status: order.status,
      dispatchStore: order.dispatchStore,
      budget: order.budget,
      alert,
      daysStuck: stuckDays(order, now),
    });
  }

  return items.sort(
    (a, b) => b.daysStuck - a.daysStuck || a.designer.localeCompare(b.designer, "zh-CN"),
  );
}

export function countAlertsByDesigner(
  alerts: ManagerAlertItem[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of alerts) {
    map.set(item.designer, (map.get(item.designer) ?? 0) + 1);
  }
  return map;
}
