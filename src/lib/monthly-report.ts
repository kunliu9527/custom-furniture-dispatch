import { getDesignerPerformanceRows, getMonthlyReportOverview } from "./designer-performance";
import { aggregateIssueTags } from "./issue-tag-stats";
import { getManagerAlerts } from "./manager-alerts";
import {
  buildDesignerPeriodSummary,
  buildDigestAcceptanceStats,
  buildMonthlyLeaderboards,
  formatDesignerSummaryText,
  formatLeaderboardsText,
  type DesignerPeriodSummary,
  type DigestAcceptanceStats,
  type MonthlyLeaderboards,
} from "./report-digest-extensions";
import {
  getPendingAcceptanceOrders,
  isAcceptanceOverdue,
} from "./designer-load";
import { formatDispatchMoney } from "./dispatch-totals";
import {
  filterOrdersByPeriod,
  filterSupplementsByPeriod,
  formatPeriodLabel,
  getPeriodBounds,
  getPreviousPeriod,
  type PeriodSelection,
} from "./period-filter";
import type { StaffRecord } from "./staff-roster";
import type { Order, SupplementOrder } from "./types";

export interface MonthlyDigest {
  period: PeriodSelection;
  periodLabel: string;
  previousPeriodLabel: string | null;
  generatedAt: string;
  newDispatchCount: number;
  previousNewDispatchCount: number | null;
  orderedCount: number;
  orderedAmount: number;
  previousOrderedAmount: number | null;
  refundCount: number;
  previousRefundCount: number | null;
  activeTimeoutCount: number;
  pendingAcceptCount: number;
  acceptOverdueCount: number;
  acceptanceStats: DigestAcceptanceStats;
  leaderboards: MonthlyLeaderboards;
  designerSummary: DesignerPeriodSummary;
  topContributors: { name: string; score: number; orderedAmount: number }[];
  attentionDesigners: { name: string; reason: string }[];
  issueTagStats: { tag: string; count: number }[];
  actionLines: string[];
}

