import { rawIntervalDays } from "./stage-intervals";
import type { FlowOrderStatus, Order } from "./types";

export const DESIGNER_MAX_IN_PROGRESS = 18;
export const DESIGNER_WARN_IN_PROGRESS = 16;
export const DESIGNER_ACCEPTANCE_HOURS = 24;

const IN_PROGRESS: FlowOrderStatus[] = [
  "待量尺",
  "已量尺",
  "已出图",
  "待签约",
  "已签约",
];

export type DesignerLoadLevel = "ok" | "warn" | "full";

export function countDesignerInProgress(
  orders: Order[],
  designer: string,
): number {
  return orders.filter(
    (o) =>
      o.designer === designer &&
      IN_PROGRESS.includes(o.status as FlowOrderStatus),
  ).length;
}

export function getDesignerLoadLevel(count: number): DesignerLoadLevel {
  if (count >= DESIGNER_MAX_IN_PROGRESS) return "full";
  if (count >= DESIGNER_WARN_IN_PROGRESS) return "warn";
  return "ok";
}

export function formatDesignerLoadHint(
  designer: string,
  count: number,
): string | null {
  const level = getDesignerLoadLevel(count);
  if (level === "ok") return null;
  if (level === "full") {
    return `「${designer}」在途 ${count} 单，已达建议上限 ${DESIGNER_MAX_IN_PROGRESS}，请谨慎派单或先消化在途。`;
  }
  return `「${designer}」在途 ${count} 单，接近建议上限 ${DESIGNER_MAX_IN_PROGRESS}。`;
}

export function needsDesignerAcceptance(order: Order): boolean {
  return order.status === "待量尺" && !order.designerAcceptedAt;
}

export function isAcceptanceOverdue(order: Order, now = new Date()): boolean {
  if (!needsDesignerAcceptance(order)) return false;
  const hours = rawIntervalDays(order.createdAt, now.toISOString()) * 24;
  return hours > DESIGNER_ACCEPTANCE_HOURS;
}

export function getPendingAcceptanceOrders(orders: Order[]): Order[] {
  return orders.filter(needsDesignerAcceptance);
}

export function isDispatchBlocked(inProgressCount: number): boolean {
  return inProgressCount >= DESIGNER_MAX_IN_PROGRESS;
}
