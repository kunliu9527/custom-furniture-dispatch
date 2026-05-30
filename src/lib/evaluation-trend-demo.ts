import type { IssueTagMonthPoint } from "./issue-tag-trend";
import type { TrendMonthPoint } from "./trend-series";
import { listRecentYearMonths } from "./period-filter";
import { parseYearMonth } from "./period-filter";

const DEMO_TAGS = ["工艺错误", "沟通问题", "效率过慢"] as const;

function monthLabel(ym: string): string {
  const p = parseYearMonth(ym);
  return p ? `${p.month}月` : ym;
}

export function isTrendSeriesSparse(points: TrendMonthPoint[]): boolean {
  if (points.length === 0) return true;
  return points.every(
    (p) =>
      p.newDispatchCount === 0 &&
      p.signedContractAmount === 0 &&
      p.orderedAmount === 0 &&
      p.refundCount === 0,
  );
}

export function shouldUseEvaluationDemo(): boolean {
  if (process.env.NEXT_PUBLIC_EVALUATION_DEMO === "true") return true;
  return process.env.NODE_ENV === "development";
}

/** 稀疏真实数据时注入可读的演示趋势，便于验收图表 */
export function applyDemoTrendFallback(
  points: TrendMonthPoint[],
  monthCount: number,
  ref = new Date(),
): TrendMonthPoint[] {
  if (!shouldUseEvaluationDemo() || !isTrendSeriesSparse(points)) {
    return points;
  }
  const months = listRecentYearMonths(monthCount, ref);
  const seeds = [0.55, 0.72, 0.68, 0.85, 0.92, 1.0, 0.88, 0.95, 0.78, 0.82, 0.9, 1.05];
  return months.map((ym, i) => {
    const s = seeds[i % seeds.length]!;
    const base = 8 + i * 2;
    return {
      yearMonth: ym,
      label: monthLabel(ym),
      newDispatchCount: Math.round(base * s),
      signedContractAmount: Math.round(280_000 * s + i * 15_000),
      orderedAmount: Math.round(220_000 * s + i * 12_000),
      orderedCount: Math.round((base - 1) * s),
      refundCount: Math.max(0, Math.round((2 - i * 0.15) * s)),
      refundAmount: Math.round(35_000 * Math.max(0, 2 - i * 0.2) * s),
      acceptanceAvg: 4.2 + (i % 5) * 0.15,
      flowTimeoutCount: Math.max(1, Math.round(5 - i * 0.3)),
      signTimeoutCount: Math.max(0, Math.round(3 - i * 0.25)),
      pendingAcceptanceCount: Math.max(2, Math.round(12 - i * 0.8)),
      isDemo: true,
    };
  });
}

export function isIssueTagTrendSparse(points: IssueTagMonthPoint[]): boolean {
  return points.every((p) => p.totalTagged === 0);
}

export function applyDemoIssueTagFallback(
  points: IssueTagMonthPoint[],
  monthCount: number,
  ref = new Date(),
): IssueTagMonthPoint[] {
  if (!shouldUseEvaluationDemo() || !isIssueTagTrendSparse(points)) {
    return points;
  }
  const months = listRecentYearMonths(monthCount, ref);
  return months.map((ym, i) => {
    const total = 8 + i * 2;
    const shares = [
      [42, 28, 18],
      [38, 32, 20],
      [45, 25, 15],
    ][i % 3]!;
    return {
      yearMonth: ym,
      label: monthLabel(ym),
      totalTagged: total,
      tags: DEMO_TAGS.map((tag, ti) => ({
        tag,
        count: Math.round((total * shares[ti]!) / 100),
        share: shares[ti]!,
      })),
      isDemo: true,
    } as IssueTagMonthPoint & { isDemo?: boolean };
  });
}
