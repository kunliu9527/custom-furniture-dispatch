import { countLowDimensionReviewsInPeriod, countLowDimensionReviews } from "./acceptance-rating";
import { getAcceptanceEvaluationSummary } from "./acceptance-evaluation-stats";
import { formatDispatchMoney } from "./dispatch-totals";
import {
  computeStorePortfolioMetrics,
  formatCountAmountStat,
  type StorePortfolioMetrics,
} from "./store-summary-metrics";
import { classifyDispatcherOrder } from "./evaluation-stats";
import {
  formatLeaderboardsText,
  formatDesignerSummaryText,
  buildMonthlyLeaderboards,
  type MonthlyLeaderboards,
} from "./report-digest-extensions";
import { getDesignerPerformanceRows } from "./designer-performance";
import {
  buildMonthlyDigest,
  formatMonthlyDigestText,
  type MonthlyDigest,
} from "./monthly-report";
import {
  filterOrdersByPeriod,
  filterSupplementsByPeriod,
  getPeriodBounds,
  getPreviousPeriod,
  type PeriodSelection,
} from "./period-filter";
import type { StaffRecord } from "./staff-roster";
import {
  countPendingAcceptanceScan,
  countPendingRefund,
  countSignTimeouts,
} from "./trend-series";
import type { FlowOrderStatus, Order, SupplementOrder } from "./types";
import {
  buildWeeklyDigest,
  formatWeeklyDigestText,
  type WeeklyDigest,
} from "./weekly-report";
import type { ReportPersonScope } from "./evaluation-scope";
import { getAllSummaryBriefLabel } from "./report-hub-config";
import { getWeekRefForPeriod } from "./report-period-sync";
import { filterOrdersByWeek } from "./week-filter";

export const ACTIVE_TIMEOUT_HINT =
  "含量尺/出图/签约/下单四类环节超时";

export const PERIOD_LOW_DIMENSION_HINT = "本期新增";
export const WEEK_LOW_DIMENSION_HINT = "本周新增";
export const CUMULATIVE_LOW_DIMENSION_HINT = "累计";

export interface GlobalDigestAmounts {
  newDispatchAmount: number;
  refundAmount: number;
  pendingRefundAmount: number;
}

function isCreatedInBounds(
  order: Order,
  bounds: { start: Date; end: Date },
): boolean {
  const t = new Date(order.createdAt).getTime();
  return (
    Number.isFinite(t) &&
    t >= bounds.start.getTime() &&
    t < bounds.end.getTime()
  );
}

function sumOrderPortfolioAmount(
  order: Order,
  supplements: SupplementOrder[],
): number {
  const parts = classifyDispatcherOrder(order, supplements);
  return (
    parts.notOrdered.amount +
    parts.ordered.amount +
    parts.pendingRefund.amount +
    parts.confirmedRefund.amount
  );
}

export function computeGlobalDigestAmounts(
  orders: Order[],
  supplements: SupplementOrder[],
  period: PeriodSelection,
  ref = new Date(),
): GlobalDigestAmounts {
  const periodSupplements = filterSupplementsByPeriod(supplements, period);
  const periodOrders = filterOrdersByPeriod(orders, period);

  let newDispatchAmount = 0;
  if (period.preset === "thisWeek") {
    const { bounds } = filterOrdersByWeek(orders, ref);
    for (const order of orders) {
      if (!isCreatedInBounds(order, bounds)) continue;
      newDispatchAmount += sumOrderPortfolioAmount(order, periodSupplements);
    }
  } else {
    const bounds = getPeriodBounds(period);
    const cohort = bounds
      ? orders.filter((o) => isCreatedInBounds(o, bounds))
      : periodOrders;
    for (const order of cohort) {
      newDispatchAmount += sumOrderPortfolioAmount(order, periodSupplements);
    }
  }

  let refundAmount = 0;
  for (const order of periodOrders) {
    const parts = classifyDispatcherOrder(order, periodSupplements);
    refundAmount += parts.confirmedRefund.amount;
  }

  let pendingRefundAmount = 0;
  for (const order of orders) {
    if (order.status !== "待退单") continue;
    const parts = classifyDispatcherOrder(order, supplements);
    pendingRefundAmount += parts.pendingRefund.amount;
  }

  return { newDispatchAmount, refundAmount, pendingRefundAmount };
}

