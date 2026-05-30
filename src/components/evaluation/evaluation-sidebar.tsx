"use client";

import { EvaluationSideNav } from "@/components/evaluation/evaluation-side-nav";
import { EvaluationViewTabs } from "@/components/evaluation/evaluation-view-tabs";
import type { EvaluationExportPayload } from "@/lib/evaluation-export";
import type { EvaluationTabSummary, EvaluationViewMode } from "@/lib/evaluation-stats";
import type { SideNavGroup } from "@/components/evaluation/evaluation-side-nav";
import type {
  EvaluationOperationsSubView,
  EvaluationSubView,
} from "@/lib/evaluation-ui-persistence";

export type EvaluationMainSection = "operations" | "data";

type EvaluationExportData = Omit<EvaluationExportPayload, "viewMode">;

interface EvaluationSidebarProps {
  mainSection: EvaluationMainSection;
  onMainSectionChange: (section: EvaluationMainSection) => void;
  operationsSubView: EvaluationOperationsSubView;
  onOperationsSubViewChange: (view: EvaluationOperationsSubView) => void;
  viewMode: EvaluationViewMode;
  onViewModeChange: (mode: EvaluationViewMode) => void;
  summaries: Record<EvaluationViewMode, EvaluationTabSummary>;
  allowedModes: EvaluationViewMode[];
  exportData: EvaluationExportData;
  periodLabel?: string;
  sideNavGroups: SideNavGroup[];
  activeSubView: EvaluationSubView;
  onSubViewSelect: (id: EvaluationSubView) => void;
  /** 非总部：所属门店，用于经营管理报告文案 */
  reportScopeLabel?: string | null;
}

export function EvaluationSidebar({
  mainSection,
  onMainSectionChange,
  operationsSubView,
  onOperationsSubViewChange,
  viewMode,
  onViewModeChange,
  summaries,
  allowedModes,
  exportData,
  periodLabel,
  sideNavGroups,
  activeSubView,
  onSubViewSelect,
  reportScopeLabel = null,
}: EvaluationSidebarProps) {
  const operationsActive = mainSection === "operations";
  const operationsHint = reportScopeLabel
    ? `驾驶舱 · ${reportScopeLabel}`
    : "驾驶舱 · 全局报告";
  const reportsNavLabel = reportScopeLabel ? `${reportScopeLabel}报告` : "全局报告";

  return (
    <div className="space-y-2.5">
      <div className="space-y-1">
        <p className="px-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          总览
        </p>
        <button
          type="button"
          onClick={() => onMainSectionChange("operations")}
          className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${
            operationsActive
              ? "border-rose-300 bg-rose-50 ring-1 ring-rose-200"
              : "border-transparent hover:border-slate-200 hover:bg-slate-50"
          }`}
        >
          <span
            className={`block text-[13px] font-semibold leading-tight ${
              operationsActive ? "text-rose-900" : "text-slate-900"
            }`}
          >
            管理经营
          </span>
          <span className="mt-0.5 block text-[10px] leading-snug text-slate-500">
            {operationsHint}
          </span>
        </button>
      </div>

      {operationsActive ? (
        <div className="space-y-1 border-t border-slate-100 pt-2">
          <p className="px-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            管理经营
          </p>
          <button
            type="button"
            onClick={() => onOperationsSubViewChange("cockpit")}
            className={`w-full rounded-lg border px-2.5 py-2 text-left text-[13px] font-semibold transition ${
              operationsSubView === "cockpit"
                ? "border-rose-300 bg-rose-50 text-rose-900 ring-1 ring-rose-200"
                : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50"
            }`}
          >
            经营驾驶舱
          </button>
          <button
            type="button"
            onClick={() => onOperationsSubViewChange("reports")}
            className={`w-full rounded-lg border px-2.5 py-2 text-left text-[13px] font-semibold transition ${
              operationsSubView === "reports"
                ? "border-rose-300 bg-rose-50 text-rose-900 ring-1 ring-rose-200"
                : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50"
            }`}
          >
            {reportsNavLabel}
          </button>
        </div>
      ) : null}

      <EvaluationViewTabs
        value={viewMode}
        onChange={(mode) => {
          onMainSectionChange("data");
          onViewModeChange(mode);
        }}
        summaries={summaries}
        allowedModes={allowedModes}
        exportData={exportData}
        periodLabel={periodLabel}
        layout="sidebar"
        highlightMode={mainSection === "data"}
      />

      {mainSection === "data" ? (
        <EvaluationSideNav
          groups={sideNavGroups}
          active={activeSubView}
          onSelect={onSubViewSelect}
        />
      ) : null}
    </div>
  );
}

/** 移动端：管理经营 + 数据板块横排 */
export function EvaluationMobileNav({
  mainSection,
  onMainSectionChange,
  operationsSubView,
  onOperationsSubViewChange,
  viewMode,
  onViewModeChange,
  summaries,
  allowedModes,
  exportData,
  periodLabel,
  reportScopeLabel = null,
}: Pick<
  EvaluationSidebarProps,
  | "mainSection"
  | "onMainSectionChange"
  | "operationsSubView"
  | "onOperationsSubViewChange"
  | "viewMode"
  | "onViewModeChange"
  | "summaries"
  | "allowedModes"
  | "exportData"
  | "periodLabel"
  | "reportScopeLabel"
>) {
  const operationsHint = reportScopeLabel
    ? `驾驶舱 · ${reportScopeLabel}`
    : "驾驶舱 · 全局报告";
  const reportsNavLabel = reportScopeLabel ? `${reportScopeLabel}报告` : "全局报告";

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => onMainSectionChange("operations")}
        className={`w-full rounded-xl border px-4 py-3 text-left ${
          mainSection === "operations"
            ? "border-rose-300 bg-rose-50 ring-1 ring-rose-200"
            : "border-slate-200 bg-white"
        }`}
      >
        <p className="text-sm font-semibold text-slate-900">管理经营</p>
        <p className="text-xs text-slate-500">{operationsHint}</p>
      </button>
      {mainSection === "operations" ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onOperationsSubViewChange("cockpit")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
              operationsSubView === "cockpit"
                ? "border-rose-300 bg-rose-50 text-rose-900"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            经营驾驶舱
          </button>
          <button
            type="button"
            onClick={() => onOperationsSubViewChange("reports")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
              operationsSubView === "reports"
                ? "border-rose-300 bg-rose-50 text-rose-900"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            {reportsNavLabel}
          </button>
        </div>
      ) : null}
      <EvaluationViewTabs
        value={viewMode}
        onChange={(mode) => {
          onMainSectionChange("data");
          onViewModeChange(mode);
        }}
        summaries={summaries}
        allowedModes={allowedModes}
        exportData={exportData}
        periodLabel={periodLabel}
        layout="grid"
        highlightMode={mainSection === "data"}
      />
    </div>
  );
}
