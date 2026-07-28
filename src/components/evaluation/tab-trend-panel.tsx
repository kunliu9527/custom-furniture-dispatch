"use client";

import type { DispatcherPerformanceRow } from "@/lib/dispatcher-performance";
import type {
  AcceptanceMiniPoint,
  DesignerMiniPoint,
  DispatcherMiniPoint,
  StoreBarItem,
} from "@/lib/tab-trend-series";
import type { EvaluationViewMode } from "@/lib/evaluation-stats";
import { formatDispatchMoney } from "@/lib/dispatch-totals";
import { DISPATCHER_TOP5_RULE } from "@/lib/performance-algorithm-copy";

interface TabTrendPanelProps {
  /** 左侧子目录标题，嵌入图表表头（如「派单人归总」） */
  title: string;
  /** 数据板块名称（如「派单人数据」） */
  sectionLabel?: string;
  viewMode: EvaluationViewMode;
  dispatcherSeries: DispatcherMiniPoint[];
  dispatcherTop5: DispatcherPerformanceRow[];
  designerSeries: DesignerMiniPoint[];
  storeBars: StoreBarItem[];
  acceptanceSeries: AcceptanceMiniPoint[];
  onMonthClick?: (yearMonth: string) => void;
  selectedYearMonth?: string | null;
}

export function TabTrendChartBody({
  viewMode,
  dispatcherSeries,
  dispatcherTop5,
  designerSeries,
  storeBars,
  acceptanceSeries,
  onMonthClick,
  selectedYearMonth,
}: Omit<TabTrendPanelProps, "title" | "sectionLabel">) {
  return (
    <div className="space-y-4">
      {viewMode === "dispatcher" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <DispatcherTop5Chart rows={dispatcherTop5} />
          <DualLineMiniChart
            points={dispatcherSeries as unknown as MiniChartPoint[]}
            lines={[
              { key: "newDispatchCount", label: "派单", color: "#007aff" },
              {
                key: "signedContractAmount",
                label: "签约额",
                color: "#0d9488",
                scale: "amount",
              },
            ]}
            onMonthClick={onMonthClick}
            selectedYearMonth={selectedYearMonth}
          />
        </div>
      ) : null}

      {viewMode === "designer" ? (
        <DualLineMiniChart
          points={designerSeries as unknown as MiniChartPoint[]}
          lines={[
            {
              key: "orderedAmount",
              label: "下单额",
              color: "#2563eb",
              scale: "amount",
            },
            {
              key: "avgConversion",
              label: "转化率%",
              color: "#d97706",
              scale: "percent",
            },
          ]}
          onMonthClick={onMonthClick}
          selectedYearMonth={selectedYearMonth}
        />
      ) : null}

      {viewMode === "store" ? (
        <StoreBarMiniChart items={storeBars} />
      ) : null}

      {viewMode === "acceptance" ? (
        <DualLineMiniChart
          points={acceptanceSeries as unknown as MiniChartPoint[]}
          lines={[
            { key: "avgOverall", label: "均分", color: "#d97706", scale: "score" },
            {
              key: "electronicRate",
              label: "电子验收率",
              color: "#007aff",
              scale: "percent",
            },
          ]}
          onMonthClick={onMonthClick}
          selectedYearMonth={selectedYearMonth}
        />
      ) : null}
    </div>
  );
}

export function TabTrendPanel({
  title,
  sectionLabel,
  viewMode,
  dispatcherSeries,
  dispatcherTop5,
  designerSeries,
  storeBars,
  acceptanceSeries,
  onMonthClick,
  selectedYearMonth,
}: TabTrendPanelProps) {
  const chartHint =
    viewMode === "dispatcher"
      ? "贡献 Top5 + 派单/签约走势"
      : viewMode === "designer"
        ? "下单金额 + 转化率"
        : viewMode === "store"
          ? "各门店下单金额（当期）"
          : "均分 + 电子验收率";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 border-b border-slate-100 pb-2">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {sectionLabel ? (
            <span className="text-xs text-slate-400">{sectionLabel}</span>
          ) : null}
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500">{chartHint}</p>
      </div>
      <TabTrendChartBody
        viewMode={viewMode}
        dispatcherSeries={dispatcherSeries}
        dispatcherTop5={dispatcherTop5}
        designerSeries={designerSeries}
        storeBars={storeBars}
        acceptanceSeries={acceptanceSeries}
        onMonthClick={onMonthClick}
        selectedYearMonth={selectedYearMonth}
      />
    </section>
  );
}

