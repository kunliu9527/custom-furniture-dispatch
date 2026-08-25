"use client";

import { StatusBadge } from "@/components/orders/status-badge";
import { useMemo, useState } from "react";
import { getDispatchStoreOptions } from "@/lib/stores";
import {
  buildOrderStageSegments,
  formatSegmentTooltip,
  GANTT_DAY_MS,
  GANTT_STAGE_ORDER,
  segmentsOverlapWindow,
  STATUS_BAR_FILL,
  type OrderStageSegment,
} from "@/lib/gantt-utils";
import { formatIntervalDays } from "@/lib/stage-intervals";
import { formatOrderDateDay } from "@/lib/order-utils";
import { isRefundStatus } from "@/lib/order-utils";
import type { Order, OrderStatus, StoreName } from "@/lib/types";

const PX_PER_DAY = 20;
const LABEL_WIDTH = 176;
const ROW_HEIGHT = 40;
const AXIS_HEIGHT = 26;

const RANGE_OPTIONS = [
  { value: 30, label: "30天" },
  { value: 60, label: "60天" },
  { value: 90, label: "90天" },
  { value: 180, label: "180天" },
] as const;

type StatusGroup = "all" | "progress" | "done" | "refund";

const STATUS_GROUP_OPTIONS: { value: StatusGroup; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "progress", label: "进行中" },
  { value: "done", label: "已验收" },
  { value: "refund", label: "退单" },
];

function matchStatusGroup(status: OrderStatus, group: StatusGroup): boolean {
  if (group === "all") return true;
  if (group === "done") return status === "已验收";
  if (group === "refund") return isRefundStatus(status);
  return status !== "已验收" && !isRefundStatus(status);
}

interface GanttRow {
  order: Order;
  segments: OrderStageSegment[];
}

interface ManagerGanttPanelProps {
  orders: Order[];
  onOpenOrder: (order: Order) => void;
}

