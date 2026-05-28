import type { Order } from "./types";

export interface WeekBounds {
  start: Date;
  end: Date;
  label: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatShort(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 本周一至周日 23:59（下一周周一 0:00 前） */
export function getWeekBounds(ref = new Date()): WeekBounds {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diffToMon);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  const endDisplay = new Date(end);
  endDisplay.setDate(endDisplay.getDate() - 1);
  return {
    start,
    end,
    label: `${start.getFullYear()}年${start.getMonth() + 1}月${pad2(start.getDate())}日 — ${endDisplay.getMonth() + 1}月${pad2(endDisplay.getDate())}日`,
  };
}

export function getWeekId(ref = new Date()): string {
  const { start } = getWeekBounds(ref);
  return `${start.getFullYear()}-W${pad2(getIsoWeekNumber(start))}`;
}

function getIsoWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    )
  );
}

function isIsoInBounds(iso: string, bounds: WeekBounds): boolean {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return false;
  return t >= bounds.start.getTime() && t < bounds.end.getTime();
}

export function orderActiveInWeek(order: Order, bounds: WeekBounds): boolean {
  if (isIsoInBounds(order.createdAt, bounds)) return true;
  const entered = order.statusEnteredAt;
  if (entered) {
    for (const at of Object.values(entered)) {
      if (at && isIsoInBounds(at, bounds)) return true;
    }
  }
  return false;
}

export function filterOrdersByWeek(
  orders: Order[],
  ref = new Date(),
): { bounds: WeekBounds; orders: Order[] } {
  const bounds = getWeekBounds(ref);
  return {
    bounds,
    orders: orders.filter((o) => orderActiveInWeek(o, bounds)),
  };
}
