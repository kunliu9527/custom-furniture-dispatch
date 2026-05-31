/** 订单状态变更成功态展示时长（毫秒） */
export const ORDER_STATUS_SUCCESS_MS = 1800;

/** @deprecated 使用 ORDER_STATUS_SUCCESS_MS */
export const ORDER_ADVANCE_SUCCESS_MS = ORDER_STATUS_SUCCESS_MS;

export const ORDER_STATUS_SUCCESS_CARD_CLASS = "vi-order-card-success";

/** @deprecated 使用 ORDER_STATUS_SUCCESS_CARD_CLASS */
export const ORDER_ADVANCE_SUCCESS_CARD_CLASS = ORDER_STATUS_SUCCESS_CARD_CLASS;

export const ORDER_STATUS_SUCCESS_BANNER_CLASS = "vi-order-success-banner";

export function formatStatusUpdatedLabel(status: string): string {
  return `已更新为「${status}」`;
}

export function formatStatusRevertedLabel(status: string): string {
  return `已撤回至「${status}」`;
}

import type { Order } from "./types";

export interface OrderStatusTransitionPayload {
  orderId: string;
  resultLabel: string;
  /** 变更前订单快照，用于卡片移出列表时的占位展示 */
  orderSnapshot: Order;
}

/** 从「已更新为「已下单」」等文案解析目标状态 */
export function parseStatusFromFeedbackLabel(label: string): string | null {
  const match = label.match(/「([^」]+)」/);
  return match?.[1] ?? null;
}
