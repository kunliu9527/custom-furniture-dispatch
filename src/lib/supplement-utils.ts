import { getOrderTotalDispatch } from "./dispatch-totals";
import type { Order, SupplementOrder } from "./types";

export function getSupplementsForOrder(
  supplements: SupplementOrder[],
  orderId: string,
): SupplementOrder[] {
  return supplements.filter((s) => s.parentOrderId === orderId);
}

export function sumSupplementAmount(
  supplements: SupplementOrder[],
  orderId: string,
): number {
  return getSupplementsForOrder(supplements, orderId).reduce(
    (sum, s) => sum + s.supplementAmount,
    0,
  );
}

export function getMainOrderAmount(order: Order): number {
  return order.orderAmount != null && order.orderAmount > 0
    ? order.orderAmount
    : 0;
}

/** 单笔有效总派单（已下单 + 未下单预算 − 退单） */
export function getCombinedOrderAmount(
  order: Order,
  supplements: SupplementOrder[],
): number {
  return getOrderTotalDispatch(order, supplements);
}

export function normalizeSupplements(value: unknown): SupplementOrder[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const raw = item as Record<string, unknown>;
      return {
        id: String(raw.id ?? ""),
        parentOrderId: String(raw.parentOrderId ?? ""),
        customerName: String(raw.customerName ?? ""),
        designer: raw.designer as SupplementOrder["designer"],
        supplementAmount: Number(raw.supplementAmount) || 0,
        status: "已下单" as const,
        createdAt: String(raw.createdAt ?? new Date().toISOString()),
      };
    })
    .filter((s) => s.id && s.parentOrderId && s.supplementAmount > 0);
}
