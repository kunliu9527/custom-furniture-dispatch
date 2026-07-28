"use client";

import { PeriodFilterBar } from "@/components/shared/period-filter-bar";
import { formatPeriodLabel, type PeriodSelection } from "@/lib/period-filter";
import type { ReportPeriodFilterVariant } from "@/lib/report-period-sync";
import type { ReactNode } from "react";

export interface WorkbenchPeriodSearchBarProps {
  period: PeriodSelection;
  onPeriodChange: (next: PeriodSelection) => void;
  query?: string;
  onQueryChange?: (value: string) => void;
  hint?: string;
  placeholder?: string;
  resultCount?: number;
  /** 仅周期筛选，不显示查询框（如管理经营） */
  showSearch?: boolean;
  /** 顶栏标题，默认「统计周期」 */
  headingLabel?: string;
  /** 查询框宽度类名（设计师工作台缩小用） */
  searchWidthClass?: string;
  /** 查询框右侧附加控件 */
  trailing?: ReactNode;
  /** 统计周期按钮组口径 */
  periodVariant?: ReportPeriodFilterVariant;
}

/** 工作台统计周期 + 订单查询（参考设计师 / 门店订单状态查询） */
export function WorkbenchPeriodSearchBar({
  period,
  onPeriodChange,
  query = "",
  onQueryChange,
  hint,
  placeholder = "查询订单：客户、电话、地址、状态…",
  resultCount,
  showSearch = true,
  headingLabel = "统计周期",
  searchWidthClass,
  trailing,
  periodVariant = "default",
}: WorkbenchPeriodSearchBarProps) {
  const label = formatPeriodLabel(period);
  const searchClass =
    searchWidthClass ??
    "min-w-[12rem] flex-1 sm:min-w-[16rem]";

  return (
    <div className="block w-full space-y-2">
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="vi-heading-section shrink-0 text-[13px] leading-tight">
            {headingLabel}
          </p>
          {showSearch && onQueryChange ? (
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={placeholder}
              className={`vi-field py-1.5 ${searchClass}`}
            />
          ) : null}
          {trailing}
        </div>
        <div className="flex w-full min-w-0 items-center overflow-x-auto sm:ml-auto sm:w-auto sm:shrink-0 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <PeriodFilterBar
            value={period}
            onChange={onPeriodChange}
            inline
            variant={periodVariant}
          />
        </div>
      </div>
      <p className="text-[10px] leading-snug text-zinc-500">
        当前：<span className="font-medium text-zinc-700">{label}</span>
        {hint ? ` · ${hint}` : null}
        {showSearch && query.trim() && resultCount != null ? (
          <span className="font-medium text-zinc-600">
            {" "}
            · {resultCount} 笔
          </span>
        ) : null}
      </p>
    </div>
  );
}