function deltaLabel(
  current: number,
  previous: number | null,
  previousLabel: string | null,
): string | null {
  if (previous == null || !previousLabel) return null;
  if (previous === 0) {
    return current > 0 ? `较${previousLabel} 新增` : `较${previousLabel} 持平`;
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return `较${previousLabel} 持平`;
  return `较${previousLabel} ${pct > 0 ? "↑" : "↓"}${Math.abs(pct)}%`;
}

function countNewDispatchInPeriod(
  orders: Order[],
  period: PeriodSelection,
): number {
  const bounds = getPeriodBounds(period);
  if (!bounds) return orders.length;
  return orders.filter((o) => {
    const t = new Date(o.createdAt).getTime();
    return (
      Number.isFinite(t) &&
      t >= bounds.start.getTime() &&
      t < bounds.end.getTime()
    );
  }).length;
}

export function buildMonthlyDigest(
  orders: Order[],
  supplements: SupplementOrder[],
  period: PeriodSelection,
  staffRecords: StaffRecord[] = [],
  designerNames: string[] | null = null,
  ref = new Date(),
  dispatcherNames: string[] | null = null,
): MonthlyDigest {
  const periodOrders = filterOrdersByPeriod(orders, period);
  const periodSupplements = filterSupplementsByPeriod(supplements, period);
  const previousPeriod = getPreviousPeriod(period);
  const previousOrders = previousPeriod
    ? filterOrdersByPeriod(orders, previousPeriod)
    : [];
  const previousSupplements = previousPeriod
    ? filterSupplementsByPeriod(supplements, previousPeriod)
    : [];

  const overview = getMonthlyReportOverview(
    periodOrders,
    periodSupplements,
    period,
  );
  const previousOverview = previousPeriod
    ? getMonthlyReportOverview(previousOrders, previousSupplements, previousPeriod)
    : null;

  const performance = getDesignerPerformanceRows(
    periodOrders,
    periodSupplements,
    designerNames,
    undefined,
    staffRecords,
    period,
  );

  const alerts = getManagerAlerts(orders, ref);
  const pending = getPendingAcceptanceOrders(orders);
  const acceptOverdue = pending.filter((o) => isAcceptanceOverdue(o, ref));

  const topContributors = performance
    .filter((r) => !r.sampleTooSmall && (r.contributionScore > 0 || r.orderedAmount > 0))
    .slice(0, 5)
    .map((r) => ({
      name: r.label,
      score: r.contributionScore,
      orderedAmount: r.orderedAmount,
    }));

  const leaderboards = buildMonthlyLeaderboards(
    orders,
    supplements,
    period,
    staffRecords,
    performance,
    designerNames,
    dispatcherNames,
  );
  const designerSummary = buildDesignerPeriodSummary(
    performance,
    periodOrders,
    periodSupplements,
  );
  const acceptanceStats = buildDigestAcceptanceStats(orders);

  const attentionDesigners: MonthlyDigest["attentionDesigners"] = [];
  for (const row of performance) {
    if (row.timeoutCount >= 2) {
      attentionDesigners.push({
        name: row.label,
        reason: `当期超时 ${row.timeoutCount} 单`,
      });
    } else if (row.refundCount >= 1 && row.orderedCount === 0) {
      attentionDesigners.push({
        name: row.label,
        reason: `当期退单 ${row.refundCount} 且无下单`,
      });
    }
  }

  const issueTagStats = aggregateIssueTags(periodOrders, period).map((t) => ({
    tag: t.tag,
    count: t.count,
  }));

  const periodLabel = formatPeriodLabel(period);
  const previousPeriodLabel = previousPeriod
    ? formatPeriodLabel(previousPeriod)
    : null;

  const actionLines: string[] = [];
  const newDispatchCount = countNewDispatchInPeriod(periodOrders, period);
  const previousNewDispatchCount = previousPeriod
    ? countNewDispatchInPeriod(previousOrders, previousPeriod)
    : null;

  const dispatchDelta = deltaLabel(
    newDispatchCount,
    previousNewDispatchCount,
    previousPeriodLabel,
  );
  if (dispatchDelta) actionLines.push(`新派单 ${dispatchDelta}`);
  const amountDelta = deltaLabel(
    overview.orderedAmount,
    previousOverview?.orderedAmount ?? null,
    previousPeriodLabel,
  );
  if (amountDelta) actionLines.push(`下单额 ${amountDelta}`);
  if (alerts.length > 0) {
    actionLines.push(`当前仍有 ${alerts.length} 笔流程超时待跟进`);
  }
  if (acceptOverdue.length > 0) {
    actionLines.push(`${acceptOverdue.length} 笔派单超过 24h 未确认接单`);
  }
  if (acceptanceStats.badReviewCount > 0) {
    actionLines.push(`验收差评 ${acceptanceStats.badReviewCount} 单需复盘`);
  }
  if (designerSummary.needsImprovement.length > 0) {
    actionLines.push(
      `关注设计师：${designerSummary.needsImprovement.slice(0, 3).map((a) => a.name).join("、")}`,
    );
  } else if (attentionDesigners.length > 0) {
    actionLines.push(
      `关注设计师：${attentionDesigners.slice(0, 3).map((a) => a.name).join("、")}`,
    );
  }
  if (actionLines.length === 0) {
    actionLines.push("本期经营平稳，可结合综合看板查看趋势");
  }

  return {
    period,
    periodLabel,
    previousPeriodLabel,
    generatedAt: ref.toISOString(),
    newDispatchCount,
    previousNewDispatchCount,
    orderedCount: overview.orderedCount,
    orderedAmount: overview.orderedAmount,
    previousOrderedAmount: previousOverview?.orderedAmount ?? null,
    refundCount: overview.refundCount,
    previousRefundCount: previousOverview?.refundCount ?? null,
    activeTimeoutCount: alerts.length,
    pendingAcceptCount: pending.length,
    acceptOverdueCount: acceptOverdue.length,
    acceptanceStats,
    leaderboards,
    designerSummary,
    topContributors,
    attentionDesigners: attentionDesigners.slice(0, 5),
    issueTagStats,
    actionLines,
  };
}

export function formatMonthlyDigestText(digest: MonthlyDigest): string {
  const lines = [
    `【设计派单月报】${digest.periodLabel}`,
    "",
    `新派单：${digest.newDispatchCount} 笔`,
    `下单：${digest.orderedCount} 笔 · ${formatDispatchMoney(digest.orderedAmount)}`,
    `退单：${digest.refundCount} 笔`,
    `当前超时：${digest.activeTimeoutCount} 笔 · 待接单：${digest.pendingAcceptCount}（超时 ${digest.acceptOverdueCount}）`,
    `验收差评：${digest.acceptanceStats.badReviewCount} 单${digest.acceptanceStats.lowDimensionCount > 0 ? ` · 低分维度 ${digest.acceptanceStats.lowDimensionCount} 单` : ""}`,
    "",
  ];

  lines.push(...formatLeaderboardsText(digest.leaderboards), "");

  lines.push(...formatDesignerSummaryText(digest.designerSummary), "");

  if (digest.issueTagStats.length > 0) {
    lines.push(
      "问题标签：",
      digest.issueTagStats.map((t) => `- ${t.tag} ${t.count}`).join("\n"),
      "",
    );
  }

  lines.push("建议动作：", ...digest.actionLines.map((l) => `- ${l}`));
  return lines.join("\n");
}
