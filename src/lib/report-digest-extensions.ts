import { formatDispatchMoney } from "./dispatch-totals";
import {
  formatPerformanceConversion,
  sortPerformanceRows,
  type DesignerPerformanceRow,
} from "./designer-performance";
import {
  buildDesignerRankInsights,
  buildDesignerSectionSummary,
  buildSmartLeaderboards,
  type RoleScoreEntry,
  type SmartLeaderboards,
  type StoreScoreEntry,
} from "./role-evaluation-score";
import {
  countBadAcceptanceReviews,
  countLowDimensionReviews,
  orderHasBadAcceptanceReview,
  orderHasLowDimensionRating,
} from "./acceptance-rating";
import {
  type PeriodSelection,
} from "./period-filter";
import type { StaffRecord } from "./staff-roster";
import type { Order, SupplementOrder } from "./types";

export type MonthlyLeaderboards = SmartLeaderboards;
export type { RoleScoreEntry, StoreScoreEntry };

export interface DesignerPersonInsight {
  name: string;
  rank: number;
  totalRanked: number;
  compositeScore: number;
  highlight: string;
  weakness?: string;
  summary: string;
}

export interface DesignerPeriodSummary {
  eligibleDesignerCount: number;
  inProgressTotal: number;
  timeoutTotal: number;
  refundTotal: number;
  badReviewTotal: number;
  lowDimensionTotal: number;
  sectionSummary: string;
  topPerformers: DesignerPersonInsight[];
  needsImprovement: DesignerPersonInsight[];
  topConversion: {
    name: string;
    rate: number | null;
    orderedAmount: number;
  }[];
  topOrderedAmount: { name: string; amount: number }[];
}

export interface DigestAcceptanceStats {
  badReviewCount: number;
  lowDimensionCount: number;
}

export function buildDigestAcceptanceStats(
  orders: Order[],
): DigestAcceptanceStats {
  let lowDimensionCount = 0;
  for (const order of orders) {
    if (
      order.status === "已验收" &&
      !orderHasBadAcceptanceReview(order) &&
      orderHasLowDimensionRating(order)
    ) {
      lowDimensionCount += 1;
    }
  }
  return {
    badReviewCount: countBadAcceptanceReviews(orders),
    lowDimensionCount,
  };
}

export function buildMonthlyLeaderboards(
  orders: Order[],
  supplements: SupplementOrder[],
  period: PeriodSelection,
  staffRecords: StaffRecord[],
  _performance: DesignerPerformanceRow[],
  designerNames: string[] | null = null,
  dispatcherNames: string[] | null = null,
): MonthlyLeaderboards {
  return buildSmartLeaderboards(
    orders,
    supplements,
    period,
    staffRecords,
    designerNames,
    dispatcherNames,
  );
}

function countDesignerBadReviews(
  orders: Order[],
  designer: string,
): number {
  return orders.filter(
    (o) => o.designer === designer && orderHasBadAcceptanceReview(o),
  ).length;
}