function DispatcherTop5Chart({ rows }: { rows: DispatcherPerformanceRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">暂无贡献分数据</p>
    );
  }
  const max = Math.max(...rows.map((r) => r.contributionScore), 1);
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-500">贡献分 Top5</p>
      <p className="text-[10px] leading-relaxed text-slate-400">{DISPATCHER_TOP5_RULE}</p>
      {rows.map((r) => (
        <div key={r.key} className="flex items-center gap-2">
          <span className="w-16 truncate text-xs text-slate-700">{r.label}</span>
          <div className="h-2 flex-1 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-blue-500"
              style={{ width: `${(r.contributionScore / max) * 100}%` }}
            />
          </div>
          <span className="w-10 text-right text-xs tabular-nums text-slate-600">
            {r.contributionScore}
          </span>
        </div>
      ))}
    </div>
  );
}

function StoreBarMiniChart({ items }: { items: StoreBarItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">暂无门店下单数据</p>
    );
  }
  const max = Math.max(...items.map((i) => i.orderedAmount), 1);
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-2">
          <span className="w-20 truncate text-xs text-slate-700">{item.label}</span>
          <div className="h-2.5 flex-1 rounded-full bg-slate-100">
            <div
              className="h-2.5 rounded-full bg-teal-500"
              style={{ width: `${(item.orderedAmount / max) * 100}%` }}
            />
          </div>
          <span className="w-20 text-right text-xs tabular-nums text-slate-600">
            {formatDispatchMoney(item.orderedAmount)}
          </span>
        </div>
      ))}
    </div>
  );
}

type LineScale = "count" | "amount" | "percent" | "score";

type MiniChartPoint = {
  yearMonth: string;
  label: string;
  [key: string]: string | number | null | undefined;
};

function DualLineMiniChart({
  points,
  lines,
  onMonthClick,
  selectedYearMonth,
}: {
  points: MiniChartPoint[];
  lines: {
    key: string;
    label: string;
    color: string;
    scale?: LineScale;
  }[];
  onMonthClick?: (yearMonth: string) => void;
  selectedYearMonth?: string | null;
}) {
  const height = 160;
  const width = 480;
  const PAD = { top: 12, right: 8, bottom: 24, left: 32 };
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  const series = lines.map((line) => ({
    ...line,
    values: points.map((p) => {
      const v = p[line.key];
      return typeof v === "number" ? v : null;
    }),
  }));

  const leftSeries = series.filter((s) => s.scale !== "percent" && s.scale !== "score");
  const rightSeries = series.filter((s) => s.scale === "percent" || s.scale === "score");

  function scaleFor(vals: (number | null)[], fallbackMax = 1) {
    const flat = vals.filter((v): v is number => v != null);
    if (flat.length === 0) return { min: 0, max: fallbackMax };
    const min = Math.min(...flat);
    const max = Math.max(...flat);
    return min === max ? { min: 0, max: max || fallbackMax } : { min, max };
  }

  const leftScale = scaleFor(
    leftSeries.flatMap((s) => s.values),
    1,
  );
  const rightScale = scaleFor(
    rightSeries.flatMap((s) => s.values),
    rightSeries[0]?.scale === "score" ? 5 : 100,
  );

  function xAt(i: number): number {
    if (points.length <= 1) return PAD.left + innerW / 2;
    return PAD.left + (i / (points.length - 1)) * innerW;
  }

  function yAt(value: number, side: "left" | "right"): number {
    const sc = side === "right" && rightSeries.length ? rightScale : leftScale;
    const ratio = (value - sc.min) / (sc.max - sc.min);
    return PAD.top + innerH - ratio * innerH;
  }

  function pathFor(values: (number | null)[], side: "left" | "right"): string {
    const segments: string[] = [];
    values.forEach((v, i) => {
      if (v == null) return;
      segments.push(
        `${segments.length === 0 ? "M" : "L"}${xAt(i)},${yAt(v, side)}`,
      );
    });
    return segments.join(" ");
  }

  if (points.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">暂无趋势数据</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="mb-2 flex flex-wrap gap-3">
        {series.map((s) => (
          <span
            key={s.key}
            className="inline-flex items-center gap-1 text-xs text-slate-600"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {s.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[280px]">
        {points.map((p, i) => {
          const ym = p.yearMonth;
          const label = p.label;
          return (
            <g key={ym ?? i}>
              {onMonthClick && ym ? (
                <rect
                  x={xAt(i) - innerW / Math.max(points.length, 1) / 2}
                  y={PAD.top}
                  width={innerW / Math.max(points.length, 1)}
                  height={innerH}
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={() => onMonthClick(ym)}
                />
              ) : null}
              <text
                x={xAt(i)}
                y={height - 4}
                textAnchor="middle"
                className={`text-[9px] ${
                  selectedYearMonth === ym
                    ? "fill-rose-600 font-semibold"
                    : "fill-slate-400"
                }`}
              >
                {label}
              </text>
            </g>
          );
        })}
        {series.map((s) => {
          const side =
            s.scale === "percent" || s.scale === "score" ? "right" : "left";
          return (
            <path
              key={s.key}
              d={pathFor(s.values, side)}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
            />
          );
        })}
      </svg>
    </div>
  );
}
