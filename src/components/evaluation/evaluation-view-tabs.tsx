"use client";

import { EvaluationExportButton } from "@/components/evaluation/evaluation-export-button";
import type { EvaluationExportPayload } from "@/lib/evaluation-export";
import {
  formatEvaluationMetric,
  type EvaluationTabSummary,
  type EvaluationViewMode,
} from "@/lib/evaluation-stats";

const tabs: {
  id: EvaluationViewMode;
  label: string;
  description: string;
}[] = [
  { id: "dispatcher", label: "派单人数据", description: "按派单人个人归集" },
  { id: "designer", label: "设计师数据", description: "按设计师个人归集" },
  { id: "store", label: "门店数据", description: "按门店名称归集" },
  { id: "acceptance", label: "客户验收评价", description: "扫码评价与人员均分" },
];


type EvaluationExportData = Omit<EvaluationExportPayload, "viewMode">;

interface EvaluationViewTabsProps {
  value: EvaluationViewMode;
  onChange: (mode: EvaluationViewMode) => void;
  summaries: Record<EvaluationViewMode, EvaluationTabSummary>;
  allowedModes: EvaluationViewMode[];
  exportData: EvaluationExportData;
  periodLabel?: string;
  layout?: "grid" | "sidebar";
  /** 为 false 时数据 Tab 不高亮（当前在管理经营） */
  highlightMode?: boolean;
}

export function EvaluationViewTabs({
  value,
  onChange,
  summaries,
  allowedModes,
  exportData,
  periodLabel,
  layout = "grid",
  highlightMode = true,
}: EvaluationViewTabsProps) {
  const visibleTabs = tabs.filter((tab) => allowedModes.includes(tab.id));

  if (layout === "sidebar") {
    return (
      <div className="space-y-1.5">
        <p className="px-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          数据板块
        </p>
        <ul className="space-y-0.5">
          {visibleTabs.map((tab) => {
            const summary = summaries[tab.id];
            const metric =
              summary.displayText ??
              formatEvaluationMetric(summary.count, summary.amount);
            const active = highlightMode && value === tab.id;
            return (
              <li key={tab.id}>
                <button
                  type="button"
                  onClick={() => onChange(tab.id)}
                  className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${
                    active
                      ? "border-rose-300 bg-rose-50 ring-1 ring-rose-200"
                      : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span
                      className={`text-[13px] font-semibold leading-tight ${
                        active ? "text-rose-900" : "text-slate-900"
                      }`}
                    >
                      {tab.label}
                    </span>
                    <EvaluationExportButton
                      mode={tab.id}
                      data={exportData}
                      periodLabel={periodLabel}
                    />
                  </div>
                  <p
                    className={`mt-0.5 text-[11px] font-semibold tabular-nums leading-tight ${
                      active ? "text-rose-800" : "text-indigo-700"
                    }`}
                  >
                    {metric}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const gridClass =
    visibleTabs.length === 1
      ? "grid gap-3"
      : visibleTabs.length === 2
        ? "grid gap-3 sm:grid-cols-2"
        : visibleTabs.length === 3
          ? "grid gap-3 sm:grid-cols-3"
          : "grid gap-3 sm:grid-cols-2";

  return (
    <div className={gridClass}>
      {visibleTabs.map((tab) => {
        const summary = summaries[tab.id];
        const metric =
          summary.displayText ??
          formatEvaluationMetric(summary.count, summary.amount);
        const metricHint = summary.metricHint ?? "数量 / 金额";
        const active = highlightMode && value === tab.id;
        return (
          <div
            key={tab.id}
            className={`rounded-xl border px-4 py-4 transition ${
              active
                ? "border-rose-300 bg-rose-50 shadow-sm ring-1 ring-rose-200"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => onChange(tab.id)}
                className="min-w-0 flex-1 text-left"
              >
                <p
                  className={`text-sm font-semibold ${
                    active ? "text-rose-900" : "text-slate-900"
                  }`}
                >
                  {tab.label}
                </p>
                <p
                  className={`mt-1 text-xs ${
                    active ? "text-rose-700" : "text-slate-500"
                  }`}
                >
                  {tab.description}
                </p>
              </button>
              <EvaluationExportButton
                mode={tab.id}
                data={exportData}
                periodLabel={periodLabel}
              />
            </div>
            <button
              type="button"
              onClick={() => onChange(tab.id)}
              className="mt-2 w-full text-left"
            >
              <p
                className={`text-sm font-semibold tabular-nums ${
                  active ? "text-rose-800" : "text-indigo-700"
                }`}
              >
                {metric}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">{metricHint}</p>
            </button>
          </div>
        );
      })}
    </div>
  );
}
