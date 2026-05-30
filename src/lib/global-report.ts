import { countBadAcceptanceReviews } from "./acceptance-rating";
import { getAcceptanceEvaluationSummary } from "./acceptance-evaluation-stats";
import { formatDispatchMoney } from "./dispatch-totals";
import { classifyDispatcherOrder } from "./evaluation-stats";
import {
  buildMonthlyDigest,
  formatMonthlyDigestText,
  type MonthlyDigest,
} from "./monthly-report";
import {
  filterOrdersByPeriod,
  filterSupplementsByPeriod,
  getPeriodBounds,
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
import { getWeekRefForPeriod } from "./report-period-sync";
import { filterOrdersByWeek } from "./week-filter";

export interface GlobalDigestAmounts {
  newDispatchAmount: number;
  refundAmount: number;
  pendingRefundAmount: number;
}

function formatCountAmountStat(count: number, amount: number): string {
  return `${count} / ${formatDispatchMoney(amount)}`;
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
    parts.notOrdered.amount + parts.ordered.amount + parts.refunded.amount
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
    refundAmount += parts.refunded.amount;
  }

  let pendingRefundAmount = 0;
  for (const order of orders) {
    if (order.status !== "待退单") continue;
    const parts = classifyDispatcherOrder(order, supplements);
    pendingRefundAmount +=
      parts.notOrdered.amount + parts.ordered.amount + parts.refunded.amount;
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
  badReviewCount: number;
  acceptanceRatedCount: number;
  acceptanceAvg: number | null;
  electronicRate: number | null;
}

export interface GlobalWeeklyDigest extends WeeklyDigest {
  scope: "global";
  workflow: GlobalWorkflowMetrics;
  amounts: GlobalDigestAmounts;
}

export interface GlobalMonthlyDigest extends MonthlyDigest {
  scope: "global";
  workflow: GlobalWorkflowMetrics;
  amounts: GlobalDigestAmounts;
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
    badReviewCount: countBadAcceptanceReviews(orders),
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
  return {
    ...base,
    scope: "global",
    workflow: buildGlobalWorkflowMetrics(orders, supplements, period, weekRef),
    amounts,
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
  return {
    ...base,
    scope: "global",
    workflow: buildGlobalWorkflowMetrics(orders, supplements, period, ref),
    amounts,
  };
}

function formatWorkflowSection(
  workflow: GlobalWorkflowMetrics,
  options?: { includeEvaluation?: boolean },
): string[] {
  const includeEvaluation = options?.includeEvaluation !== false;
  const lines = [
    "【全流程 · 交付验收】",
    `在途：已下单 ${workflow.pipelineActive.已下单} · 已安装 ${workflow.pipelineActive.已安装} · 已验收 ${workflow.pipelineActive.已验收}`,
    `待扫码验收 ${workflow.pendingScanCount} · 待退单 ${formatCountAmountStat(workflow.pendingRefundCount, workflow.pendingRefundAmount)} · 签约超时 ${workflow.signTimeoutCount}${
      includeEvaluation ? ` · 验收差评 ${workflow.badReviewCount}` : ""
    }`,
  ];
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
      label: "待扫码",
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
      label: "验收差评",
      value: String(workflow.badReviewCount),
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
): { label: string; value: string }[] {
  return [
    {
      label: "新派单",
      value: formatCountAmountStat(
        digest.newDispatchCount,
        amounts.newDispatchAmount,
      ),
    },
    {
      label: "下单",
      value: formatCountAmountStat(
        digest.orderedCount,
        digest.orderedAmount,
      ),
    },
    {
      label: "退单",
      value: formatCountAmountStat(digest.refundCount, amounts.refundAmount),
    },
    ...extras,
  ];
}