/** 交付与验收环节在途/当期指标 */
export interface GlobalWorkflowMetrics {
  pipelineActive: {
    已下单: number;
    已安装: number;
    已验收: number;
  };
  periodCompleted: {
    installedCount: number;
    acceptedCount: number;
  };
  pendingScanCount: number;
  pendingRefundCount: number;
  pendingRefundAmount: number;
  signTimeoutCount: number;
  lowDimensionCount: number;
  acceptanceRatedCount: number;
  acceptanceAvg: number | null;
  electronicRate: number | null;
}

export interface GlobalWeeklyDigest extends WeeklyDigest {
  scope: "global";
  workflow: GlobalWorkflowMetrics;
  amounts: GlobalDigestAmounts;
  leaderboards: MonthlyLeaderboards;
  lowDimensionCountWeek: number;
}

export interface GlobalMonthlyDigest extends MonthlyDigest {
  scope: "global";
  workflow: GlobalWorkflowMetrics;
  amounts: GlobalDigestAmounts;
  /** 本期/累计维度低评（all 周期时为累计） */
  lowDimensionCountPeriod: number;
}

function countByStatus(orders: Order[], status: FlowOrderStatus): number {
  return orders.filter((o) => o.status === status).length;
}

function countStatusEnteredInPeriod(
  orders: Order[],
  status: FlowOrderStatus,
  period: PeriodSelection,
): number {
  const bounds = getPeriodBounds(period);
  if (!bounds) return countByStatus(orders, status);
  return orders.filter((o) => {
    const at = o.statusEnteredAt?.[status];
    if (!at) return false;
    const t = new Date(at).getTime();
    return (
      Number.isFinite(t) &&
      t >= bounds.start.getTime() &&
      t < bounds.end.getTime()
    );
  }).length;
}

export function buildGlobalWorkflowMetrics(
  orders: Order[],
  supplements: SupplementOrder[],
  period: PeriodSelection,
  ref = new Date(),
): GlobalWorkflowMetrics {
  const acceptance = getAcceptanceEvaluationSummary(orders);
  const amounts = computeGlobalDigestAmounts(orders, supplements, period, ref);

  return {
    pipelineActive: {
      已下单: countByStatus(orders, "已下单"),
      已安装: countByStatus(orders, "已安装"),
      已验收: countByStatus(orders, "已验收"),
    },
    periodCompleted: {
      installedCount: countStatusEnteredInPeriod(orders, "已安装", period),
      acceptedCount: countStatusEnteredInPeriod(orders, "已验收", period),
    },
    pendingScanCount: countPendingAcceptanceScan(orders),
    pendingRefundCount: countPendingRefund(orders),
    pendingRefundAmount: amounts.pendingRefundAmount,
    signTimeoutCount: countSignTimeouts(orders, ref),
    lowDimensionCount: countLowDimensionReviews(orders),
    acceptanceRatedCount: acceptance.ratedCount,
    acceptanceAvg:
      acceptance.ratedCount > 0 ? acceptance.avgOverall : null,
    electronicRate:
      acceptance.ratedCount > 0 ? acceptance.electronicRate : null,
  };
}

export function buildGlobalWeeklyDigest(
  orders: Order[],
  supplements: SupplementOrder[],
  period: PeriodSelection,
  staffRecords: StaffRecord[] = [],
  ref = new Date(),
  personScope?: ReportPersonScope,
): GlobalWeeklyDigest {
  const weekRef = getWeekRefForPeriod(period, ref);
  const designerNames = personScope?.designerNames ?? null;
  const base = buildWeeklyDigest(
    orders,
    supplements,
    staffRecords,
    designerNames,
    weekRef,
  );
  const amounts = computeGlobalDigestAmounts(orders, supplements, period, weekRef);
  const periodOrders = filterOrdersByPeriod(orders, period, weekRef);
  const periodSupplements = filterSupplementsByPeriod(supplements, period, weekRef);
  const performance = getDesignerPerformanceRows(
    periodOrders,
    periodSupplements,
    designerNames,
    undefined,
    staffRecords,
    period,
  );
  const leaderboards = buildMonthlyLeaderboards(
    orders,
    supplements,
    period,
    staffRecords,
    performance,
    designerNames,
    personScope?.dispatcherNames ?? null,
  );
  return {
    ...base,
    scope: "global",
    workflow: buildGlobalWorkflowMetrics(orders, supplements, period, weekRef),
    amounts,
    leaderboards,
    lowDimensionCountWeek: countLowDimensionReviewsInPeriod(
      orders,
      period,
      weekRef,
    ),
  };
}