function buildDesignerPersonPortraits(
  performance: DesignerPerformanceRow[],
  orders: Order[],
  supplements: SupplementOrder[],
): {
  topPerformers: DesignerPersonInsight[];
  needsImprovement: DesignerPersonInsight[];
} {
  const { ranked, bottomRanked } = buildDesignerRankInsights(
    performance,
    orders,
    supplements,
  );
  const totalRanked = ranked.length;

  const topPerformers: DesignerPersonInsight[] = ranked
    .filter(
      (r) =>
        r.rank <= 3 &&
        (r.compositeScore >= 55 || totalRanked <= 4),
    )
    .slice(0, 3)
    .map((r) => ({
      name: r.name,
      rank: r.rank,
      totalRanked: r.totalRanked,
      compositeScore: r.compositeScore,
      highlight: r.highlight,
      summary: r.summary,
    }));

  const topNames = new Set(topPerformers.map((p) => p.name));
  const needsMap = new Map<string, DesignerPersonInsight>();

  for (const r of bottomRanked) {
    if (topNames.has(r.name)) continue;
    needsMap.set(r.name, {
      name: r.name,
      rank: r.rank,
      totalRanked: r.totalRanked,
      compositeScore: r.compositeScore,
      highlight: r.highlight,
      weakness: r.weakness,
      summary: r.summary,
    });
  }

  for (const row of performance) {
    if (row.sampleTooSmall || topNames.has(row.label) || needsMap.has(row.label)) {
      continue;
    }
    const rankEntry = ranked.find((r) => r.name === row.label);
    if (!rankEntry || rankEntry.compositeScore >= 50) continue;

    const flags: string[] = [];
    if (row.timeoutCount >= 2) flags.push(`超时 ${row.timeoutCount} 单`);
    if (row.refundCount >= 1 && row.orderedCount === 0) {
      flags.push(`退单 ${row.refundCount} 且无下单`);
    }
    const badReviews = countDesignerBadReviews(orders, row.label);
    if (badReviews > 0) flags.push(`验收差评 ${badReviews} 单`);

    if (flags.length === 0) continue;

    needsMap.set(row.label, {
      name: row.label,
      rank: rankEntry.rank,
      totalRanked: rankEntry.totalRanked,
      compositeScore: rankEntry.compositeScore,
      highlight: rankEntry.highlight,
      weakness: flags[0],
      summary: `${flags.join("、")}，综合${rankEntry.compositeScore}分，需经理介入跟进。`,
    });
  }

  const needsImprovement = [...needsMap.values()]
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 4);

  return { topPerformers, needsImprovement };
}

export function buildDesignerPeriodSummary(
  performance: DesignerPerformanceRow[],
  orders: Order[],
  supplements: SupplementOrder[] = [],
): DesignerPeriodSummary {
  const eligible = performance.filter((r) => !r.sampleTooSmall);
  const { topPerformers, needsImprovement } = buildDesignerPersonPortraits(
    performance,
    orders,
    supplements,
  );

  const inProgressTotal = performance.reduce((s, r) => s + r.inProgressCount, 0);
  const timeoutTotal = performance.reduce((s, r) => s + r.timeoutCount, 0);
  const refundTotal = performance.reduce((s, r) => s + r.refundCount, 0);
  const badReviewTotal = countBadAcceptanceReviews(orders);
  const lowDimensionTotal = countLowDimensionReviews(orders);

  const topConversion = eligible
    .filter(
      (r) =>
        r.orderConversionRate != null &&
        (r.orderedCount > 0 || r.inProgressCount > 0),
    )
    .sort(
      (a, b) =>
        (b.orderConversionRate ?? 0) - (a.orderConversionRate ?? 0) ||
        b.orderedAmount - a.orderedAmount,
    )
    .slice(0, 5)
    .map((r) => ({
      name: r.label,
      rate: r.orderConversionRate,
      orderedAmount: r.orderedAmount,
    }));

  const topOrderedAmount = sortPerformanceRows(eligible, "orderedAmount")
    .filter((r) => r.orderedAmount > 0)
    .slice(0, 5)
    .map((r) => ({ name: r.label, amount: r.orderedAmount }));

  return {
    eligibleDesignerCount: eligible.length,
    inProgressTotal,
    timeoutTotal,
    refundTotal,
    badReviewTotal,
    lowDimensionTotal,
    sectionSummary: buildDesignerSectionSummary({
      eligibleCount: eligible.length,
      inProgressTotal,
      timeoutTotal,
      refundTotal,
      badReviewTotal,
      topPerformers,
      needsImprovement,
    }),
    topPerformers,
    needsImprovement,
    topConversion,
    topOrderedAmount,
  };
}

