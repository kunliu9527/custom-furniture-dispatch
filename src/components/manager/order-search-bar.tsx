"use client";

import { PeriodFilterBar } from "@/components/shared/period-filter-bar";
import type { PeriodSelection } from "@/lib/period-filter";

export type OrderDispatchLookupFilter = "all" | "undispatched" | "dispatched";

interface OrderSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  resultCount?: number;
  placeholder?: string;
  period?: PeriodSelection;
  onPeriodChange?: (next: PeriodSelection) => void;
  dispatchFilter?: OrderDispatchLookupFilter;
  onDispatchFilterChange?: (filter: OrderDispatchLookupFilter) => void;
  dispatchCounts?: {
    all: number;
    undispatched: number;
    dispatched: number;
  };
  /** 嵌入外层卡片，无独立边框 */
  embedded?: boolean;
}

const DISPATCH_TABS: { id: OrderDispatchLookupFilter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "undispatched", label: "未派单" },
  { id: "dispatched", label: "已派单" },
];

export function OrderSearchBar({
  value,
  onChange,
  resultCount,
  placeholder = "客户姓名、电话、地址、设计师、派单人、门店…",
  period,
  onPeriodChange,
  dispatchFilter,
  onDispatchFilterChange,
  dispatchCounts,
  embedded = false,
}: OrderSearchBarProps) {
  const showPeriod = period != null && onPeriodChange != null;
  const showDispatch =
    dispatchFilter != null &&
    onDispatchFilterChange != null &&
    dispatchCounts != null;

  const inner = (
    <label className="block space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="shrink-0 text-sm font-semibold text-slate-900">
          查找订单
          {value.trim() ? (
            <span className="font-normal text-slate-500">
              {" "}
              · {resultCount ?? 0} 笔
            </span>
          ) : null}
        </span>
        {showDispatch ? (
          <div className="flex flex-wrap items-center gap-1">
            {DISPATCH_TABS.map((tab) => {
              const active = dispatchFilter === tab.id;
              const count =
                tab.id === "all"
                  ? dispatchCounts.all
                  : tab.id === "undispatched"
                    ? dispatchCounts.undispatched
                    : dispatchCounts.dispatched;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onDispatchFilterChange(tab.id)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                    active
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-1 tabular-nums ${active ? "text-indigo-100" : "text-slate-500"}`}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
        {showPeriod ? (
          <div className="ml-auto min-w-0">
            <PeriodFilterBar
              value={period}
              onChange={onPeriodChange}
              inline
            />
          </div>
        ) : null}
      </div>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      />
    </label>
  );

  if (embedded) {
    return inner;
  }

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      {inner}
    </section>
  );
}