export function buildGlobalMonthlyDigest(
  orders: Order[],
  supplements: SupplementOrder[],
  period: PeriodSelection,
  staffRecords: StaffRecord[] = [],
  ref = new Date(),
  personScope?: ReportPersonScope,
): GlobalMonthlyDigest {
  const base = buildMonthlyDigest(
    orders,
    supplements,
    period,
    staffRecords,
    personScope?.designerNames ?? null,
    ref,
    personScope?.dispatcherNames ?? null,
  );
  const amounts = computeGlobalDigestAmounts(orders, supplements, period, ref);
  const lowDimensionCountPeriod =
    period.preset === "all"
      ? countLowDimensionReviews(orders)
      : countLowDimensionReviewsInPeriod(orders, period, ref);
  return {
    ...base,
    scope: "global",
    workflow: buildGlobalWorkflowMetrics(orders, supplements, period, ref),
    amounts,
    lowDimensionCountPeriod,
  };
}

function formatWorkflowSection(
  workflow: GlobalWorkflowMetrics,
  options?: { includeEvaluation?: boolean; skipHeader?: boolean },
): string[] {
  const includeEvaluation = options?.includeEvaluation !== false;
  const lines: string[] = [];
  if (!options?.skipHeader) {
    lines.push("【全流程 · 交付验收】");
    lines.push(
      `在途：已下单 ${workflow.pipelineActive.已下单} · 已安装 ${workflow.pipelineActive.已安装} · 已验收 ${workflow.pipelineActive.已验收}`,
    );
  }
  lines.push(
    `待扫码验收 ${workflow.pendingScanCount} · 待退单 ${formatCountAmountStat(workflow.pendingRefundCount, workflow.pendingRefundAmount)} · 签约超时 ${workflow.signTimeoutCount}${
      includeEvaluation ? ` · 维度低评 ${workflow.lowDimensionCount}` : ""
    }`,
  );
  if (includeEvaluation && workflow.acceptanceRatedCount > 0) {
    lines.push(
      `客户评价 ${workflow.acceptanceRatedCount} 单 · 均分 ${workflow.acceptanceAvg!.toFixed(1)} 星${
        workflow.electronicRate != null
          ? ` · 电子验收率 ${Math.round(workflow.electronicRate * 100)}%`
          : ""
      }`,
    );
  }
  return lines;
}

export function formatGlobalReportScopeHint(
  storeScopeLabel?: string | null,
): string {
  if (!storeScopeLabel) return " · 全公司全流程";
  if (storeScopeLabel.includes("、")) {
    return ` · 统计范围：${storeScopeLabel}（分管门店合并）`;
  }
  return ` · 统计范围：${storeScopeLabel}`;
}

export function formatGlobalWeeklyDigestText(
  digest: GlobalWeeklyDigest,
  storeScopeLabel?: string | null,
): string {
  const titlePrefix = storeScopeLabel
    ? `【${storeScopeLabel}·全流程周报】`
    : "【全流程全局周报】";
  const base = formatWeeklyDigestText(digest).replace(
    "【设计派单周报】",
    titlePrefix,
  );
  const workflowLines = formatWorkflowSection(digest.workflow, {
    includeEvaluation: false,
  });
  const parts = base.split("\n建议动作：");
  if (parts.length === 2) {
    return `${parts[0]}\n${workflowLines.join("\n")}\n\n建议动作：${parts[1]}`;
  }
  return `${base}\n\n${workflowLines.join("\n")}`;
}

