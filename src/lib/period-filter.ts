import { getWeekBounds, orderActiveInWeek } from "./week-filter";
import type { Order, SupplementOrder } from "./types";

export type PeriodPreset =
  | "all"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "custom";

export interface PeriodSelection {
  preset: PeriodPreset;
  /** YYYY-MM，仅 preset === "custom" 时使用 */
  yearMonth?: string;
}

export interface PeriodBounds {
  start: Date;
  end: Date;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function toYearMonth(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

export function getCurrentYearMonth(): string {
  return toYearMonth(new Date());
}

export function parseYearMonth(ym: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(ym);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function isWeekPeriod(selection: PeriodSelection): boolean {
  return selection.preset === "thisWeek" || selection.preset === "lastWeek";
}

function weekBoundsForPreset(
  preset: "thisWeek" | "lastWeek",
  ref = new Date(),
): PeriodBounds {
  const weekRef =
    preset === "lastWeek"
      ? (() => {
          const d = new Date(ref);
          d.setDate(d.getDate() - 7);
          return d;
        })()
      : ref;
  const { start, end } = getWeekBounds(weekRef);
  return { start, end };
}

export function getPeriodBounds(
  selection: PeriodSelection,
  ref = new Date(),
): PeriodBounds | null {
  if (selection.preset === "all") return null;

  if (selection.preset === "thisWeek") {
    return weekBoundsForPreset("thisWeek", ref);
  }
  if (selection.preset === "lastWeek") {
    return weekBoundsForPreset("lastWeek", ref);
  }

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;

  if (selection.preset === "lastMonth") {
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
  } else if (selection.preset === "custom") {
    const parsed = parseYearMonth(selection.yearMonth ?? "");
    if (!parsed) return null;
    year = parsed.year;
    month = parsed.month;
  }

  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 1, 0, 0, 0, 0);
  return { start, end };
}

function isIsoInBounds(iso: string, bounds: PeriodBounds): boolean {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return false;
  return t >= bounds.start.getTime() && t < bounds.end.getTime();
}

/** 订单在周期内有派单或任一流程节点活动 */
export function orderMatchesPeriod(
  order: Order,
  selection: PeriodSelection,
  ref = new Date(),
): boolean {
  const bounds = getPeriodBounds(selection, ref);
  if (!bounds) return true;

  if (isWeekPeriod(selection)) {
    return orderActiveInWeek(order, {
      start: bounds.start,
      end: bounds.end,
      label: "",
    });
  }

  if (isIsoInBounds(order.createdAt, bounds)) return true;

  const entered = order.statusEnteredAt;
  if (entered) {
    for (const at of Object.values(entered)) {
      if (at && isIsoInBounds(at, bounds)) return true;
    }
  }

  return false;
}

export function supplementMatchesPeriod(
  supplement: SupplementOrder,
  selection: PeriodSelection,
  ref = new Date(),
): boolean {
  const bounds = getPeriodBounds(selection, ref);
  if (!bounds) return true;
  return isIsoInBounds(supplement.createdAt, bounds);
}

export function filterOrdersByPeriod(
  orders: Order[],
  selection: PeriodSelection,
  ref = new Date(),
): Order[] {
  if (selection.preset === "all") return orders;
  return orders.filter((o) => orderMatchesPeriod(o, selection, ref));
}

export function filterSupplementsByPeriod(
  supplements: SupplementOrder[],
  selection: PeriodSelection,
  ref = new Date(),
): SupplementOrder[] {
  if (selection.preset === "all") return supplements;
  return supplements.filter((s) => supplementMatchesPeriod(s, selection, ref));
}

const MONTH_NAMES = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

export function formatPeriodLabel(
  selection: PeriodSelection,
  ref = new Date(),
): string {
  if (selection.preset === "all") return "全部时间";
  if (selection.preset === "thisWeek") {
    return getWeekBounds(ref).label;
  }
  if (selection.preset === "lastWeek") {
    const prevRef = new Date(ref);
    prevRef.setDate(prevRef.getDate() - 7);
    return getWeekBounds(prevRef).label;
  }
  const bounds = getPeriodBounds(selection, ref);
  if (!bounds) return "全部时间";
  const y = bounds.start.getFullYear();
  const m = bounds.start.getMonth();
  return `${y}年${MONTH_NAMES[m]}`;
}

export function periodFilenameSuffix(
  selection: PeriodSelection,
  ref = new Date(),
): string {
  if (selection.preset === "all") return "全部";
  if (selection.preset === "thisWeek") {
    const { start } = getWeekBounds(ref);
    return `week-${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`;
  }
  if (selection.preset === "lastWeek") {
    const prevRef = new Date(ref);
    prevRef.setDate(prevRef.getDate() - 7);
    const { start } = getWeekBounds(prevRef);
    return `week-${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`;
  }
  const bounds = getPeriodBounds(selection, ref);
  if (!bounds) return "全部";
  return toYearMonth(bounds.start);
}

export const DEFAULT_PERIOD: PeriodSelection = {
  preset: "thisMonth",
};

export function shiftYearMonth(ym: string, deltaMonths: number): string | null {
  const parsed = parseYearMonth(ym);
  if (!parsed) return null;
  let { year, month } = parsed;
  month += deltaMonths;
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  while (month < 1) {
    month += 12;
    year -= 1;
  }
  return `${year}-${pad2(month)}`;
}

export function selectionToYearMonth(
  selection: PeriodSelection,
): string | null {
  if (selection.preset === "all") return null;
  if (isWeekPeriod(selection)) return null;
  const bounds = getPeriodBounds(selection);
  if (!bounds) return null;
  return toYearMonth(bounds.start);
}

export function yearMonthToPeriod(ym: string): PeriodSelection {
  return { preset: "custom", yearMonth: ym };
}

export function getPreviousPeriod(
  selection: PeriodSelection,
): PeriodSelection | null {
  if (selection.preset === "thisWeek") {
    return { preset: "lastWeek" };
  }
  if (selection.preset === "lastWeek") {
    return null;
  }

  const ym = selectionToYearMonth(selection);
  if (!ym) return null;
  const prev = shiftYearMonth(ym, -1);
  if (!prev) return null;
  return yearMonthToPeriod(prev);
}

/** 含当前月在内的最近 N 个自然月（YYYY-MM，从旧到新） */
export function listRecentYearMonths(count: number, ref = new Date()): string[] {
  const current = toYearMonth(ref);
  const result: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const ym = shiftYearMonth(current, -i);
    if (ym) result.push(ym);
  }
  return result;
}

export function isValidPeriodPreset(
  preset: unknown,
): preset is PeriodPreset {
  return (
    preset === "all" ||
    preset === "thisWeek" ||
    preset === "lastWeek" ||
    preset === "thisMonth" ||
    preset === "lastMonth" ||
    preset === "custom"
  );
}