/** 流程甘特图：每行一笔订单，横向时间轴分段色块展示各阶段进度 */
export function ManagerGanttPanel({
  orders,
  onOpenOrder,
}: ManagerGanttPanelProps) {
  const nowMs = useMemo(() => Date.now(), []);
  const [rangeDays, setRangeDays] = useState<number>(90);
  const [statusGroup, setStatusGroup] = useState<StatusGroup>("all");
  const [storeFilter, setStoreFilter] = useState<StoreName | "全部">("全部");

  const storeOptions = useMemo(() => getDispatchStoreOptions(), []);
  const windowStartMs = nowMs - rangeDays * GANTT_DAY_MS;
  const contentWidth = rangeDays * PX_PER_DAY;

  const rows = useMemo<GanttRow[]>(() => {
    return orders
      .map((order) => ({
        order,
        segments: buildOrderStageSegments(order, nowMs),
      }))
      .filter((row) => {
        if (
          storeFilter !== "全部" &&
          row.order.dispatchStore !== storeFilter
        ) {
          return false;
        }
        if (!matchStatusGroup(row.order.status, statusGroup)) return false;
        return segmentsOverlapWindow(row.segments, windowStartMs, nowMs);
      })
      .sort((a, b) => {
        // 最近派单在前；其次当前阶段开始晚的在前
        const aEnd = a.segments[a.segments.length - 1]?.endMs ?? 0;
        const bEnd = b.segments[b.segments.length - 1]?.endMs ?? 0;
        if (bEnd !== aEnd) return bEnd - aEnd;
        return b.order.createdAt.localeCompare(a.order.createdAt);
      });
  }, [orders, nowMs, storeFilter, statusGroup, windowStartMs]);

  const xAt = (ms: number) =>
    Math.max(0, ((ms - windowStartMs) / GANTT_DAY_MS) * PX_PER_DAY);
  const widthAt = (fromMs: number, toMs: number) =>
    Math.max(2, ((toMs - fromMs) / GANTT_DAY_MS) * PX_PER_DAY);

  const axisTicks = useMemo(() => {
    const ticks: { x: number; label: string }[] = [];
    for (let day = 0; day <= rangeDays; day += 7) {
      const ms = windowStartMs + day * GANTT_DAY_MS;
      ticks.push({
        x: day * PX_PER_DAY,
        label: formatOrderDateDay(new Date(ms).toISOString()),
      });
    }
    return ticks;
  }, [rangeDays, windowStartMs]);

  return (
    <section className="vi-surface overflow-hidden" aria-labelledby="manager-gantt-title">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[var(--separator)] px-4 py-3">
        <div className="min-w-0">
          <h2
            id="manager-gantt-title"
            className="text-[17px] font-semibold"
            style={{ color: "var(--label-primary)" }}
          >
            流程甘特图
          </h2>
          <p
            className="mt-0.5 text-[13px]"
            style={{ color: "var(--label-secondary)" }}
          >
            每行一笔订单 · 点击行查看详情 · 色块 = 各阶段时长
          </p>
        </div>
        <p
          className="text-sm tabular-nums"
          style={{ color: "var(--label-secondary)" }}
        >
          共 <span className="font-semibold">{rows.length}</span> 单
        </p>
      </div>

      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[var(--separator)] px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="vi-label-caps">范围</span>
          <div className="vi-segmented">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRangeDays(opt.value)}
                className={`vi-segmented-item px-3 py-1.5 text-xs ${
                  rangeDays === opt.value ? "vi-segmented-item-active" : ""
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="vi-label-caps">状态</span>
          <div className="vi-segmented">
            {STATUS_GROUP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusGroup(opt.value)}
                className={`vi-segmented-item px-3 py-1.5 text-xs ${
                  statusGroup === opt.value ? "vi-segmented-item-active" : ""
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="vi-label-caps">门店</span>
          <select
            className="vi-field h-8 w-auto max-w-[10rem] px-2 text-xs"
            value={storeFilter}
            onChange={(e) =>
              setStoreFilter(e.target.value as StoreName | "全部")
            }
            aria-label="门店筛选"
          >
            <option value="全部">全部</option>
            {storeOptions.map((store) => (
              <option key={store} value={store}>
                {store}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 图表 */}
      {rows.length === 0 ? (
        <div className="vi-empty-state m-4">
          <p className="text-sm" style={{ color: "var(--label-secondary)" }}>
            当前筛选下暂无订单
          </p>
          <p className="mt-1 text-[13px]" style={{ color: "var(--label-tertiary)" }}>
            可放宽时间范围、状态分组或门店筛选
          </p>
        </div>
      ) : (
        <div className="max-h-[65vh] overflow-auto">
          <div
            className="relative"
            style={{ width: LABEL_WIDTH + contentWidth, minWidth: "100%" }}
          >
            {/* 日期轴 */}
            <div className="flex border-b border-[var(--separator)]">
              <div
                className="sticky left-0 z-[2] shrink-0 border-r border-[var(--separator)] bg-[var(--bg-grouped-secondary)]"
                style={{ width: LABEL_WIDTH, height: AXIS_HEIGHT }}
              />
              <div className="relative shrink-0" style={{ width: contentWidth, height: AXIS_HEIGHT }}>
                {axisTicks.map((tick) => (
                  <span
                    key={tick.x}
                    className="absolute top-0 bottom-0 w-px bg-[var(--separator)]"
                    style={{ left: tick.x }}
                  >
                    <span
                      className="absolute top-0.5 left-1.5 whitespace-nowrap text-[10px]"
                      style={{ color: "var(--label-tertiary)" }}
                    >
                      {tick.label}
                    </span>
                  </span>
                ))}
                {/* 今天 */}
                <span
                  className="absolute top-0 bottom-0 w-px"
                  style={{
                    left: xAt(nowMs),
                    background: "var(--system-red)",
                  }}
                >
                  <span
                    className="absolute top-0.5 left-1 text-[10px] font-semibold"
                    style={{ color: "var(--system-red)" }}
                  >
                    今天
                  </span>
                </span>
              </div>
            </div>

            {/* 订单行 */}
            {rows.map((row) => (
              <div
                key={row.order.id}
                className="flex border-b border-[var(--separator)]"
              >
                <button
                  type="button"
                  onClick={() => onOpenOrder(row.order)}
                  className="sticky left-0 z-[1] flex shrink-0 cursor-pointer items-center gap-2 border-r border-[var(--separator)] bg-[var(--bg-primary)] px-3 text-left transition-colors duration-[var(--duration-fast)] hover:bg-[var(--fill-quaternary)]"
                  style={{ width: LABEL_WIDTH, height: ROW_HEIGHT }}
                  title={row.order.address}
                >
                  <span
                    className="min-w-0 flex-1 truncate text-[13px] font-medium"
                    style={{ color: "var(--label-primary)" }}
                  >
                    {row.order.customerName}
                  </span>
                  <span className="shrink-0">
                    <StatusBadge status={row.order.status} />
                  </span>
                </button>
                <div
                  className="relative shrink-0"
                  style={{ width: contentWidth, height: ROW_HEIGHT }}
                >
                  {row.segments.map((seg, index) => {
                    const left = xAt(seg.startMs);
                    const width = widthAt(seg.startMs, seg.endMs);
                    const isOpen =
                      seg.endMs >= nowMs - GANTT_DAY_MS;
                    return (
                      <span
                        key={`${seg.status}-${index}`}
                        className={`absolute top-1/2 -translate-y-1/2 rounded-[3px] ${STATUS_BAR_FILL[seg.status]} ${
                          seg.isCurrent
                            ? "ring-1 ring-inset ring-black/25"
                            : "opacity-90"
                        }`}
                        style={{
                          left,
                          width,
                          height: seg.isCurrent ? 18 : 15,
                        }}
                        title={formatSegmentTooltip(
                          seg,
                          nowMs,
                          formatOrderDateDay,
                          formatIntervalDays,
                        )}
                      >
                        {isOpen && seg.isCurrent ? (
                          <span className="sr-only">当前阶段进行中</span>
                        ) : null}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 图例 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--separator)] px-4 py-2.5">
        {GANTT_STAGE_ORDER.map((status) => (
          <span
            key={status}
            className="flex items-center gap-1.5 text-[11px]"
            style={{ color: "var(--label-secondary)" }}
          >
            <span
              className={`size-2 rounded-full ${STATUS_BAR_FILL[status]}`}
              aria-hidden
            />
            {status}
          </span>
        ))}
        <span
          className="ml-auto flex items-center gap-1.5 text-[11px]"
          style={{ color: "var(--label-tertiary)" }}
        >
          <span className="size-2 rounded-full ring-1 ring-inset ring-black/25" aria-hidden />
          当前阶段
        </span>
      </div>
    </section>
  );
}
