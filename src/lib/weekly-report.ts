import { getDesignerPerformanceRows, getMonthlyReportOverview } from "./designer-performance";
import { aggregateIssueTags } from "./issue-tag-stats";
import { getManagerAlerts } from "./manager-alerts";
import {
  getPendingAcceptanceOrders,
  isAcceptanceOverdue,
} from "./designer-load";
import { formatDispatchMoney } from "./dispatch-totals";
import type { StaffRecord } from "./staff-roster";
import type { Order, SupplementOrder } from "./types";
import { filterOrdersByWeek, getWeekId } from "./week-filter";

export interface WeeklyDigest {
  weekId: string;
  weekLabel: string;
  generatedAt: string;
  newDispatchCount: number;
  orderedCount: number;
  orderedAmount: number;
  refundCount: number;
  activeTimeoutCount: number;
  pendingAcceptCount: number;
  acceptOverdueCount: number;
  topContributors: { name: string; score: number; orderedAmount: number }[];
  attentionDesigners: { name: string; reason: string }[];
  issueTagStats: { tag: string; count: number }[];
  actionLines: string[];
}

export function buildWeeklyDigest(
  orders: Order[],
  supplements: SupplementOrder[],
  staffRecords: StaffRecord[] = [],
  designerNames: string[] | null = null,
  ref = new Date(),
): WeeklyDigest {
  const { bounds, orders: weekOrders } = filterOrdersByWeek(orders, ref);
  const weekPeriod = { preset: "all" as const };

  const overview = getMonthlyReportOverview(weekOrders, supplements, weekPeriod);
  const performance = getDesignerPerformanceRows(
    weekOrders,
    supplements.filter((s) =>
      weekOrders.some((o) => o.id === s.parentOrderId),
    ),
    designerNames,
    undefined,
    staffRecords,
    weekPeriod,
  );

  const alerts = getManagerAlerts(orders, ref);
  const pending = getPendingAcceptanceOrders(orders);
  const acceptOverdue = pending.filter((o) => isAcceptanceOverdue(o, ref));

  const topContributors = performance
    .filter((r) => r.contributionScore > 0 || r.orderedAmount > 0)
    .slice(0, 3)
    .map((r) => ({
      name: r.label,
      score: r.contributionScore,
      orderedAmount: r.orderedAmount,
    }));

  const attentionDesigners: WeeklyDigest["attentionDesigners"] = [];
  for (const row of performance) {
    if (row.timeoutCount >= 2) {
      attentionDesigners.push({
        name: row.label,
        reason: `当前超时 ${row.timeoutCount} 单`,
      });
    } else if (row.refundCount >= 1 && row.orderedCount === 0) {
      attentionDesigners.push({
        name: row.label,
        reason: `本周退单 ${row.refundCount} 且无下单`,
      });
    }
  }

  const issueTagStats = aggregateIssueTags(weekOrders, weekPeriod).map((t) => ({
    tag: t.tag,
    count: t.count,
  }));

  const actionLines: string[] = [];
  if (alerts.length > 0) {
    actionLines.push(`优先跟进 ${alerts.length} 笔流程超时订单`);
  }
  if (acceptOverdue.length > 0) {
    actionLines.push(`${acceptOverdue.length} 笔派单超过 24h 未确认接单`);
  }
  if (attentionDesigners.length > 0) {
    actionLines.push(
      `关注设计师：${attentionDesigners.slice(0, 3).map((a) => a.name).join("、")}`,
    );
  }
  if (actionLines.length === 0) {
    actionLines.push("本周暂无紧急项，可例行查看绩效月报与在途负荷");
  }

  return {
    weekId: getWeekId(ref),
    weekLabel: bounds.label,
    generatedAt: ref.toISOString(),
    newDispatchCount: weekOrders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return (
        Number.isFinite(t) &&
        t >= bounds.start.getTime() &&
        t < bounds.end.getTime()
      );
    }).length,
    orderedCount: overview.orderedCount,
    orderedAmount: overview.orderedAmount,
    refundCount: overview.refundCount,
    activeTimeoutCount: alerts.length,
    pendingAcceptCount: pending.length,
    acceptOverdueCount: acceptOverdue.length,
    topContributors,
    attentionDesigners: attentionDesigners.slice(0, 5),
    issueTagStats,
    actionLines,
  };
}

export function formatWeeklyDigestText(digest: WeeklyDigest): string {
  const lines = [
    `【设计派单周报】${digest.weekLabel}`,
    "",
    `本周新派单：${digest.newDispatchCount} 笔`,
    `本周下单：${digest.orderedCount} 笔 · ${formatDispatchMoney(digest.orderedAmount)}`,
    `退单：${digest.refundCount} 笔`,
    `当前超时：${digest.activeTimeoutCount} 笔 · 待接单：${digest.pendingAcceptCount}（超时 ${digest.acceptOverdueCount}）`,
    "",
  ];

  if (digest.topContributors.length > 0) {
    lines.push(
      "贡献前三：",
      ...digest.topContributors.map(
        (t, i) =>
          `${i + 1}. ${t.name} · 贡献 ${t.score} · 下单 ${formatDispatchMoney(t.orderedAmount)}`,
      ),
      "",
    );
  }

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