export function formatGlobalMonthlyDigestText(
  digest: GlobalMonthlyDigest,
  storeScopeLabel?: string | null,
): string {
  const titlePrefix = storeScopeLabel
    ? `【${storeScopeLabel}·全流程月报】`
    : "【全流程全局月报】";
  const base = formatMonthlyDigestText(digest).replace(
    "【设计派单月报】",
    titlePrefix,
  );
  const workflowLines = [
    ...formatWorkflowSection(digest.workflow),
    `本期完成：安装 ${digest.workflow.periodCompleted.installedCount} · 验收 ${digest.workflow.periodCompleted.acceptedCount}`,
  ];
  const parts = base.split("\n建议动作：");
  if (parts.length === 2) {
    return `${parts[0]}\n${workflowLines.join("\n")}\n\n建议动作：${parts[1]}`;
  }
  return `${base}\n\n${workflowLines.join("\n")}`;
}

export function globalWorkflowStatItems(
  workflow: GlobalWorkflowMetrics,
  period?: PeriodSelection,
  options?: { includeEvaluation?: boolean },
): { label: string; value: string }[] {
  const includeEvaluation = options?.includeEvaluation !== false;
  const items = [
    {
      label: "在途已下单",
      value: String(workflow.pipelineActive.已下单),
    },
    {
      label: "待扫码验收",
      value: String(workflow.pendingScanCount),
    },
    {
      label: "待退单",
      value: formatCountAmountStat(
        workflow.pendingRefundCount,
        workflow.pendingRefundAmount,
      ),
    },
    {
      label: "签约超时",
      value: String(workflow.signTimeoutCount),
    },
  ];
  if (includeEvaluation) {
    items.push({
      label: "维度低评",
      value: String(workflow.lowDimensionCount),
    });
    if (workflow.acceptanceRatedCount > 0) {
      items.push({
        label: "验收均分",
        value: `${workflow.acceptanceAvg!.toFixed(1)} 星`,
      });
    }
  }
  if (period && period.preset !== "all") {
    items.splice(1, 0, {
      label: "本期安装",
      value: String(workflow.periodCompleted.installedCount),
    });
  }
  return items;
}

export function globalPrimaryStatItems(
  digest: WeeklyDigest | MonthlyDigest,
  amounts: GlobalDigestAmounts,
  extras: { label: string; value: string }[],
  options?: { allSummary?: boolean },
): { label: string; value: string }[] {
  const dispatchLabel = options?.allSummary ? "累计派单" : "新派单";
  const orderedLabel = options?.allSummary ? "累计下单" : "下单";
  const refundLabel = options?.allSummary ? "累计退单" : "退单";
  return [
    {
      label: dispatchLabel,
      value: formatCountAmountStat(
        digest.newDispatchCount,
        amounts.newDispatchAmount,
      ),
    },
    {
      label: orderedLabel,
      value: formatCountAmountStat(
        digest.orderedCount,
        digest.orderedAmount,
      ),
    },
    {
      label: refundLabel,
      value: formatCountAmountStat(digest.refundCount, amounts.refundAmount),
    },
    ...extras,
  ];
}

export function computeCumulativeDeliveryCounts(orders: Order[]): {
  installedCount: number;
  acceptedCount: number;
} {
  let installedCount = 0;
  let acceptedCount = 0;
  for (const order of orders) {
    if (order.status === "已验收") {
      acceptedCount += 1;
      installedCount += 1;
    } else if (order.status === "已安装") {
      installedCount += 1;
    }
  }
  return { installedCount, acceptedCount };
}

