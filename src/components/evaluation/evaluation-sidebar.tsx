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

  const reportsNavLabel = reportScopeLabel ? `${reportScopeLabel}报告` : "全局报告";

  const lookupHint = periodLabel

    ? `状态 · 派单人 · 设计师 · 门店 · ${periodLabel}`

    : "状态 · 派单人 · 设计师 · 门店";



  return (

    <div className="space-y-2.5">

      <div className="space-y-1">

        <p className="px-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">

          总览

        </p>

        <button
          type="button"
          onClick={() => {
            onMainSectionChange("operations");
            onOperationsSubViewChange("cockpit");
          }}
          className={`vi-sidebar-item w-full text-left ${
            operationsActive && operationsSubView === "cockpit"
              ? "vi-sidebar-item-active border-l-[3px] border-l-rose-500 pl-[calc(0.625rem-2px)]"
              : ""
          }`}
        >
          <span className="vi-sidebar-item-title">经营驾驶舱</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onMainSectionChange("operations");
            onOperationsSubViewChange("reports");
          }}
          className={`vi-sidebar-item w-full text-left ${
            operationsActive && operationsSubView === "reports"
              ? "vi-sidebar-item-active border-l-[3px] border-l-rose-500 pl-[calc(0.625rem-2px)]"
              : ""
          }`}
        >
          <span className="vi-sidebar-item-title truncate" title={reportsNavLabel}>
            {reportsNavLabel}
          </span>
        </button>

        <button

          type="button"

          onClick={() => {

            onMainSectionChange("operations");

            onOperationsSubViewChange("lookup");

          }}

          className={`vi-sidebar-item vi-sidebar-item-stack w-full text-left ${
            operationsActive && operationsSubView === "lookup"
              ? "vi-sidebar-item-active border-l-[3px] border-l-rose-500 pl-[calc(0.625rem-2px)]"
              : ""
          }`}

        >

          <span className="vi-sidebar-item-title">订单查询</span>

          <span className="vi-sidebar-item-hint line-clamp-2 leading-snug break-all">
            {lookupHint}
          </span>

        </button>

      </div>



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



/** 移动端：总览 + 数据板块 */

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

  const operationsActive = mainSection === "operations";

  const reportsNavLabel = reportScopeLabel ? `${reportScopeLabel}报告` : "全局报告";



  return (

    <div className="space-y-3">

      <div className="flex flex-wrap gap-2">

        <button

          type="button"

          onClick={() => {

            onMainSectionChange("operations");

            onOperationsSubViewChange("cockpit");

          }}

          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${

            operationsActive && operationsSubView === "cockpit"

              ? "border-rose-300 bg-rose-50 text-rose-900"

              : "border-slate-200 bg-white text-slate-700"

          }`}

        >

          经营驾驶舱

        </button>

        <button

          type="button"

          onClick={() => {

            onMainSectionChange("operations");

            onOperationsSubViewChange("reports");

          }}

          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${

            operationsActive && operationsSubView === "reports"

              ? "border-rose-300 bg-rose-50 text-rose-900"

              : "border-slate-200 bg-white text-slate-700"

          }`}

        >

          {reportsNavLabel}

        </button>

        <button

          type="button"

          onClick={() => {

            onMainSectionChange("operations");

            onOperationsSubViewChange("lookup");

          }}

          className={`w-full rounded-lg border px-3 py-2 text-sm font-medium ${

            operationsActive && operationsSubView === "lookup"

              ? "border-rose-300 bg-rose-50 text-rose-900"

              : "border-slate-200 bg-white text-slate-700"

          }`}

        >

          订单查询

          {periodLabel ? (

            <span className="mt-0.5 block text-xs font-normal text-slate-500">

              {periodLabel}

            </span>

          ) : null}

        </button>

      </div>

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