export function formatLeaderboardsText(
  leaderboards: MonthlyLeaderboards,
  options?: { heading?: string },
): string[] {
  const lines: string[] = [
    `【${options?.heading ?? "本期排行 · 综合前5"}】`,
  ];

  if (leaderboards.dispatcherTop5.length > 0) {
    lines.push("派单人：");
    lines.push(
      ...leaderboards.dispatcherTop5.map(
        (r, i) =>
          `${i + 1}. ${r.name} · 综合 ${r.compositeScore} · ${r.highlight} · ${r.summary}`,
      ),
    );
  }
  if (leaderboards.designerTop5.length > 0) {
    lines.push("设计师：");
    lines.push(
      ...leaderboards.designerTop5.map(
        (r, i) =>
          `${i + 1}. ${r.name} · 综合 ${r.compositeScore} · ${r.highlight} · ${r.summary}`,
      ),
    );
  }
  if (leaderboards.installerTop5.length > 0) {
    lines.push("安装师：");
    lines.push(
      ...leaderboards.installerTop5.map(
        (r, i) =>
          `${i + 1}. ${r.name} · 综合 ${r.compositeScore} · ${r.highlight} · ${r.summary}`,
      ),
    );
  }

  if (
    leaderboards.storeCompositeTop5.length > 0 ||
    leaderboards.storeTotalAmountTop5.length > 0 ||
    leaderboards.storeOrderedAmountTop5.length > 0
  ) {
    lines.push("", "【门店前5】");
  }
  if (leaderboards.storeCompositeTop5.length > 0) {
    lines.push("门店综合：");
    lines.push(
      ...leaderboards.storeCompositeTop5.map(
        (r, i) =>
          `${i + 1}. ${r.store} · 综合 ${r.compositeScore} · 总盘 ${formatDispatchMoney(r.netTotalAmount)} · 下单 ${formatDispatchMoney(r.orderedAmount)} · 待退单 ${r.pendingRefundCount} · 已退单 ${r.confirmedRefundCount} · 售后 ${formatDispatchMoney(r.afterSalesAmount)} · ${r.summary}`,
      ),
    );
  }
  if (leaderboards.storeTotalAmountTop5.length > 0) {
    lines.push("总订单额：");
    lines.push(
      ...leaderboards.storeTotalAmountTop5.map(
        (r, i) =>
          `${i + 1}. ${r.store} · ${formatDispatchMoney(r.netTotalAmount)} · ${r.summary}`,
      ),
    );
  }
  if (leaderboards.storeOrderedAmountTop5.length > 0) {
    lines.push("下单额：");
    lines.push(
      ...leaderboards.storeOrderedAmountTop5.map(
        (r, i) =>
          `${i + 1}. ${r.store} · ${formatDispatchMoney(r.orderedAmount)} · ${r.summary}`,
      ),
    );
  }
  return lines;
}

export function formatDesignerSummaryText(
  summary: DesignerPeriodSummary,
  options?: { ratingMetric?: "badReview" | "lowDimension" },
): string[] {
  const ratingLine =
    options?.ratingMetric === "lowDimension"
      ? `维度低评 ${summary.lowDimensionTotal} 单`
      : `验收差评 ${summary.badReviewTotal} 单`;
  const lines = [
    "【设计师环节】",
    summary.sectionSummary,
    `在途 ${summary.inProgressTotal} 单 · 超时 ${summary.timeoutTotal} 单 · 退单 ${summary.refundTotal} 单 · ${ratingLine}`,
  ];
  if (summary.topPerformers.length > 0) {
    lines.push(
      "表现优秀：",
      ...summary.topPerformers.map(
        (r) =>
          `- ${r.name} · 第 ${r.rank}/${r.totalRanked} · 综合 ${r.compositeScore} · ${r.highlight} · ${r.summary}`,
      ),
    );
  }
  if (summary.needsImprovement.length > 0) {
    lines.push(
      "待加强：",
      ...summary.needsImprovement.map(
        (r) =>
          `- ${r.name} · 第 ${r.rank}/${r.totalRanked} · 综合 ${r.compositeScore}${r.weakness ? ` · 短板 ${r.weakness}` : ""} · ${r.summary}`,
      ),
    );
  }
  if (summary.topConversion.length > 0) {
    lines.push(
      "转化前5：",
      ...summary.topConversion.map(
        (r, i) =>
          `${i + 1}. ${r.name} · ${formatPerformanceConversion(r.rate)} · 下单 ${formatDispatchMoney(r.orderedAmount)}`,
      ),
    );
  }
  return lines;
}