export function globalAllSummaryPrimaryStatItems(
  portfolio: StorePortfolioMetrics,
  activeTimeoutCount: number,
): { label: string; value: string; hint?: string }[] {
  const { dispatchBuckets } = portfolio;
  return [
    {
      label: "累计派单",
      value: formatCountAmountStat(
        dispatchBuckets.total.count,
        dispatchBuckets.total.amount,
      ),
    },
    {
      label: "累计存量",
      value: formatCountAmountStat(
        dispatchBuckets.stock.count,
        dispatchBuckets.stock.amount,
      ),
    },
    {
      label: "累计下单",
      value: formatCountAmountStat(
        dispatchBuckets.ordered.count,
        dispatchBuckets.ordered.amount,
      ),
    },
    {
      label: "累计退单",
      value: formatCountAmountStat(
        dispatchBuckets.refund.count,
        dispatchBuckets.refund.amount,
      ),
    },
    {
      label: "累计未完结",
      value: formatCountAmountStat(
        portfolio.unfinished.count,
        portfolio.unfinished.amount,
      ),
    },
    {
      label: "累计有效派单",
      value: formatCountAmountStat(
        portfolio.effective.count,
        portfolio.effective.amount,
      ),
    },
    {
      label: "累计均单值",
      value: formatDispatchMoney(portfolio.effective.avgPerOrder),
    },
    {
      label: "当前超时",
      value: String(activeTimeoutCount),
      hint: ACTIVE_TIMEOUT_HINT,
    },
  ];
}

export function globalSnapshotPipelineStatItems(
  workflow: GlobalWorkflowMetrics,
): { label: string; value: string }[] {
  return globalWorkflowStatItems(workflow, { preset: "all" }, {
    includeEvaluation: false,
  });
}

export function globalPeriodSnapshotStatItems(
  workflow: GlobalWorkflowMetrics,
  completed: { installedCount: number; acceptedCount: number },
  options?: {
    installLabel?: string;
    acceptLabel?: string;
    lowDimensionCount?: number;
    lowDimensionHint?: string;
    includeEvaluation?: boolean;
    includePeriodCompleted?: boolean;
  },
): { label: string; value: string; hint?: string }[] {
  const installLabel = options?.installLabel ?? "本期安装";
  const acceptLabel = options?.acceptLabel ?? "本期验收";
  const includeEvaluation = options?.includeEvaluation !== false;
  const includePeriodCompleted = options?.includePeriodCompleted !== false;
  const items: { label: string; value: string; hint?: string }[] = [
    ...globalSnapshotPipelineStatItems(workflow),
  ];
  if (includePeriodCompleted) {
    items.unshift(
      { label: installLabel, value: String(completed.installedCount) },
      { label: acceptLabel, value: String(completed.acceptedCount) },
    );
  }
  if (includeEvaluation) {
    items.push({
      label: "维度低评",
      value: String(
        options?.lowDimensionCount ?? workflow.lowDimensionCount,
      ),
      hint: options?.lowDimensionHint,
    });
  }
  return items;
}

export function globalAllSummaryWorkflowStatItems(
  workflow: GlobalWorkflowMetrics,
  delivery: { installedCount: number; acceptedCount: number },
  options?: { includeEvaluation?: boolean },
): { label: string; value: string; hint?: string }[] {
  return globalPeriodSnapshotStatItems(workflow, delivery, {
    installLabel: "累计安装",
    acceptLabel: "累计验收",
    includeEvaluation: options?.includeEvaluation !== false,
    lowDimensionHint: CUMULATIVE_LOW_DIMENSION_HINT,
  });
}

export function globalMonthlySnapshotStatItems(
  workflow: GlobalWorkflowMetrics,
  portfolio: StorePortfolioMetrics,
  lowDimensionCountPeriod: number,
): { label: string; value: string; hint?: string }[] {
  return [
    {
      label: "累计有效派单",
      value: formatCountAmountStat(
        portfolio.effective.count,
        portfolio.effective.amount,
      ),
    },
    {
      label: "累计均单值",
      value: formatDispatchMoney(portfolio.effective.avgPerOrder),
    },
    ...globalSnapshotPipelineStatItems(workflow),
    {
      label: "维度低评",
      value: String(lowDimensionCountPeriod),
      hint: PERIOD_LOW_DIMENSION_HINT,
    },
  ];
}

export function globalWeeklySnapshotStatItems(
  workflow: GlobalWorkflowMetrics,
  portfolio: StorePortfolioMetrics,
  lowDimensionCountWeek: number,
): { label: string; value: string; hint?: string }[] {
  return [
    {
      label: "累计有效派单",
      value: formatCountAmountStat(
        portfolio.effective.count,
        portfolio.effective.amount,
      ),
    },
    {
      label: "累计均单值",
      value: formatDispatchMoney(portfolio.effective.avgPerOrder),
    },
    ...globalSnapshotPipelineStatItems(workflow),
    {
      label: "维度低评",
      value: String(lowDimensionCountWeek),
      hint: WEEK_LOW_DIMENSION_HINT,
    },
  ];
}

