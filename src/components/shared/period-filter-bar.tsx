"use client";

import {
  formatPeriodLabel,
  getCurrentYearMonth,
  type PeriodPreset,
  type PeriodSelection,
} from "@/lib/period-filter";

const presets: { id: PeriodPreset; label: string }[] = [
  { id: "thisMonth", label: "本月" },
  { id: "lastMonth", label: "上月" },
  { id: "all", label: "全部" },
  { id: "custom", label: "指定月" },
];

interface PeriodFilterBarProps {
  value: PeriodSelection;
  onChange: (next: PeriodSelection) => void;
  hint?: string;
}

export function PeriodFilterBar({ value, onChange, hint }: PeriodFilterBarProps) {
  const label = formatPeriodLabel(value);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">统计周期</p>
        <p className="mt-0.5 text-xs text-slate-500">
          当前：<span className="font-medium text-slate-700">{label}</span>
          {hint ? ` · ${hint}` : " · 含派单月或流程节点落在该月的订单"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {presets.map((p) => {
          const active = value.preset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() =>
                onChange({
                  preset: p.id,
                  yearMonth:
                    p.id === "custom"
                      ? value.yearMonth ?? getCurrentYearMonth()
                      : undefined,
                })
              }
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p.label}
            </button>
          );
        })}
        {value.preset === "custom" ? (
          <input
            type="month"
            value={value.yearMonth ?? getCurrentYearMonth()}
            onChange={(e) =>
              onChange({ preset: "custom", yearMonth: e.target.value })
            }
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700"
          />
        ) : null}
      </div>
    </div>
  );
}
