import type { FlowOrderStatus, Order, StageIntervalDays } from "./types";

export type { StageIntervalDays };

export type StageTimeoutAlert = "量尺超时" | "出图超时" | "下单超时";

const MEASURE_TIMEOUT_DAYS = 3;
const DRAWING_TIMEOUT_DAYS = 9;
const DRAWING_TIMEOUT_BUDGET_THRESHOLD = 200_000;
const DRAWING_TIMEOUT_BUDGET_DAYS = 15;
const ORDER_TIMEOUT_DAYS = 3;

/** 原始间隔天数（未取整） */
export function rawIntervalDays(fromIso: string, toIso: string): number {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return ms / (1000 * 60 * 60 * 24);
}

/**
 * 间隔天数取整：不足 0.5 天记 0，不足 1 天记 0.5，以此类推（步长 0.5）。
 * @param minDays 本段记录下限（待量尺→已量尺最小为 1 天）
 */
export function roundIntervalDays(rawDays: number, minDays = 0): number {
  if (rawDays < 0.5) return Math.max(0, minDays);
  const rounded = Math.floor(rawDays / 0.5) * 0.5;
  return Math.max(rounded, minDays);
}

export function formatIntervalDays(days: number): string {
  return Number.isInteger(days) ? `${days} 天` : `${days} 天`;
}

/** 进入某主流程状态的时间（ISO） */
export function getStatusEnteredAt(
  order: Order,
  status: FlowOrderStatus,
): string | undefined {
  const at = order.statusEnteredAt?.[status];
  if (at) return at;
  if (status === "待量尺") return order.createdAt;
  return undefined;
}

/** 当前环节是否应显示超时提示（未推进到下一状态时） */
export function getStageTimeoutAlert(order: Order, now = new Date()): StageTimeoutAlert | null {
  if (order.status === "待退单" || order.status === "已退单") return null;

  const nowIso = now.toISOString();

  if (order.status === "待量尺") {
    const from = getStatusEnteredAt(order, "待量尺");
    if (!from) return null;
    if (rawIntervalDays(from, nowIso) > MEASURE_TIMEOUT_DAYS) return "量尺超时";
    return null;
  }

  if (order.status === "已量尺") {
    const from = getStatusEnteredAt(order, "已量尺");
    if (!from) return null;
    const limit =
      order.budget > DRAWING_TIMEOUT_BUDGET_THRESHOLD
        ? DRAWING_TIMEOUT_BUDGET_DAYS
        : DRAWING_TIMEOUT_DAYS;
    if (rawIntervalDays(from, nowIso) > limit) return "出图超时";
    return null;
  }

  if (order.status === "已签约") {
    const from = getStatusEnteredAt(order, "已签约");
    if (!from) return null;
    if (rawIntervalDays(from, nowIso) > ORDER_TIMEOUT_DAYS) return "下单超时";
    return null;
  }

  return null;
}

const ADVANCE_INTERVAL_KEY: Partial<
  Record<FlowOrderStatus, keyof StageIntervalDays>
> = {
  已量尺: "toMeasured",
  已出图: "toDrawn",
  已签约: "toSigned",
  已下单: "toOrdered",
};

const ADVANCE_INTERVAL_MIN: Partial<Record<FlowOrderStatus, number>> = {
  已量尺: 1,
};

/** 推进状态时写入本段间隔与进入时间 */
export function applyStageIntervalOnAdvance(
  order: Order,
  nextStatus: FlowOrderStatus,
  atIso: string,
): Pick<Order, "statusEnteredAt" | "stageIntervalDays" | "totalElapsedDays"> {
  const prevStatus = order.status as FlowOrderStatus;
  const intervalKey = ADVANCE_INTERVAL_KEY[nextStatus];
  const enteredAt = getStatusEnteredAt(order, prevStatus);

  const statusEnteredAt: Partial<Record<FlowOrderStatus, string>> = {
    ...order.statusEnteredAt,
    [nextStatus]: atIso,
  };

  let stageIntervalDays = { ...order.stageIntervalDays };

  if (intervalKey && enteredAt) {
    const raw = rawIntervalDays(enteredAt, atIso);
    const min = ADVANCE_INTERVAL_MIN[nextStatus] ?? 0;
    stageIntervalDays = {
      ...stageIntervalDays,
      [intervalKey]: roundIntervalDays(raw, min),
    };
  }

  let totalElapsedDays: number | null | undefined = order.totalElapsedDays;
  if (nextStatus === "已下单" && hasCompleteStageIntervals(stageIntervalDays)) {
    totalElapsedDays = sumStageIntervals(stageIntervalDays);
  }

  return { statusEnteredAt, stageIntervalDays, totalElapsedDays };
}

