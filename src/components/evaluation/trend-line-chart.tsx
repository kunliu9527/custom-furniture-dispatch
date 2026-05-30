"use client";

import type { TrendMetricKey, TrendMonthPoint } from "@/lib/trend-series";
import {
  TREND_AMOUNT_METRICS,
  TREND_METRIC_OPTIONS,
} from "@/lib/trend-series";
import { useMemo } from "react";

interface TrendLineChartProps {
  points: TrendMonthPoint[];
  activeMetrics: TrendMetricKey[];
  height?: number;
  selectedYearMonth?: string | null;
  onMonthClick?: (yearMonth: string) => void;
}

const PAD = { top: 16, right: 44, bottom: 28, left: 44 };

function isAmountMetric(key: TrendMetricKey): boolean {
  return (TREND_AMOUNT_METRICS as string[]).includes(key);
}

export function TrendLineChart({
  points,
  activeMetrics,
  height = 220,
  selectedYearMonth = null,
  onMonthClick,
}: TrendLineChartProps) {
  const width = 640;
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  const series = useMemo(() => {
    return activeMetrics.map((key) => {
      const opt = TREND_METRIC_OPTIONS.find((o) => o.key === key)!;
      const values = points.map((p) => {
        const raw = p[key];
        return raw == null ? null : raw;
      });
      const axis: "amount" | "count" = isAmountMetric(key) ? "amount" : "count";
      return { key, opt, values, axis };
    });
  }, [activeMetrics, points]);

  const amountScale = useMemo(() => {
    const flat = series
      .filter((s) => s.axis === "amount")
      .flatMap((s) => s.values.filter((v): v is number => v != null));
    return scaleMinMax(flat);
  }, [series]);

  const countScale = useMemo(() => {
    const flat = series
      .filter((s) => s.axis === "count")
      .flatMap((s) => s.values.filter((v): v is number => v != null));
    return scaleMinMax(flat);
  }, [series]);

  const hasDualAxis =
    series.some((s) => s.axis === "amount") &&
    series.some((s) => s.axis === "count");

  function xAt(index: number): number {
    if (points.length <= 1) return PAD.left + innerW / 2;
    return PAD.left + (index / (points.length - 1)) * innerW;
  }

  function yAt(value: number, axis: "amount" | "count"): number {
    const sc = axis === "amount" ? amountScale : countScale;
    const ratio = (value - sc.min) / (sc.max - sc.min);
    return PAD.top + innerH - ratio * innerH;
  }

  function pathFor(
    values: (number | null)[],
    axis: "amount" | "count",
  ): string {
    const segments: string[] = [];
    values.forEach((v, i) => {
      if (v == null) return;
      segments.push(
        `${segments.length === 0 ? "M" : "L"}${xAt(i)},${yAt(v, axis)}`,
      );
    });
    return segments.join(" ");
  }

  if (points.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">暂无趋势数据</p>
    );
  }

  const yTicks = 4;

  return (
    <div className="overflow-x-auto">
      {hasDualAxis ? (
        <p className="mb-1 text-[10px] text-slate-400">
          左轴：金额 · 右轴：笔数/均分
        </p>
      ) : null}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[320px]"
        role="img"
        aria-label="经营趋势折线图"
      >
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const y = PAD.top + (i / yTicks) * innerH;
          const amountVal =
            amountScale.min +
            (amountScale.max - amountScale.min) * (1 - i / yTicks);
          const countVal =
            countScale.min +
            (countScale.max - countScale.min) * (1 - i / yTicks);
          return (
            <g key={i}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
              {series.some((s) => s.axis === "amount") ? (
                <text
                  x={PAD.left - 6}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px]"
                >
                  {formatAxisValue(amountVal)}
                </text>
              ) : null}
              {hasDualAxis ? (
                <text
                  x={width - PAD.right + 6}
                  y={y + 4}
                  textAnchor="start"
                  className="fill-slate-400 text-[10px]"
                >
                  {formatCountAxis(countVal)}
                </text>
              ) : series.some((s) => s.axis === "count") && !hasDualAxis ? (
                <text
                  x={PAD.left - 6}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px]"
                >
                  {formatCountAxis(countVal)}
                </text>
              ) : null}
            </g>
          );
        })}

        {points.map((p, i) => (
          <g key={p.yearMonth}>
            {onMonthClick ? (
              <rect
                x={xAt(i) - innerW / Math.max(points.length, 1) / 2}
                y={PAD.top}
                width={innerW / Math.max(points.length, 1)}
                height={innerH}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => onMonthClick(p.yearMonth)}
              />
            ) : null}
            <text
              x={xAt(i)}
              y={height - 6}
              textAnchor="middle"
              className={`text-[10px] ${
                selectedYearMonth === p.yearMonth
                  ? "fill-rose-600 font-semibold"
                  : "fill-slate-500"
              }`}
            >
              {p.label}
            </text>
          </g>
        ))}

        {series.map((s) => (
          <g key={s.key}>
            <path
              d={pathFor(s.values, s.axis)}
              fill="none"
              stroke={s.opt.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {s.values.map((v, i) =>
              v == null ? null : (
                <circle
                  key={`${s.key}-${i}`}
                  cx={xAt(i)}
                  cy={yAt(v, s.axis)}
                  r={3}
                  fill={s.opt.color}
                />
              ),
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function scaleMinMax(flat: number[]): { min: number; max: number } {
  if (flat.length === 0) return { min: 0, max: 1 };
  const min = Math.min(...flat);
  const max = Math.max(...flat);
  if (min === max) return { min: 0, max: max || 1 };
  return { min, max };
}

function formatAxisValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}m`;
  if (v >= 10_000) return `${Math.round(v / 10_000)}万`;
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(1);
}

function formatCountAxis(v: number): string {
  if (v <= 5.5 && v >= 0) return v.toFixed(1);
  return formatAxisValue(v);
}

export function TrendMetricToggle({
  active,
  onChange,
}: {
  active: TrendMetricKey[];
  onChange: (keys: TrendMetricKey[]) => void;
}) {
  function toggle(key: TrendMetricKey) {
    if (active.includes(key)) {
      if (active.length === 1) return;
      onChange(active.filter((k) => k !== key));
      return;
    }
    onChange([...active, key]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {TREND_METRIC_OPTIONS.map((opt) => {
        const on = active.includes(opt.key);
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => toggle(opt.key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
              on
                ? "border-slate-300 bg-white shadow-sm"
                : "border-transparent bg-slate-100 text-slate-500"
            }`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: opt.color }}
            />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function TrendMonthSpanToggle({
  value,
  onChange,
}: {
  value: 3 | 6 | 12;
  onChange: (span: 3 | 6 | 12) => void;
}) {
  const options: { value: 3 | 6 | 12; label: string }[] = [
    { value: 3, label: "近3月" },
    { value: 6, label: "近6月" },
    { value: 12, label: "近12月" },
  ];
  return (
    <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
            value === opt.value
              ? "bg-white text-rose-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
