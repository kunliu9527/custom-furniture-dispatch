import { createShortId } from "./create-id";
import {
  getPeriodBounds,
  orderMatchesPeriod,
  type PeriodSelection,
} from "./period-filter";
import type { Order, OrderEvent, OrderEventKind, OrderStatus } from "./types";

export function normalizeOrderEvents(raw: unknown): OrderEvent[] {
  if (!Array.isArray(raw)) return [];
  const events: OrderEvent[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const kind = o.kind as OrderEventKind;
    const at = typeof o.at === "string" ? o.at : "";
    const actorName = typeof o.actorName === "string" ? o.actorName : "";
    if (!at || !actorName || !kind) continue;
    events.push({
      id: typeof o.id === "string" ? o.id : createShortId("ev-"),
      kind,
      at,
      actorName,
      fromStatus: o.fromStatus as OrderStatus | undefined,
      toStatus: o.toStatus as OrderStatus | undefined,
      note: typeof o.note === "string" ? o.note : undefined,
    });
  }
  return events.sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );
}

export function appendOrderEvent(
  order: Order,
  event: Omit<OrderEvent, "id"> & { id?: string },
): Order {
  const entry: OrderEvent = {
    id: event.id ?? createShortId("ev-"),
    kind: event.kind,
    at: event.at,
    actorName: event.actorName,
    fromStatus: event.fromStatus,
    toStatus: event.toStatus,
    note: event.note,
  };
  return {
    ...order,
    orderEvents: [...(order.orderEvents ?? []), entry],
  };
}

export function eventInPeriod(
  at: string,
  period: PeriodSelection,
): boolean {
  const bounds = getPeriodBounds(period);
  if (!bounds) return true;
  const t = new Date(at).getTime();
  if (!Number.isFinite(t)) return false;
  return t >= bounds.start.getTime() && t < bounds.end.getTime();
}

export function countOrderEventsInPeriod(
  order: Order,
  period: PeriodSelection,
  kinds?: OrderEventKind[],
): number {
  const events = order.orderEvents ?? [];
  return events.filter((e) => {
    if (!eventInPeriod(e.at, period)) return false;
    if (kinds && !kinds.includes(e.kind)) return false;
    return true;
  }).length;
}

export interface DesignerActivitySummary {
  total: number;
  advances: number;
  accepts: number;
  remarks: number;
}

export function summarizeDesignerActivity(
  orders: Order[],
  designer: string,
  period: PeriodSelection,
): DesignerActivitySummary {
  let total = 0;
  let advances = 0;
  let accepts = 0;
  let remarks = 0;

  for (const order of orders) {
    if (order.designer !== designer && order.originalDesigner !== designer) {
      continue;
    }
    if (!orderMatchesPeriod(order, period)) continue;

    for (const e of order.orderEvents ?? []) {
      if (!eventInPeriod(e.at, period)) continue;
      if (e.actorName !== designer) continue;
      total += 1;
      if (e.kind === "状态推进") advances += 1;
      if (e.kind === "接单确认") accepts += 1;
      if (e.kind === "流程备注") remarks += 1;
    }
  }

  return { total, advances, accepts, remarks };
}
