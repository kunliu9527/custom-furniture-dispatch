import { aggregateIssueTags } from "./issue-tag-stats";
import {
  listRecentYearMonths,
  parseYearMonth,
  yearMonthToPeriod,
} from "./period-filter";
import type { Order, OrderIssueTag } from "./types";

export interface IssueTagMonthPoint {
  yearMonth: string;
  label: string;
  totalTagged: number;
  tags: { tag: OrderIssueTag; count: number; share: number }[];
}

function formatMonthLabel(yearMonth: string): string {
  const parsed = parseYearMonth(yearMonth);
  if (!parsed) return yearMonth;
  return `${parsed.month}月`;
}

export function buildIssueTagTrendSeries(
  orders: Order[],
  monthCount = 6,
  ref = new Date(),
): IssueTagMonthPoint[] {
  return listRecentYearMonths(monthCount, ref).map((ym) => {
    const period = yearMonthToPeriod(ym);
    const stats = aggregateIssueTags(orders, period);
    const totalTagged = stats.reduce((sum, s) => sum + s.count, 0);
    const top3 = stats.slice(0, 3).map((s) => ({
      tag: s.tag,
      count: s.count,
      share: totalTagged > 0 ? Math.round((s.count / totalTagged) * 1000) / 10 : 0,
    }));
    return {
      yearMonth: ym,
      label: formatMonthLabel(ym),
      totalTagged,
      tags: top3,
    };
  });
}
