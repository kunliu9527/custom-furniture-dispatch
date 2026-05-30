"use client";

import {
  CockpitChartsContent,
  CockpitChartsToolbar,
  useCockpitChartsState,
} from "@/components/evaluation/evaluation-cockpit-charts";
import { TabTrendChartBody } from "@/components/evaluation/tab-trend-panel";
import type { DispatcherPerformanceRow } from "@/lib/dispatcher-performance";
import type { FunnelCompare } from "@/lib/conversion-funnel";
import type { EvaluationViewMode } from "@/lib/evaluation-stats";
import type { IssueTagMonthPoint } from "@/lib/issue-tag-trend";
import type { PeriodSelection } from "@/lib/period-filter";
import type {
  AcceptanceMiniPoint,
  DesignerMiniPoint,
  DispatcherMiniPoint,
  StoreBarItem,
} from "@/lib/tab-trend-series";
import type { TrendMonthPoint, TrendMonthSpan } from "@/lib/trend-series";
import { useState } from "react";

export interface ModeChartData {
  dispatcherSeries: DispatcherMiniPoint[];
  dispatcherTop5: DispatcherPerformanceRow[];
  designerSeries: DesignerMiniPoint[];
  storeBars: StoreBarItem[];
  acceptanceSeries: AcceptanceMiniPoint[];
}

type HubChartTab = "operations" | EvaluationViewMode;

const MAIN_TABS: { id: HubChartTab; label: string }[] = [
  { id: "operations", label: "经营图表" },
  { id: "dispatcher", label: "派单人归总" },
  { id: "designer", label: "设计师归总" },
  { id: "store", label: "门店归总" },
  { id: "acceptance", label: "验收归总" },
];

const CHART_HINTS: Record<EvaluationViewMode, string> = {
  dispatcher: "贡献 Top5 + 派单/签约走势",
  designer: "下单金额 + 转化率",
  store: "各门店下单金额（当期）",
  acceptance: "均分 + 电子验收率",
};

interface EvaluationOperationsChartHubProps {
  allowedModes: EvaluationViewMode[];
  hideStoreChartTab?: boolean;
  trendPoints: TrendMonthPoint[];
  issueTagPoints: IssueTagMonthPoint[];
  funnelCompare: FunnelCompare;
  period: PeriodSelection;
  periodLabel: string;
  monthSpan: TrendMonthSpan;
  onMonthSpanChange: (span: TrendMonthSpan) => void;
  onPeriodMonthSelect?: (yearMonth: string) => void;
  archiveMonths?: string[];
  dataByMode: Record<EvaluationViewMode, ModeChartData>;
  selectedYearMonth?: string | null;
}

export function EvaluationOperationsChartHub({
  allowedModes,
  hideStoreChartTab = false,
  trendPoints,
  issueTagPoints,
  funnelCompare,
  period,
  periodLabel,
  monthSpan,
  onMonthSpanChange,
  onPeriodMonthSelect,
  archiveMonths = [],
  dataByMode,
  selectedYearMonth,
}: EvaluationOperationsChartHubProps) {
  const visibleTabs = MAIN_TABS.filter((tab) => {
    if (tab.id === "operations") return true;
    if (tab.id === "store" && hideStoreChartTab) return false;
    return allowedModes.includes(tab.id);
  });
  const [activeTab, setActiveTab] = useState<HubChartTab>(
    visibleTabs[0]?.id ?? "operations",
  );
  const cockpit = useCockpitChartsState();

  const resolvedTab = visibleTabs.some((t) => t.id === activeTab)
    ? activeTab
    : (visibleTabs[0]?.id ?? "operations");

  const activeLabel =
    MAIN_TABS.find((t) => t.id === resolvedTab)?.label ?? "经营图表";

  const cockpitShared = {
    trendPoints,
    issueTagPoints,
    funnelCompare,
    period,
    periodLabel,
    monthSpan,
    onMonthSpanChange,
    onPeriodMonthSelect,
    archiveMonths,
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-white">
        <div className="flex flex-wrap items-end gap-x-5 gap-y-1 border-b border-slate-100 px-4 pt-3 pb-2 sm:px-5">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 pb-1.5 text-sm font-semibold transition ${
                resolvedTab === tab.id
                  ? "border-rose-600 text-rose-900"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {resolvedTab === "operations" ? (
          <CockpitChartsToolbar
            {...cockpitShared}
            chartTab={cockpit.chartTab}
            onChartTabChange={cockpit.setChartTab}
            activeMetrics={cockpit.activeMetrics}
            onActiveMetricsChange={cockpit.setActiveMetrics}
            riskMetrics={cockpit.riskMetrics}
            onRiskMetricsChange={cockpit.setRiskMetrics}
          />
        ) : (
          <p className="px-4 py-2 text-[11px] text-slate-500 sm:px-5">
            {activeLabel} · {CHART_HINTS[resolvedTab]}
          </p>
        )}
      </div>

      {resolvedTab === "operations" ? (
        <CockpitChartsContent
          {...cockpitShared}
          chartTab={cockpit.chartTab}
          activeMetrics={cockpit.activeMetrics}
          riskMetrics={cockpit.riskMetrics}
        />
      ) : (
        <div className="p-4 sm:p-5">
          <TabTrendChartBody
            viewMode={resolvedTab}
            dispatcherSeries={dataByMode[resolvedTab].dispatcherSeries}
            dispatcherTop5={dataByMode[resolvedTab].dispatcherTop5}
            designerSeries={dataByMode[resolvedTab].designerSeries}
            storeBars={dataByMode[resolvedTab].storeBars}
            acceptanceSeries={dataByMode[resolvedTab].acceptanceSeries}
            onMonthClick={onPeriodMonthSelect}
            selectedYearMonth={selectedYearMonth}
          />
        </div>
      )}
    </section>
  );
}
