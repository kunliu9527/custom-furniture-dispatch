"use client";

import {
  WorkbenchPeriodSearchBar,
  type WorkbenchPeriodSearchBarProps,
} from "@/components/shared/workbench-period-search-bar";
import type { DesignerSidebarFilter } from "@/lib/designer-sidebar-filter";

interface DesignerPeriodSearchBarProps extends WorkbenchPeriodSearchBarProps {
  statusFilter: DesignerSidebarFilter;
  onStatusFilterChange: (status: DesignerSidebarFilter) => void;
  supplementCount: number;
}

export function DesignerPeriodSearchBar({
  statusFilter,
  onStatusFilterChange,
  supplementCount,
  ...rest
}: DesignerPeriodSearchBarProps) {
  const supplementActive = statusFilter === "增补单";

  return (
    <WorkbenchPeriodSearchBar
      {...rest}
      searchWidthClass="min-w-0 w-full max-w-none flex-1 sm:min-w-[11rem] sm:w-[85%] sm:max-w-[14rem] sm:flex-none"
      trailing={
        <button
          type="button"
          onClick={() => onStatusFilterChange("增补单")}
          className={`group inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[13px] font-semibold transition ${
            supplementActive
              ? "border-teal-300 bg-teal-50 text-teal-900 ring-1 ring-teal-200"
              : "border-slate-200 bg-white text-slate-700 hover:border-teal-400 hover:bg-teal-100 hover:text-teal-900 hover:shadow-sm"
          }`}
        >
          增补单
          <span
            className={`rounded px-1 text-[11px] tabular-nums transition ${
              supplementActive
                ? "bg-teal-100 font-medium text-teal-800"
                : "text-slate-500 group-hover:bg-teal-200/70 group-hover:font-medium group-hover:text-teal-800"
            }`}
          >
            {supplementCount}
          </span>
        </button>
      }
    />
  );
}
