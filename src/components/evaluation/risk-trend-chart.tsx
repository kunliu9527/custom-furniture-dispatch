"use client";

import type { RiskTrendMetricKey, TrendMonthPoint } from "@/lib/trend-series";
import { RISK_TREND_METRIC_OPTIONS } from "@/lib/trend-series";
import { useMemo } from "react";

interface RiskTrendChartProps {
  points: TrendMonthPoint[];
  activeMetrics: RiskTrendMetricKey[];
  height?: number;
  selectedYearMonth?: string | null;
  onMonthClick?: (yearMonth: string) => void;
}

const PAD = { top: 16, right: 12, bottom: 28, left: 36 };

export function RiskTrendChart({
  points,
  activeMetrics,
  height = 180,
  selectedYearMonth = null,
  onMonthClick,
}: RiskTrendChartProps) {
  const width = 640;
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  const series = useMemo(() => {
    return activeMetrics.map((key) => {
      const opt = RISK_TREND_METRIC_OPTIONS.find((o) => o.key === key)!;
      return { key, opt, values: points.map((p) => p[key]) };
    });
  }, [activeMetrics, points]);

  const max = useMemo(() => {
    const flat = series.flatMap((s) => s.values);
    return Math.max(1, ...flat);
  }, [series]);

  function xAt(index: number): number {
    if (points.length <= 1) return PAD.left + innerW / 2;
    return PAD.left + (index / (points.length - 1)) * innerW;
  }

  function yAt(value: number): number {
    return PAD.top + innerH - (value / max) * innerH;
  }

  function pathFor(values: number[]): string {
    const segments: string[] = [];
    values.forEach((v, i) => {
      const cmd = segments.length === 0 ? "M" : "L";
      segments.push(`${cmd}${xAt(i)},${yAt(v)}`);
    });
    return segments.join(" ");
  }

  if (points.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">暂无异常趋势</p>;
  }

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[320px]"
        role="img"
        aria-label="异常趋势折线图"
      >
        {[0, 0.5, 1].map((ratio) => {
          const y = PAD.top + innerH * ratio;
          const v = Math.round(max * (1 - ratio));
          return (
            <g key={ratio}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 4}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 text-[10px]"
              >
                {v}
              </text>
            </g>
          );
        })}

        {points.map((p, i) => (
          <g key={p.yearMonth}>
            {onMonthClick ? (
              <rect
                x={xAt(i) - innerW / points.length / 2}
                y={PAD.top}
                width={innerW / points.length}
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
              d={pathFor(s.values)}
              fill="none"
              stroke={s.opt.color}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            {s.values.map((v, i) => (
              <circle
                key={`${s.key}-${i}`}
                cx={xAt(i)}
                cy={yAt(v)}
                r={3}
                fill={s.opt.color}
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}

export function RiskMetricToggle({
  active,
  onChange,
}: {
  active: RiskTrendMetricKey[];
  onChange: (keys: RiskTrendMetricKey[]) => void;
}) {
  function toggle(key: RiskTrendMetricKey) {
    if (active.includes(key)) {
      if (active.length === 1) return;
      onChange(active.filter((k) => k !== key));
      return;
    }
    onChange([...active, key]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {RISK_TREND_METRIC_OPTIONS.map((opt) => {
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
