"use client";

import { FunnelCompareChart } from "@/components/evaluation/funnel-compare-chart";
import { IssueTagTrendChart } from "@/components/evaluation/issue-tag-trend-chart";
import {
  RiskMetricToggle,
  RiskTrendChart,
} from "@/components/evaluation/risk-trend-chart";
import {
  TrendLineChart,
  TrendMetricToggle,
  TrendMonthSpanToggle,
} from "@/components/evaluation/trend-line-chart";
import type { FunnelCompare } from "@/lib/conversion-funnel";
import type { IssueTagMonthPoint } from "@/lib/issue-tag-trend";
import { selectionToYearMonth } from "@/lib/period-filter";
import type { PeriodSelection } from "@/lib/period-filter";
import { exportIssueTagTrendCsv, exportTrendSeriesCsv } from "@/lib/trend-export";
import type {
  RiskTrendMetricKey,
  TrendMetricKey,
  TrendMonthPoint,
  TrendMonthSpan,
} from "@/lib/trend-series";
import { useState } from "react";

export type CockpitChartTab = "trend" | "funnel" | "risk" | "quality";

export const COCKPIT_CHART_TABS: { id: CockpitChartTab; label: string }[] = [
  { id: "trend", label: "经营趋势" },
  { id: "funnel", label: "转化漏斗" },
  { id: "risk", label: "异常趋势" },
  { id: "quality", label: "质量标签" },
];

interface CockpitChartsSharedProps {
  trendPoints: TrendMonthPoint[];
  issueTagPoints: IssueTagMonthPoint[];
  funnelCompare: FunnelCompare;
  period: PeriodSelection;
  periodLabel: string;
  monthSpan: TrendMonthSpan;
  onMonthSpanChange: (span: TrendMonthSpan) => void;
  onPeriodMonthSelect?: (yearMonth: string) => void;
  archiveMonths?: string[];
}

interface CockpitChartsToolbarProps extends CockpitChartsSharedProps {
  chartTab: CockpitChartTab;
  onChartTabChange: (tab: CockpitChartTab) => void;
  activeMetrics: TrendMetricKey[];
  onActiveMetricsChange: (metrics: TrendMetricKey[]) => void;
  riskMetrics: RiskTrendMetricKey[];
  onRiskMetricsChange: (metrics: RiskTrendMetricKey[]) => void;
}

export function CockpitChartsToolbar({
  chartTab,
  onChartTabChange,
  trendPoints,
  issueTagPoints,
  periodLabel,
  monthSpan,
  onMonthSpanChange,
  activeMetrics,
  onActiveMetricsChange,
  riskMetrics,
  onRiskMetricsChange,
}: CockpitChartsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {COCKPIT_CHART_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChartTabChange(tab.id)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                chartTab === tab.id
                  ? "bg-white text-rose-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <TrendMonthSpanToggle value={monthSpan} onChange={onMonthSpanChange} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {chartTab === "trend" ? (
          <>
            <TrendMetricToggle
              active={activeMetrics}
              onChange={onActiveMetricsChange}
            />
            <button
              type="button"
              onClick={() => exportTrendSeriesCsv(trendPoints, periodLabel)}
              className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-50"
            >
              导出趋势
            </button>
          </>
        ) : chartTab === "risk" ? (
          <RiskMetricToggle
            active={riskMetrics}
            onChange={onRiskMetricsChange}
          />
        ) : chartTab === "quality" ? (
          <button
            type="button"
            onClick={() =>
              exportIssueTagTrendCsv(issueTagPoints, periodLabel)
            }
            className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-50"
          >
            导出标签
          </button>
        ) : null}
      </div>
    </div>
  );
}

interface CockpitChartsContentProps extends CockpitChartsSharedProps {
  chartTab: CockpitChartTab;
  activeMetrics: TrendMetricKey[];
  riskMetrics: RiskTrendMetricKey[];
}

export function CockpitChartsContent({
  chartTab,
  trendPoints,
  issueTagPoints,
  funnelCompare,
  period,
  onPeriodMonthSelect,
  archiveMonths = [],
  activeMetrics,
  riskMetrics,
}: CockpitChartsContentProps) {
  const selectedYearMonth = selectionToYearMonth(period);

  return (
    <div className="p-4 sm:p-5">
      {chartTab === "trend" ? (
        <>
          <TrendLineChart
            points={trendPoints}
            activeMetrics={activeMetrics}
            selectedYearMonth={selectedYearMonth}
            onMonthClick={onPeriodMonthSelect}
          />
          {onPeriodMonthSelect ? (
            <p className="mt-2 text-[11px] text-slate-400">
              点击月份可切换下方明细的统计周期
            </p>
          ) : null}
        </>
      ) : chartTab === "funnel" ? (
        <FunnelCompareChart compare={funnelCompare} />
      ) : chartTab === "risk" ? (
        <>
          <RiskTrendChart
            points={trendPoints}
            activeMetrics={riskMetrics}
            selectedYearMonth={selectedYearMonth}
            onMonthClick={onPeriodMonthSelect}
          />
          {onPeriodMonthSelect ? (
            <p className="mt-2 text-[11px] text-slate-400">
              点击月份可切换下方明细的统计周期
            </p>
          ) : null}
        </>
      ) : (
        <>
          <IssueTagTrendChart
            points={issueTagPoints}
            selectedYearMonth={selectedYearMonth}
            onMonthClick={onPeriodMonthSelect}
          />
          {onPeriodMonthSelect ? (
            <p className="mt-2 text-[11px] text-slate-400">
              问题标签 Top3 占比 · 点击月份切换周期
            </p>
          ) : null}
        </>
      )}

      {archiveMonths.length > 0 ? (
        <p className="mt-3 text-[11px] text-slate-400">
          已归档月份：{archiveMonths.slice(0, 8).join("、")}
          {archiveMonths.length > 8
            ? ` 等 ${archiveMonths.length} 个月`
            : ""}
        </p>
      ) : null}
    </div>
  );
}

export function useCockpitChartsState() {
  const [chartTab, setChartTab] = useState<CockpitChartTab>("trend");
  const [activeMetrics, setActiveMetrics] = useState<TrendMetricKey[]>([
    "newDispatchCount",
    "orderedAmount",
    "signedContractAmount",
  ]);
  const [riskMetrics, setRiskMetrics] = useState<RiskTrendMetricKey[]>([
    "flowTimeoutCount",
    "signTimeoutCount",
    "pendingAcceptanceCount",
  ]);

  return {
    chartTab,
    setChartTab,
    activeMetrics,
    setActiveMetrics,
    riskMetrics,
    setRiskMetrics,
  };
}
