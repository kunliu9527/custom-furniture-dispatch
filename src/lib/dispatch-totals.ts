import { isRefundStatus } from "./order-utils";
import { sumSupplementAmount } from "./supplement-utils";
import type { Order, SupplementOrder } from "./types";

export interface DispatchAmountTotals {
  /** 主单已填下单金额 + 增补单金额（非退单） */
  orderedAmount: number;
  /** 未达已下单的主单预算金额（非退单） */
  notOrderedAmount: number;
  /** 退单订单对应金额（待退单、已退单） */
  refundAmount: number;
  /** 合计总派单 = 已下单 + 未下单 - 退单 */
  totalDispatch: number;
}

function getMainOrderAmountValue(order: Order): number {
  return order.orderAmount != null && order.orderAmount > 0
    ? order.orderAmount
    : 0;
}

function isMainOrderPlaced(order: Order): boolean {
  return order.status === "已下单" || order.status === "已安装" || order.status === "已验收";
}

/** 主单是否计入「已下单金额」（已下单/已安装，或已填写下单金额） */
function countsAsOrderedMain(order: Order): boolean {
  return isMainOrderPlaced(order) || getMainOrderAmountValue(order) > 0;
}

/** 单笔订单对合计总派单的拆分（非退单计入已下单/未下单；退单计入退单金额） */
export function getOrderDispatchParts(
  order: Order,
  supplements: SupplementOrder[],
): {
  ordered: number;
  notOrdered: number;
  refund: number;
} {
  const supplementTotal = sumSupplementAmount(supplements, order.id);

  if (isRefundStatus(order.status)) {
    const mainPart = countsAsOrderedMain(order)
      ? getMainOrderAmountValue(order)
      : order.budget > 0
        ? order.budget
        : 0;
    return {
      ordered: 0,
      notOrdered: 0,
      refund: mainPart + supplementTotal,
    };
  }

  if (countsAsOrderedMain(order)) {
    return {
      ordered: getMainOrderAmountValue(order) + supplementTotal,
      notOrdered: 0,
      refund: 0,
    };
  }

  return {
    ordered: supplementTotal,
    notOrdered: order.budget > 0 ? order.budget : 0,
    refund: 0,
  };
}

/** 单笔订单合计总派单（列表行展示用） */
export function getOrderTotalDispatch(
  order: Order,
  supplements: SupplementOrder[],
): number {
  const { ordered, notOrdered, refund } = getOrderDispatchParts(
    order,
    supplements,
  );
  if (refund > 0) return 0;
  return ordered + notOrdered;
}

export function sumDispatchTotals(
  orders: Order[],
  supplements: SupplementOrder[],
): DispatchAmountTotals {
  const totals = orders.reduce(
    (acc, order) => {
      const parts = getOrderDispatchParts(order, supplements);
      acc.orderedAmount += parts.ordered;
      acc.notOrderedAmount += parts.notOrdered;
      acc.refundAmount += parts.refund;
      return acc;
    },
    {
      orderedAmount: 0,
      notOrderedAmount: 0,
      refundAmount: 0,
      totalDispatch: 0,
    },
  );

  totals.totalDispatch =
    totals.orderedAmount +
    totals.notOrderedAmount -
    totals.refundAmount;

  return totals;
}

export function formatDispatchMoney(amount: number): string {
  return `¥${amount.toLocaleString("zh-CN")}`;
}
