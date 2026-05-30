import {
  isWeekPeriod,
  type PeriodPreset,
  type PeriodSelection,
} from "./period-filter";
import type { ReportTab } from "./report-hub-config";

export type ReportPeriodFilterVariant =
  | "default"
  | "reportWeekly"
  | "reportMonthly"
  | "reportNeutral"
  | "weeklyBriefOnly";

export const WEEKLY_BRIEF_PRESETS: PeriodPreset[] = ["thisWeek", "lastWeek"];

export const SNAPSHOT_REPORT_HINT =
  "待办与在途指标为当前快照，不受统计周期影响";

export function isMonthPeriod(selection: PeriodSelection): boolean {
  return (
    selection.preset === "thisMonth" ||
    selection.preset === "lastMonth" ||
    selection.preset === "custom"
  );
}

/** 切换报告 Tab 时，将统计周期对齐到周/月口径 */
export function resolvePeriodForReportTab(
  tab: ReportTab,
  current: PeriodSelection,
): PeriodSelection | null {
  switch (tab) {
    case "weekly":
      if (isWeekPeriod(current)) return null;
      return { preset: "thisWeek" };
    case "monthly":
      if (isMonthPeriod(current)) return null;
      return { preset: "thisMonth" };
    default:
      return null;
  }
}

export function periodFilterVariantForReportTab(
  tab: ReportTab,
): ReportPeriodFilterVariant {
  switch (tab) {
    case "weekly":
      return "reportWeekly";
    case "monthly":
      return "reportMonthly";
    case "pending":
    case "alerts":
    case "history":
      return "reportNeutral";
    default:
      return "default";
  }
}

export function reportPeriodBarHint(
  tab: ReportTab,
  storeScopeLabel?: string | null,
): string {
  const scope = storeScopeLabel ? `${storeScopeLabel} · ` : "";
  switch (tab) {
    case "weekly":
      return `${scope}周报与顶部统计周期（本周/上周）同步`;
    case "monthly":
      return `${scope}月报与顶部统计周期（本月/上月/指定月）同步`;
    case "pending":
    case "alerts":
      return `${scope}${SNAPSHOT_REPORT_HINT}`;
    case "history":
      return `${scope}历史简报按自然周/月回溯；待办类指标见对应 Tab`;
    default:
      return scope ? scope.slice(0, -3) : "订单查询与报告按此周期";
  }
}

/** 自然周参照日：本周=今天，上周=今天减 7 天 */
export function getWeekRefForPeriod(
  period: PeriodSelection,
  ref = new Date(),
): Date {
  if (period.preset === "lastWeek") {
    const d = new Date(ref);
    d.setDate(d.getDate() - 7);
    return d;
  }
  return ref;
}

/** 周报构建用的周期（非周周期时回退本周） */
export function resolveWeekPeriodForDigest(
  period: PeriodSelection | undefined,
): PeriodSelection {
  if (period && isWeekPeriod(period)) return period;
  return { preset: "thisWeek" };
}

export const REPORT_WEEKLY_PRESETS: PeriodPreset[] = ["thisWeek", "lastWeek"];

export const REPORT_MONTHLY_PRESETS: PeriodPreset[] = [
  "thisMonth",
  "lastMonth",
  "custom",
];

export function handleReportTabChange(
  tab: ReportTab,
  period: PeriodSelection,
  onTabChange: (tab: ReportTab) => void,
  onPeriodChange?: (period: PeriodSelection) => void,
): void {
  const nextPeriod = resolvePeriodForReportTab(tab, period);
  if (nextPeriod && onPeriodChange) {
    onPeriodChange(nextPeriod);
  }
  onTabChange(tab);
}
