import { PRE_MEASURE_DEPOSIT_THRESHOLD } from "./deposit-rules";
import type { Order } from "./types";

/** 前置交定：设计师 +400；派单人 +min(deposit×0.25, 2000) */
export function computePreMeasureDepositBonus(order: Order): {
  designer: number;
  dispatcher: number;
} {
  if (!order.preMeasureDeposit || order.deposit < PRE_MEASURE_DEPOSIT_THRESHOLD) {
    return { designer: 0, dispatcher: 0 };
  }
  return {
    designer: 400,
    dispatcher: Math.min(Math.round(order.deposit * 0.25), 2000),
  };
}

export function sumPreMeasureDepositBonus(
  orders: Order[],
  role: "designer" | "dispatcher",
): number {
  return orders.reduce(
    (sum, o) => sum + computePreMeasureDepositBonus(o)[role],
    0,
  );
}