export function sumStageIntervals(intervals: StageIntervalDays): number {
  return (
    (intervals.toMeasured ?? 0) +
    (intervals.toDrawn ?? 0) +
    (intervals.toSigned ?? 0) +
    (intervals.toOrdered ?? 0)
  );
}

export function hasCompleteStageIntervals(
  intervals: StageIntervalDays | undefined,
): intervals is Required<StageIntervalDays> {
  if (!intervals) return false;
  return (
    intervals.toMeasured != null &&
    intervals.toDrawn != null &&
    intervals.toSigned != null &&
    intervals.toOrdered != null
  );
}

/** 已下单订单的累计耗时展示；无记录时为空 */
export function formatTotalElapsedDisplay(order: Order): string | null {
  if (order.status !== "已下单" && order.status !== "已安装") return null;
  if (order.totalElapsedDays == null) return null;
  return formatIntervalDays(order.totalElapsedDays);
}

const REVERT_CLEAR_INTERVAL: Partial<
  Record<FlowOrderStatus, keyof StageIntervalDays>
> = {
  已量尺: "toMeasured",
  已出图: "toDrawn",
  已签约: "toSigned",
  已下单: "toOrdered",
};

const FLOW_STATUSES_FOR_ENTERED: FlowOrderStatus[] = [
  "待量尺",
  "已量尺",
  "已出图",
  "已签约",
  "已下单",
  "已安装",
];

/** 撤回时清除当前及之后环节的进入时间与间隔记录 */
export function applyStageIntervalOnRevert(
  order: Order,
  revertedFromStatus: FlowOrderStatus,
): Pick<Order, "statusEnteredAt" | "stageIntervalDays" | "totalElapsedDays"> {
  const statusEnteredAt = { ...order.statusEnteredAt };
  const fromIndex = FLOW_STATUSES_FOR_ENTERED.indexOf(revertedFromStatus);
  for (let i = fromIndex; i < FLOW_STATUSES_FOR_ENTERED.length; i++) {
    delete statusEnteredAt[FLOW_STATUSES_FOR_ENTERED[i]];
  }

  const stageIntervalDays = { ...order.stageIntervalDays };
  const clearKey = REVERT_CLEAR_INTERVAL[revertedFromStatus];
  if (clearKey) delete stageIntervalDays[clearKey];

  let totalElapsedDays: number | null | undefined = order.totalElapsedDays;
  if (revertedFromStatus === "已下单") {
    totalElapsedDays = null;
  }

  return { statusEnteredAt, stageIntervalDays, totalElapsedDays };
}

export function normalizeStageIntervalDays(
  raw: unknown,
): StageIntervalDays | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const pick = (key: keyof StageIntervalDays) => {
    const v = o[key];
    return typeof v === "number" && Number.isFinite(v) ? v : undefined;
  };
  const result: StageIntervalDays = {
    toMeasured: pick("toMeasured"),
    toDrawn: pick("toDrawn"),
    toSigned: pick("toSigned"),
    toOrdered: pick("toOrdered"),
  };
  if (
    result.toMeasured == null &&
    result.toDrawn == null &&
    result.toSigned == null &&
    result.toOrdered == null
  ) {
    return undefined;
  }
  return result;
}

export function normalizeStatusEnteredAt(
  raw: unknown,
): Partial<Record<FlowOrderStatus, string>> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const result: Partial<Record<FlowOrderStatus, string>> = {};
  for (const status of FLOW_STATUSES_FOR_ENTERED) {
    const v = o[status];
    if (typeof v === "string" && v) result[status] = v;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}
