import type { FlowOrderStatus, Order } from "./types";

/** 前置交定：从 0 补交达到此金额（元）即打标 */
export const PRE_MEASURE_DEPOSIT_THRESHOLD = 1000;

/** 待量尺 → 待签约 可修改定金 */
export const DEPOSIT_EDITABLE_STATUSES: FlowOrderStatus[] = [
  "待量尺",
  "已量尺",
  "已出图",
  "待签约",
];

export function canEditOrderDeposit(order: Order): boolean {
  return DEPOSIT_EDITABLE_STATUSES.includes(order.status as FlowOrderStatus);
}

export function normalizeDepositAmount(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value);
}

export function applyDepositUpdate(order: Order, rawAmount: number): Order {
  const deposit = normalizeDepositAmount(rawAmount);
  const at = new Date().toISOString();
  const wasZero = order.deposit <= 0;
  const qualifiesPreMeasure =
    wasZero &&
    deposit >= PRE_MEASURE_DEPOSIT_THRESHOLD &&
    canEditOrderDeposit(order);

  return {
    ...order,
    deposit,
    depositUpdatedAt: at,
    preMeasureDeposit: Boolean(order.preMeasureDeposit || qualifiesPreMeasure),
  };
}

export function resolveContractDepositPaid(order: Order): number {
  const snap = order.contract?.depositPaid;
  if (snap != null && Number.isFinite(snap) && snap >= 0) return snap;
  return Math.max(0, order.deposit);
}
