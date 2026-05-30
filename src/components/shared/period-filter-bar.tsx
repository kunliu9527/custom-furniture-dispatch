"use client";

import {
  formatPeriodLabel,
  getCurrentYearMonth,
  type PeriodPreset,
  type PeriodSelection,
} from "@/lib/period-filter";
import type { ReportPeriodFilterVariant } from "@/lib/report-period-sync";
import {
  REPORT_MONTHLY_PRESETS,
  REPORT_WEEKLY_PRESETS,
  WEEKLY_BRIEF_PRESETS,
} from "@/lib/report-period-sync";

const allPresets: { id: PeriodPreset; label: string }[] = [
  { id: "thisWeek", label: "本周" },
  { id: "lastWeek", label: "上周" },
  { id: "thisMonth", label: "本月" },
  { id: "lastMonth", label: "上月" },
  { id: "all", label: "全部" },
  { id: "custom", label: "指定月" },
];

function presetsForVariant(variant: ReportPeriodFilterVariant) {
  switch (variant) {
    case "reportWeekly":
      return allPresets.filter((p) => REPORT_WEEKLY_PRESETS.includes(p.id));
    case "reportMonthly":
      return allPresets.filter((p) => REPORT_MONTHLY_PRESETS.includes(p.id));
    case "reportNeutral":
      return allPresets.filter((p) => p.id !== "lastWeek");
    case "weeklyBriefOnly":
      return allPresets.filter((p) => WEEKLY_BRIEF_PRESETS.includes(p.id));
    default:
      return allPresets.filter((p) => p.id !== "lastWeek");
  }
}

interface PeriodFilterBarProps {
  value: PeriodSelection;
  onChange: (next: PeriodSelection) => void;
  hint?: string;
  /** 嵌入工作台导航卡片内（无重复边框，略压缩） */
  embedded?: boolean;
  /** 与标题同一行，控件靠右（查找订单卡片） */
  inline?: boolean;
  /** 报告 Tab 驱动的周期选项 */
  variant?: ReportPeriodFilterVariant;
}

export function PeriodFilterBar({
  value,
  onChange,
  hint,
  embedded = false,
  inline = false,
  variant = "default",
}: PeriodFilterBarProps) {
  const label = formatPeriodLabel(value);
  const presets = presetsForVariant(variant);

  const presetButtons = (
    <>
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
            className={`rounded-md font-medium transition ${
              embedded || inline
                ? "px-2 py-1 text-[11px]"
                : "rounded-lg px-3 py-1.5 text-xs"
            } ${
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
    </>
  );

  if (inline) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-xs font-semibold text-slate-600">统计周期</span>
        <span className="hidden text-[11px] text-slate-500 sm:inline">
          {label}
        </span>
        <div className="flex flex-wrap items-center gap-1">{presetButtons}</div>
      </div>
    );
  }

  return (
    <div
      className={
        embedded
          ? "flex flex-wrap items-center gap-2"
          : "flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
      }
    >
      <div className="min-w-0 flex-1">
        <p
          className={
            embedded
              ? "text-[13px] font-semibold leading-tight text-slate-900"
              : "text-sm font-semibold text-slate-900"
          }
        >
          统计周期
        </p>
        <p
          className={
            embedded
              ? "mt-0.5 text-[10px] leading-snug text-slate-500"
              : "mt-0.5 text-xs text-slate-500"
          }
        >
          当前：<span className="font-medium text-slate-700">{label}</span>
          {hint ? ` · ${hint}` : " · 含派单月或流程节点落在该月的订单"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1">{presetButtons}</div>
    </div>
  );
}