export function globalMonthlyPrimaryStatItems(
  digest: GlobalMonthlyDigest,
  portfolio: StorePortfolioMetrics,
): { label: string; value: string; hint?: string }[] {
  const { dispatchBuckets } = portfolio;
  const { periodCompleted } = digest.workflow;
  return [
    {
      label: "本期派单",
      value: formatCountAmountStat(
        digest.newDispatchCount,
        digest.amounts.newDispatchAmount,
      ),
    },
    {
      label: "当前存量",
      value: formatCountAmountStat(
        dispatchBuckets.stock.count,
        dispatchBuckets.stock.amount,
      ),
    },
    {
      label: "本期下单",
      value: formatCountAmountStat(digest.orderedCount, digest.orderedAmount),
    },
    {
      label: "本期退单",
      value: formatCountAmountStat(
        digest.refundCount,
        digest.amounts.refundAmount,
      ),
    },
    {
      label: "本期安装",
      value: String(periodCompleted.installedCount),
    },
    {
      label: "本期验收",
      value: String(periodCompleted.acceptedCount),
    },
    {
      label: "当前未完结",
      value: formatCountAmountStat(
        portfolio.unfinished.count,
        portfolio.unfinished.amount,
      ),
    },
    {
      label: "当前超时",
      value: String(digest.activeTimeoutCount),
      hint: ACTIVE_TIMEOUT_HINT,
    },
  ];
}

export function globalWeeklyPrimaryStatItems(
  digest: GlobalWeeklyDigest,
  portfolio: StorePortfolioMetrics,
): { label: string; value: string; hint?: string }[] {
  const { periodCompleted } = digest.workflow;
  return [
    {
      label: "本周新派单",
      value: formatCountAmountStat(
        digest.newDispatchCount,
        digest.amounts.newDispatchAmount,
      ),
    },
    {
      label: "本周下单",
      value: formatCountAmountStat(
        digest.orderedCount,
        digest.orderedAmount,
      ),
    },
    {
      label: "本周退单",
      value: formatCountAmountStat(
        digest.refundCount,
        digest.amounts.refundAmount,
      ),
    },
    {
      label: "本周安装",
      value: String(periodCompleted.installedCount),
    },
    {
      label: "本周验收",
      value: String(periodCompleted.acceptedCount),
    },
    {
      label: "当前未完结",
      value: formatCountAmountStat(
        portfolio.unfinished.count,
        portfolio.unfinished.amount,
      ),
    },
    {
      label: "当前超时",
      value: String(digest.activeTimeoutCount),
      hint: ACTIVE_TIMEOUT_HINT,
    },
  ];
}

export function globalMonthlyWorkflowStatItems(
  workflow: GlobalWorkflowMetrics,
  portfolio: StorePortfolioMetrics,
  lowDimensionCountPeriod: number,
): { label: string; value: string; hint?: string }[] {
  return globalMonthlySnapshotStatItems(
    workflow,
    portfolio,
    lowDimensionCountPeriod,
  );
}

export function globalWeeklyWorkflowStatItems(
  workflow: GlobalWorkflowMetrics,
  portfolio: StorePortfolioMetrics,
  lowDimensionCountWeek: number,
): { label: string; value: string; hint?: string }[] {
  return globalWeeklySnapshotStatItems(
    workflow,
    portfolio,
    lowDimensionCountWeek,
  );
}

