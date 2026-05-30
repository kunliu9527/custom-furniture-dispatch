import {
  formatPeriodLabel,
  getPreviousPeriod,
  type PeriodSelection,
} from "./period-filter";

export type BriefSecondaryCompare = "week" | "month-active" | "none";

export interface BriefComparisonContext {
  isCumulative: boolean;
  /** 第一行：统计周期环比 */
  hasPrimaryCompare: boolean;
  /** 第二行：次级对照类型 */
  secondaryCompare: BriefSecondaryCompare;
  secondarySuffix: string;
  /** 驾驶舱副标题补充 */
  secondaryCompareHint: string | null;
}

const THIS_MONTH: PeriodSelection = { preset: "thisMonth" };
const LAST_MONTH: PeriodSelection = { preset: "lastMonth" };

const THIS_WEEK: PeriodSelection = { preset: "thisWeek" };
const LAST_WEEK: PeriodSelection = { preset: "lastWeek" };

export function resolveBriefComparisonContext(
  period: PeriodSelection,
): BriefComparisonContext {
  if (period.preset === "all") {
    return {
      isCumulative: true,
      hasPrimaryCompare: false,
      secondaryCompare: "month-active",
      secondarySuffix: " · 本月活跃",
      secondaryCompareHint: `次级参照 ${formatPeriodLabel(THIS_MONTH)} vs ${formatPeriodLabel(LAST_MONTH)}`,
    };
  }

  if (period.preset === "thisWeek") {
    return {
      isCumulative: false,
      hasPrimaryCompare: Boolean(getPreviousPeriod(period)),
      secondaryCompare: "none",
      secondarySuffix: "",
      secondaryCompareHint: null,
    };
  }

  if (period.preset === "thisMonth") {
    return {
      isCumulative: false,
      hasPrimaryCompare: Boolean(getPreviousPeriod(period)),
      secondaryCompare: "week",
      secondarySuffix: "",
      secondaryCompareHint: "次级参照 较上周",
    };
  }

  return {
    isCumulative: false,
    hasPrimaryCompare: Boolean(getPreviousPeriod(period)),
    secondaryCompare: "none",
    secondarySuffix: "",
    secondaryCompareHint: null,
  };
}

export function formatSecondaryCompareDelta(
  current: number,
  previous: number,
  refLabel: string,
  suffix: string,
): string {
  if (previous === 0) {
    return current > 0
      ? `较${refLabel} ↑新增${suffix}`
      : `较${refLabel} 持平${suffix}`;
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return `较${refLabel} 持平${suffix}`;
  const arrow = pct > 0 ? "↑" : "↓";
  return `较${refLabel} ${arrow}${Math.abs(pct)}%${suffix}`;
}

export { THIS_MONTH, LAST_MONTH, THIS_WEEK, LAST_WEEK };

/** KPI 对照行用简称（副标题参照提示栏仍用 formatPeriodLabel） */
export const COMPARE_REF_PREV_MONTH = "上月";
export const COMPARE_REF_PREV_WEEK = "上周";
