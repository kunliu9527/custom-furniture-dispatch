import type { OrderStatus } from "./types";

/** 第一部分 · 流程表：当前停留该状态的订单（列名 = 状态 + 流程） */
export function flowStatusColumnLabel(status: OrderStatus): string {
  return `${status}流程`;
}

export const FLOW_TABLE_FOOTNOTE =
  "流程列 = 当前停留该状态的笔数/金额 · 与归总「××量」口径不同";

/** 第二部分 · 归总/统计桶 */
export const AGGREGATE_LABEL = {
  notOrdered: "未下单量",
  ordered: "已下单量",
  pendingRefund: "待退单量",
  confirmedRefund: "已退单量",
  refundTotal: "退单量",
  total: "合计",
} as const;

export const AGGREGATE_TABLE_FOOTNOTE =
  "归总列 = 业绩桶笔数/金额 · 未下单量=原始未下单（未到已下单） · 退单量=待退单量+已退单量";

export const AGGREGATE_RANK_FOOTNOTE =
  "排名按归总「××量」计算 · 退单不参与排名";

/** 汇总条 / 简报 KPI 用短标签 */
export const AGGREGATE_KPI_LABEL = {
  notOrdered: "未下单量",
  ordered: "已下单量",
  pendingRefund: "待退单量",
  confirmedRefund: "已退单量",
  refundTotal: "退单量",
  effectiveDispatch: "有效总派单",
} as const;

/** 流程简报（在途等）用流程后缀 */
export const FLOW_PIPELINE_LABEL = {
  ordered: "已下单流程",
  installed: "已安装流程",
  accepted: "已验收流程",
  pendingRefund: "待退单流程",
} as const;

export function aggregateRefundTotal(
  pending: { count: number; amount: number },
  confirmed: { count: number; amount: number },
): { count: number; amount: number } {
  return {
    count: pending.count + confirmed.count,
    amount: pending.amount + confirmed.amount,
  };
}
