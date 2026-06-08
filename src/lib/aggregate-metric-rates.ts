/**
 * 看板归总衍生指标（转化率、均单额）。
 *
 * 周期与登录者权限：由调用方在传入 orders 前完成
 * `filterOrdersByPeriod` + `scopeOrdersForEvaluationView` 等过滤，本模块只做纯计算。
 */

/** 与看板「合计」列一致：四业绩桶金额之和 */
export function computeAggregateTotalAmount(input: {
  notOrderedAmount: number;
  orderedAmount: number;
  pendingRefundAmount: number;
  confirmedRefundAmount: number;
}): number {
  return (
    input.notOrderedAmount +
    input.orderedAmount +
    input.pendingRefundAmount +
    input.confirmedRefundAmount
  );
}

/**
 * 真实下单转化率（金额）= 已下单金额 ÷ 合计金额 × 100
 * 结果恒在 0~100；无合计时 null；有合计无下单时 0
 */
export function computeOrderAmountConversionRate(
  orderedAmount: number,
  totalAmount: number,
): number | null {
  if (totalAmount <= 0) return null;
  if (orderedAmount <= 0) return 0;
  return (orderedAmount / totalAmount) * 100;
}

/** 平均下单额 = 已下单金额 ÷ 已下单笔数；无已下单笔数时 null */
export function computeAverageOrderAmount(
  orderedAmount: number,
  orderedCount: number,
): number | null {
  if (orderedCount <= 0 || orderedAmount <= 0) return null;
  return orderedAmount / orderedCount;
}