export function buildGlobalWeeklyActionLines(
  digest: GlobalWeeklyDigest,
  orders: Order[],
  supplements: SupplementOrder[],
  period: PeriodSelection,
  staffRecords: StaffRecord[],
  personScope?: ReportPersonScope,
  ref = new Date(),
): string[] {
  const lines = digest.actionLines.filter((l) => !l.includes("验收差评"));
  const previousPeriod = getPreviousPeriod(period);
  if (previousPeriod) {
    const prev = buildGlobalWeeklyDigest(
      orders,
      supplements,
      previousPeriod,
      staffRecords,
      ref,
      personScope,
    );
    const dispatchDelta = digest.newDispatchCount - prev.newDispatchCount;
    if (dispatchDelta !== 0) {
      lines.unshift(
        `较上周新派单 ${dispatchDelta > 0 ? "+" : ""}${dispatchDelta} 笔`,
      );
    }
    const orderedDelta = digest.orderedCount - prev.orderedCount;
    if (orderedDelta !== 0) {
      lines.unshift(
        `较上周下单 ${orderedDelta > 0 ? "+" : ""}${orderedDelta} 笔`,
      );
    }
  }
  if (digest.lowDimensionCountWeek > 0) {
    lines.push(`维度低评 ${digest.lowDimensionCountWeek} 单需复盘`);
  }
  return lines;
}

export function formatGlobalAllSummaryDigestText(
  digest: GlobalMonthlyDigest,
  orders: Order[],
  supplements: SupplementOrder[],
  storeScopeLabel?: string | null,
): string {
  const briefLabel = getAllSummaryBriefLabel(storeScopeLabel);
  const title = storeScopeLabel
    ? `【${storeScopeLabel}·${briefLabel}】`
    : `【${briefLabel}】`;
  const delivery = computeCumulativeDeliveryCounts(orders);
  const portfolio = computeStorePortfolioMetrics(orders, supplements);
  const { dispatchBuckets } = portfolio;
  const lines = [
    `${title} · 全部`,
    "",
    `累计派单：${formatCountAmountStat(dispatchBuckets.total.count, dispatchBuckets.total.amount)}（= 累计存量 + 累计下单 + 累计退单）`,
    `累计存量：${formatCountAmountStat(dispatchBuckets.stock.count, dispatchBuckets.stock.amount)}`,
    `累计下单：${formatCountAmountStat(dispatchBuckets.ordered.count, dispatchBuckets.ordered.amount)}`,
    `累计退单：${formatCountAmountStat(dispatchBuckets.refund.count, dispatchBuckets.refund.amount)}`,
    `累计未完结：${formatCountAmountStat(portfolio.unfinished.count, portfolio.unfinished.amount)}`,
    `累计有效派单：${formatCountAmountStat(portfolio.effective.count, portfolio.effective.amount)}`,
    `累计均单值：${formatDispatchMoney(portfolio.effective.avgPerOrder)}`,
    `当前超时：${digest.activeTimeoutCount} 笔（${ACTIVE_TIMEOUT_HINT}） · 待接单：${digest.pendingAcceptCount}（超时 ${digest.acceptOverdueCount}）`,
    `累计安装：${delivery.installedCount} · 累计验收：${delivery.acceptedCount}`,
    `维度低评：${digest.lowDimensionCountPeriod} 单（累计）`,
    "",
    "【交付验收 · 当前快照】",
    `当前状态：已下单 ${digest.workflow.pipelineActive.已下单} · 已安装 ${digest.workflow.pipelineActive.已安装} · 已验收 ${digest.workflow.pipelineActive.已验收}`,
    ...formatWorkflowSection(digest.workflow, { skipHeader: true }),
    "",
  ];

  lines.push(
    ...formatLeaderboardsText(digest.leaderboards, {
      heading: "累计排行 · 综合前5",
    }),
    "",
  );
  lines.push(
    ...formatDesignerSummaryText(digest.designerSummary, {
      ratingMetric: "lowDimension",
    }),
    "",
  );

  if (digest.issueTagStats.length > 0) {
    lines.push(
      "问题标签：",
      ...digest.issueTagStats.map((t) => `- ${t.tag} ${t.count}`),
      "",
    );
  }

  const actionLines = digest.actionLines.filter(
    (l) => !l.includes("较") && !l.includes("验收差评"),
  );
  if (digest.lowDimensionCountPeriod > 0) {
    actionLines.push(
      `维度低评 ${digest.lowDimensionCountPeriod} 单需复盘`,
    );
  }
  if (actionLines.length > 0) {
    lines.push("建议动作：", ...actionLines.map((l) => `- ${l}`));
  }
  return lines.join("\n");
}
