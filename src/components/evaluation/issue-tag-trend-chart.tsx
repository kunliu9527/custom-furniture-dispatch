"use client";

import type { IssueTagMonthPoint } from "@/lib/issue-tag-trend";
import { useMemo } from "react";

const TAG_COLORS = ["#e11d48", "#ea580c", "#ca8a04"];

interface IssueTagTrendChartProps {
  points: IssueTagMonthPoint[];
  height?: number;
  selectedYearMonth?: string | null;
  onMonthClick?: (yearMonth: string) => void;
}

export function IssueTagTrendChart({
  points,
  height = 200,
  selectedYearMonth = null,
  onMonthClick,
}: IssueTagTrendChartProps) {
  const width = 640;
  const PAD = { top: 16, right: 12, bottom: 28, left: 36 };
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  const tagLabels = useMemo(() => {
    const set = new Set<string>();
    for (const p of points) {
      for (const t of p.tags) set.add(t.tag);
    }
    return [...set].slice(0, 3);
  }, [points]);

  const series = useMemo(() => {
    return tagLabels.map((tag, ti) => ({
      tag,
      color: TAG_COLORS[ti % TAG_COLORS.length]!,
      values: points.map((p) => {
        const found = p.tags.find((t) => t.tag === tag);
        return found?.share ?? 0;
      }),
    }));
  }, [points, tagLabels]);

  const max = 100;

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

  if (points.every((p) => p.totalTagged === 0)) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        暂无问题标签趋势数据
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="mb-2 flex flex-wrap gap-3">
        {series.map((s) => (
          <span
            key={s.tag}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {s.tag}
          </span>
        ))}
        <span className="text-xs text-slate-400">占比 %</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[320px]"
        role="img"
        aria-label="问题标签 Top3 占比趋势"
      >
        {[0, 25, 50, 75, 100].map((v) => {
          const y = yAt(v);
          return (
            <g key={v}>
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
                y={y + 3}
                textAnchor="end"
                className="fill-slate-400 text-[10px]"
              >
                {v}%
              </text>
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
          <path
            key={s.tag}
            d={pathFor(s.values)}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </div>
  );
}
