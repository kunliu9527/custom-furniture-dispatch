import { FLOW_ORDER_STATUSES } from "./constants";
import { getStatusEnteredAt } from "./stage-intervals";
import { isRefundStatus } from "./order-utils";
import type { FlowOrderStatus, Order, OrderStatus } from "./types";

export const GANTT_DAY_MS = 86_400_000;

/** 甘特条形实心色：与 status-badge 同色系（灰/琥珀/天蓝/蓝/橙/翠绿/石板/青/玫红/红） */
export const STATUS_BAR_FILL: Record<OrderStatus, string> = {
  未派单: "bg-zinc-400",
  待量尺: "bg-amber-400",
  已量尺: "bg-sky-400",
  已出图: "bg-blue-400",
  待签约: "bg-orange-400",
  已签约: "bg-emerald-400",
  已下单: "bg-orange-500",
  已安装: "bg-slate-400",
  已验收: "bg-teal-400",
  待退单: "bg-rose-400",
  已退单: "bg-red-400",
};

/** 图例顺序：主流程 + 退单 */
export const GANTT_STAGE_ORDER: OrderStatus[] = [
  ...FLOW_ORDER_STATUSES,
  "待退单",
  "已退单",
];

/** 单笔订单的某阶段时间条 */
export interface OrderStageSegment {
  status: OrderStatus;
  startMs: number;
  endMs: number;
  /** 是否为订单当前所在阶段（在途/退单进行中） */
  isCurrent: boolean;
}

function isoToMs(iso: string | undefined | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : null;
}

/** 退单等阶段的时间锚点：优先 orderEvents（kind/toStatus），其次 workflowRemarks 对应阶段 */
function findStageTime(order: Order, stage: OrderStatus): number | null {
  for (const event of order.orderEvents ?? []) {
    if (event.kind === stage || event.toStatus === stage) {
      const t = isoToMs(event.at);
      if (t != null) return t;
    }
  }
  for (const remark of order.workflowRemarks ?? []) {
    if (remark.stage === stage) {
      const t = isoToMs(remark.at);
      if (t != null) return t;
    }
  }
  return null;
}

/**
 * 将一笔订单重构为阶段时间条序列。
 * - 主流程：以 statusEnteredAt（未派单/待量尺回退 createdAt）为各阶段起点；
 *   阶段结束 = 下一阶段进入时间，缺失时用 签约/安装/验收 时间兜底；
 *   当前在途阶段延伸到「现在」（退单订单则到退单起点）。
 * - 退单：待退单/已退单 起止取事件或备注时间，否则回退 createdAt。
 * - 旧数据（无 statusEnteredAt）：单段中性条（当前状态色），起点 createdAt、终点 now。
 */
export function buildOrderStageSegments(
  order: Order,
  nowMs: number,
): OrderStageSegment[] {
  const createdAtMs = isoToMs(order.createdAt) ?? nowMs;
  const hasEnteredTimes = Boolean(
    order.statusEnteredAt && Object.keys(order.statusEnteredAt).length > 0,
  );

  if (!hasEnteredTimes) {
    return [
      {
        status: order.status,
        startMs: createdAtMs,
        endMs: nowMs,
        isCurrent: true,
      },
    ];
  }

  const isInRefund = isRefundStatus(order.status);
  const refundStart = isInRefund
    ? findStageTime(order, "待退单") ?? createdAtMs
    : null;
  const refundEnd = findStageTime(order, "已退单");

  const starts: { status: FlowOrderStatus; at: number }[] = [];
  for (const status of FLOW_ORDER_STATUSES) {
    const t = isoToMs(getStatusEnteredAt(order, status));
    if (t != null) starts.push({ status, at: t });
  }
  starts.sort((a, b) => a.at - b.at);

  const segments: OrderStageSegment[] = [];
  for (let i = 0; i < starts.length; i++) {
    const { status, at } = starts[i];
    let end: number | null = starts[i + 1]?.at ?? null;
    if (end == null) {
      // 阶段结束兜底：签约/安装/验收时间
      if (status === "待签约") {
        end =
          isoToMs(order.contract?.signedAt) ??
          isoToMs(order.contract?.initiatedAt);
      } else if (status === "已下单") {
        end = isoToMs(order.installation?.installedAt);
      } else if (status === "已安装") {
        end = isoToMs(order.acceptance?.acceptedAt);
      }
    }
    if (end == null) {
      if (isInRefund) {
        end = refundStart;
      } else if (status === order.status) {
        end = nowMs;
      }
    }
    if (end == null || end < at) continue;
    segments.push({
      status,
      startMs: at,
      endMs: end,
      isCurrent: status === order.status,
    });
  }

  if (isInRefund && refundStart != null) {
    segments.push({
      status: order.status,
      startMs: refundStart,
      endMs: refundEnd ?? nowMs,
      isCurrent: true,
    });
  }

  return segments;
}

/** 该单的时间条是否与 [windowStartMs, nowMs] 有交集（时间范围过滤用） */
export function segmentsOverlapWindow(
  segments: OrderStageSegment[],
  windowStartMs: number,
  nowMs: number,
): boolean {
  return segments.some(
    (seg) => seg.endMs >= windowStartMs && seg.startMs <= nowMs,
  );
}

/** 阶段条悬停提示：阶段 · 起止日期 · 耗时 */
export function formatSegmentTooltip(
  segment: OrderStageSegment,
  nowMs: number,
  formatDay: (iso: string) => string,
  formatDurationDays: (days: number) => string,
): string {
  const isOpen = segment.endMs >= nowMs - GANTT_DAY_MS;
  const endText = isOpen ? "至今" : formatDay(new Date(segment.endMs).toISOString());
  const durationDays = Math.max(0, (segment.endMs - segment.startMs) / GANTT_DAY_MS);
  const currentMark = segment.isCurrent ? "（当前）" : "";
  return `${segment.status}${currentMark}\n${formatDay(
    new Date(segment.startMs).toISOString(),
  )} → ${endText}\n耗时 ${formatDurationDays(durationDays)}`;
}
