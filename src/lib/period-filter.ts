import type { Order, SupplementOrder } from "./types";

export type PeriodPreset = "all" | "thisMonth" | "lastMonth" | "custom";

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

export function getPeriodBounds(selection: PeriodSelection): PeriodBounds | null {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;

  if (selection.preset === "all") return null;

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
): boolean {
  const bounds = getPeriodBounds(selection);
  if (!bounds) return true;

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
): boolean {
  const bounds = getPeriodBounds(selection);
  if (!bounds) return true;
  return isIsoInBounds(supplement.createdAt, bounds);
}

export function filterOrdersByPeriod(
  orders: Order[],
  selection: PeriodSelection,
): Order[] {
  if (selection.preset === "all") return orders;
  return orders.filter((o) => orderMatchesPeriod(o, selection));
}

export function filterSupplementsByPeriod(
  supplements: SupplementOrder[],
  selection: PeriodSelection,
): SupplementOrder[] {
  if (selection.preset === "all") return supplements;
  return supplements.filter((s) => supplementMatchesPeriod(s, selection));
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

export function formatPeriodLabel(selection: PeriodSelection): string {
  if (selection.preset === "all") return "全部时间";
  const bounds = getPeriodBounds(selection);
  if (!bounds) return "全部时间";
  const y = bounds.start.getFullYear();
  const m = bounds.start.getMonth();
  return `${y}年${MONTH_NAMES[m]}`;
}

export function periodFilenameSuffix(selection: PeriodSelection): string {
  if (selection.preset === "all") return "全部";
  const bounds = getPeriodBounds(selection);
  if (!bounds) return "全部";
  return toYearMonth(bounds.start);
}

export const DEFAULT_PERIOD: PeriodSelection = {
  preset: "thisMonth",
};
