import {
  getEffectiveAcceptanceRatings,
  isBadReviewStar,
  orderHasBadAcceptanceReview,
  orderHasLowDimensionRating,
} from "./acceptance-rating";
import { aggregatePersonRatings, filterDeliveryOrders } from "./customer-ratings";
import { STORES } from "./designers";
import { computeAggregateTotalAmount, computeOrderAmountConversionRate } from "./aggregate-metric-rates";
import { classifyOrderAmount } from "./order-amount";
import { orderBelongsToDispatcherStore } from "./order-store-attribution";
import { getDispatcherEvaluationRows } from "./evaluation-stats";
import { getDispatcherPerformanceRows } from "./dispatcher-performance";
import { getDesignerPerformanceRows,
  type DesignerPerformanceRow,
} from "./designer-performance";
import {
  filterOrdersByPeriod,
  filterSupplementsByPeriod,
  type PeriodSelection,
} from "./period-filter";
import type { StaffRecord } from "./staff-roster";
import { sumSupplementAmount } from "./supplement-utils";
import type { Order, StoreName, SupplementOrder } from "./types";

export const MIN_PERSON_RANK_SAMPLE = 5;
export const MIN_STORE_RANK_ORDERS = 3;

/** 派单人 80/15/5 · 设计师 65/15/20 · 安装师 0/30/70 */
export const ROLE_DIMENSION_WEIGHTS = {
  dispatcher: { output: 0.8, efficiency: 0.15, quality: 0.05 },
  designer: { output: 0.65, efficiency: 0.15, quality: 0.2 },
  installer: { output: 0, efficiency: 0.3, quality: 0.7 },
} as const;

export const STORE_VALUE_WEIGHTS = { totalAmount: 0.55, orderedAmount: 0.45 };
export const STORE_COMPOSITE_BLEND = { value: 0.68, quality: 0.32 };

export interface RoleScoreEntry {
  name: string;
  compositeScore: number;
  outputScore: number;
  efficiencyScore: number;
  qualityScore: number;
  summary: string;
  /** 主展示指标（如总订单额、下单额、星级） */
  highlight: string;
}

export interface StoreScoreEntry {
  store: StoreName;
  /** 四桶金额合计（与看板「合计」列一致） */
  grossTotalAmount: number;
  netTotalAmount: number;
  orderedAmount: number;
  pendingRefundCount: number;
  pendingRefundAmount: number;
  confirmedRefundCount: number;
  confirmedRefundAmount: number;
  afterSalesAmount: number;
  valueScore: number;
  qualityScore: number;
  compositeScore: number;
  summary: string;
}

export interface SmartLeaderboards {
  dispatcherTop5: RoleScoreEntry[];
  designerTop5: RoleScoreEntry[];
  installerTop5: RoleScoreEntry[];
  storeTotalAmountTop5: StoreScoreEntry[];
  storeOrderedAmountTop5: StoreScoreEntry[];
  storeCompositeTop5: StoreScoreEntry[];
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function normMinMax(values: number[], value: number): number {
  const positive = values.filter((v) => v > 0);
  if (value <= 0 || positive.length === 0) return 0;
  const min = Math.min(...positive);
  const max = Math.max(...positive);
  if (max === min) return 100;
  return clampScore(((value - min) / (max - min)) * 100);
}

function normInverseMinMax(values: number[], value: number): number {
  if (value <= 0) return 100;
  const positive = values.filter((v) => v > 0);
  if (positive.length === 0) return 100;
  const min = Math.min(...positive);
  const max = Math.max(...positive);
  if (max === min) return 100;
  return clampScore(((max - value) / (max - min)) * 100);
}

function computeComposite(
  output: number,
  efficiency: number,
  quality: number,
  weights: { output: number; efficiency: number; quality: number },
): number {
  return clampScore(
    output * weights.output +
      efficiency * weights.efficiency +
      quality * weights.quality,
  );
}

/** 总订单额：未下单 + 已下单 − 待退单 − 已退单 */
export function computeNetTotalOrderAmount(
  orders: Order[],
  supplements: SupplementOrder[],
): number {
  let net = 0;
  for (const order of orders) {
    const parts = classifyOrderAmount(order, supplements);
    net +=
      parts.notOrdered.amount +
      parts.ordered.amount -
      parts.pendingRefund.amount -
      parts.confirmedRefund.amount;
  }
  return Math.max(0, net);
}

function countDesignerBadReviews(orders: Order[], designer: string): number {
  return orders.filter(
    (o) => o.designer === designer && orderHasBadAcceptanceReview(o),
  ).length;
}

function getWeakestDimension(scores: {
  output: number;
  efficiency: number;
  quality: number;
}): "output" | "efficiency" | "quality" {
  const dims: { key: "output" | "efficiency" | "quality"; value: number }[] = [
    { key: "output", value: scores.output },
    { key: "efficiency", value: scores.efficiency },
    { key: "quality", value: scores.quality },
  ];
  dims.sort((a, b) => a.value - b.value);
  return dims[0]!.key;
}

const DESIGNER_WEAKNESS_LABEL: Record<
  "output" | "efficiency" | "quality",
  string
> = {
  output: "产值（下单额）",
  efficiency: "效率（转化/出图）",
  quality: "质量（超时/退单/售后）",
};

/** 设计师个人智能评价（含排名靠后说明） */
export function buildDesignerPersonInsight(
  entry: RoleScoreEntry,
  rank: number,
  totalRanked: number,
): string {
  const scores = {
    output: entry.outputScore,
    efficiency: entry.efficiencyScore,
    quality: entry.qualityScore,
    composite: entry.compositeScore,
  };
  const rankLabel = `第 ${rank}/${totalRanked}`;
  const isBottomTier = totalRanked >= 4 && rank > totalRanked - 3;
  const isLowComposite = entry.compositeScore < 50;

  if (isBottomTier || isLowComposite) {
    const weak = getWeakestDimension(scores);
    const weakLabel = DESIGNER_WEAKNESS_LABEL[weak];
    if (weak === "output") {
      return `综合${rankLabel}，下单额偏弱，建议加强跟进转化与增补签单。`;
    }
    if (weak === "efficiency") {
      return `综合${rankLabel}，主要短板在${weakLabel}，需压缩在途与出图周期。`;
    }
    return `综合${rankLabel}，${weakLabel}扣分明显，请强化节点质量管控。`;
  }

  return buildRoleSummary("designer", scores, rank);
}

/** 设计师环节整体总结（点名优秀/偏弱） */
export function buildDesignerSectionSummary(input: {
  eligibleCount: number;
  inProgressTotal: number;
  timeoutTotal: number;
  refundTotal: number;
  badReviewTotal: number;
  topPerformers: { name: string; compositeScore: number }[];
  needsImprovement: { name: string; compositeScore: number }[];
}): string {
  const {
    eligibleCount,
    inProgressTotal,
    timeoutTotal,
    refundTotal,
    badReviewTotal,
    topPerformers,
    needsImprovement,
  } = input;

  if (eligibleCount === 0) {
    return "样本不足，暂无综合排名，建议积累单量后再评估。";
  }

  const parts: string[] = [];

  if (topPerformers.length > 0 && needsImprovement.length > 0) {
    parts.push(
      `${topPerformers.map((p) => p.name).join("、")} 表现优秀`,
      `${needsImprovement.map((p) => p.name).join("、")} 相对偏弱`,
    );
  } else if (topPerformers.length > 0) {
    parts.push(`${topPerformers.map((p) => p.name).join("、")} 综合领先，环节整体较好`);
  } else if (needsImprovement.length > 0) {
    parts.push(`${needsImprovement.map((p) => p.name).join("、")} 需重点帮扶`);
  }

  const health: string[] = [];
  if (timeoutTotal >= 3) health.push(`超时 ${timeoutTotal} 单`);
  if (refundTotal >= 2) health.push(`退单 ${refundTotal} 单`);
  if (badReviewTotal >= 2) health.push(`验收差评 ${badReviewTotal} 单`);
  if (inProgressTotal >= 12) health.push(`在途 ${inProgressTotal} 单负荷偏高`);

  if (health.length > 0) {
    parts.push(`环节风险：${health.join("、")}`);
  } else if (parts.length === 0) {
    parts.push("设计师环节运行平稳，建议保持转化与交付节奏");
  }

  return `${parts.join("；")}。`;
}

function buildRoleSummary(
  role: keyof typeof ROLE_DIMENSION_WEIGHTS,
  scores: { output: number; efficiency: number; quality: number; composite: number },
  rank: number,
): string {
  const { output, efficiency, quality, composite } = scores;
  const isTop = rank <= 3 && composite >= 60;

  if (role === "dispatcher") {
    if (isTop && output >= 70) return "综合领先，总订单盘贡献突出。";
    if (output >= 70 && quality < 50)
      return "总盘做大，需压退单与签约超时。";
    if (output >= 70 && efficiency < 50)
      return "订单储备充足，下单转化仍有提升空间。";
    if (quality < 45) return "质量指标偏弱，请重点管控退单与超时。";
    if (efficiency < 45) return "转化效率一般，建议提升签约与下单推进。";
    return "经营平稳，持续关注转化与退单。";
  }

  if (role === "designer") {
    if (isTop && output >= 70) return "下单额领先，设计交付表现优秀。";
    if (output >= 70 && quality < 50)
      return "下单额突出，需关注超时、售后与退单。";
    if (quality >= 70 && output >= 55) return "产值与质量双优，设计交付标杆。";
    if (output >= 55 && efficiency >= 55 && quality >= 55)
      return "三维较均衡，可持续放大下单优势。";
    if (output < 45 && efficiency < 45)
      return "产值与效率双弱，建议优先清在途、促转化。";
    if (efficiency < 45) return "转化与出图效率偏慢，建议优化在途管控。";
    if (quality < 45) return "质量端异常偏多，请加强节点跟进。";
    if (output < 45) return "下单额偏弱，建议加强跟进与转化。";
    return "整体平稳，可继续提升下单转化与交付质量。";
  }

  // installer
  if (isTop && quality >= 70) return "安装质量口碑好，客户评价领先。";
  if (quality >= 70) return "交付质量稳定，客户满意度较高。";
  if (efficiency < 45) return "安装节奏偏慢，待扫码与周期需压缩。";
  if (quality < 45) return "验收评分偏低，需加强现场交付质量。";
  return "交付表现平稳，建议保持扫码与安装时效。";
}

function buildStoreSummary(
  entry: StoreScoreEntry,
  rank: number,
): string {
  const grossBase =
    entry.grossTotalAmount > 0 ? entry.grossTotalAmount : entry.netTotalAmount;
  const conversion =
    computeOrderAmountConversionRate(entry.orderedAmount, grossBase) ?? 0;
  const riskParts: string[] = [];
  if (entry.pendingRefundCount > 0) {
    riskParts.push(`待退单 ${entry.pendingRefundCount} 单`);
  }
  if (entry.confirmedRefundCount > 0) {
    riskParts.push(`已退单 ${entry.confirmedRefundCount} 单`);
  }
  if (entry.afterSalesAmount > 0) {
    riskParts.push(`售后金 ${formatMoneyShort(entry.afterSalesAmount)}`);
  }

  if (rank <= 2 && entry.compositeScore >= 65 && riskParts.length === 0) {
    return "总盘与下单双优，退单与售后可控，门店经营标杆。";
  }
  if (rank <= 2 && entry.compositeScore >= 60) {
    return `产值领先${riskParts.length ? `，需关注${riskParts.join("、")}` : ""}。`;
  }
  if (entry.netTotalAmount > entry.orderedAmount * 1.5 && conversion < 40) {
    return `蓄水盘大，下单落地偏弱${riskParts.length ? `，${riskParts.join("、")}拖累综合` : ""}。`;
  }
  if (riskParts.length > 0 && entry.qualityScore < 60) {
    return `产值尚可，但${riskParts.join("、")}拉低综合质量。`;
  }
  if (entry.orderedAmount > 0 && conversion >= 55) {
    return "转化落地强，下单贡献突出。";
  }
  return "经营平稳，建议平衡拓盘、下单与退单售后管控。";
}

function computeStoreQualityScore(input: {
  pendingRefundCount: number;
  confirmedRefundCount: number;
  pendingRefundAmount: number;
  confirmedRefundAmount: number;
  afterSalesAmount: number;
  netTotalAmount: number;
  grossTotalAmount: number;
}): number {
  const grossBase = Math.max(input.grossTotalAmount, 1);
  const refundExposure =
    ((input.pendingRefundAmount + input.confirmedRefundAmount) / grossBase) * 100;
  const afterSalesPenalty = input.afterSalesAmount / 10000;

  return clampScore(
    100 -
      input.pendingRefundCount * 8 -
      input.confirmedRefundCount * 10 -
      refundExposure * 0.35 -
      afterSalesPenalty * 4,
  );
}

function buildStoreEntries(
  orders: Order[],
  supplements: SupplementOrder[],
  staffRecords: StaffRecord[],
): StoreScoreEntry[] {
  const entries: StoreScoreEntry[] = [];

  for (const store of STORES) {
    const storeOrders = orders.filter((o) =>
      orderBelongsToDispatcherStore(o, store, staffRecords),
    );
    if (storeOrders.length < MIN_STORE_RANK_ORDERS) continue;

    let notOrdered = 0;
    let ordered = 0;
    let pendingRefundCount = 0;
    let pendingRefundAmount = 0;
    let confirmedRefundCount = 0;
    let confirmedRefundAmount = 0;
    let afterSalesAmount = 0;

    for (const order of storeOrders) {
      const parts = classifyOrderAmount(order, supplements);
      notOrdered += parts.notOrdered.amount;
      ordered += parts.ordered.amount;

      if (order.status === "待退单") {
        pendingRefundCount += 1;
        pendingRefundAmount += parts.pendingRefund.amount;
      }
      if (order.status === "已退单") {
        confirmedRefundCount += 1;
        confirmedRefundAmount += parts.confirmedRefund.amount;
      }
      if (order.afterSalesAmount != null && order.afterSalesAmount > 0) {
        afterSalesAmount += order.afterSalesAmount;
      }
    }

    const grossTotalAmount = computeAggregateTotalAmount({
      notOrderedAmount: notOrdered,
      orderedAmount: ordered,
      pendingRefundAmount,
      confirmedRefundAmount,
    });
    const netTotalAmount = Math.max(
      0,
      notOrdered + ordered - pendingRefundAmount - confirmedRefundAmount,
    );
    const qualityScore = computeStoreQualityScore({
      pendingRefundCount,
      confirmedRefundCount,
      pendingRefundAmount,
      confirmedRefundAmount,
      afterSalesAmount,
      netTotalAmount,
      grossTotalAmount,
    });

    entries.push({
      store,
      grossTotalAmount,
      netTotalAmount,
      orderedAmount: ordered,
      pendingRefundCount,
      pendingRefundAmount,
      confirmedRefundCount,
      confirmedRefundAmount,
      afterSalesAmount,
      valueScore: 0,
      qualityScore,
      compositeScore: 0,
      summary: "",
    });
  }

  if (entries.length === 0) return [];

  const grossTotals = entries.map((e) => e.grossTotalAmount);
  const orderedAmounts = entries.map((e) => e.orderedAmount);

  return entries.map((entry) => {
    const valueScore = clampScore(
      normMinMax(grossTotals, entry.grossTotalAmount) *
        STORE_VALUE_WEIGHTS.totalAmount +
        normMinMax(orderedAmounts, entry.orderedAmount) *
          STORE_VALUE_WEIGHTS.orderedAmount,
    );
    const compositeScore = clampScore(
      valueScore * STORE_COMPOSITE_BLEND.value +
        entry.qualityScore * STORE_COMPOSITE_BLEND.quality,
    );
    return {
      ...entry,
      valueScore,
      compositeScore,
    };
  });
}

function formatMoneyShort(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${Math.round(amount).toLocaleString("zh-CN")}`;
}

interface InstallerRawMetrics {
  name: string;
  completedCount: number;
  pendingScanCount: number;
  avgInstallDays: number | null;
  avgStars: number;
  badReviewCount: number;
  lowDimensionCount: number;
  ratedCount: number;
}

function buildInstallerRawMetrics(orders: Order[]): InstallerRawMetrics[] {
  const map = new Map<string, InstallerRawMetrics & { installDays: number[] }>();

  for (const order of filterDeliveryOrders(orders)) {
    const name = order.installation?.installerName?.trim() || "未指定";
    const existing = map.get(name) ?? {
      name,
      completedCount: 0,
      pendingScanCount: 0,
      avgInstallDays: null,
      avgStars: 0,
      badReviewCount: 0,
      lowDimensionCount: 0,
      ratedCount: 0,
      installDays: [],
    };

    if (order.status === "已安装" || order.status === "已验收") {
      existing.completedCount += 1;
    }
    if (order.status === "已安装") {
      existing.pendingScanCount += 1;
    }
    if (order.stageIntervalDays?.toInstalled != null) {
      existing.installDays.push(order.stageIntervalDays.toInstalled);
    }

    const ratings = getEffectiveAcceptanceRatings(order);
    if (order.status === "已验收" && ratings) {
      existing.ratedCount += 1;
      existing.avgStars =
        (existing.avgStars * (existing.ratedCount - 1) + ratings.installTeam) /
        existing.ratedCount;
      if (orderHasBadAcceptanceReview(order)) existing.badReviewCount += 1;
      if (
        orderHasLowDimensionRating(order) &&
        isBadReviewStar(ratings.installTeam)
      ) {
        existing.lowDimensionCount += 1;
      }
    }

    map.set(name, existing);
  }

  return [...map.values()].map(({ installDays, ...rest }) => ({
    ...rest,
    avgInstallDays:
      installDays.length > 0
        ? installDays.reduce((a, b) => a + b, 0) / installDays.length
        : null,
  }));
}

function scoreDispatchers(
  evalRows: ReturnType<typeof getDispatcherEvaluationRows>,
  perfRows: ReturnType<typeof getDispatcherPerformanceRows>,
): RoleScoreEntry[] {
  const perfByName = new Map(perfRows.map((r) => [r.label, r]));
  const eligible = evalRows.filter((r) => r.total >= MIN_PERSON_RANK_SAMPLE);
  if (eligible.length === 0) return [];

  const netTotals = eligible.map(
    (r) =>
      r.notOrdered.amount + r.ordered.amount - r.pendingRefund.amount,
  );
  const dispatchCounts = eligible.map(
    (r) => perfByName.get(r.label)?.newDispatchCount ?? r.total,
  );
  const conversions = eligible.map((r) => r.orderConversionRate ?? 0);
  const signRates = eligible.map((r) => {
    const perf = perfByName.get(r.label);
    if (!perf || perf.newDispatchCount <= 0) return 0;
    return perf.signedContractAmount > 0
      ? (perf.signedContractAmount / perf.depositTotal) * 100
      : 0;
  });

  const raw = eligible.map((row, i) => {
    const perf = perfByName.get(row.label);
    const netTotal = Math.max(0, netTotals[i]!);
    const refundRate =
      row.total > 0
        ? ((row.pendingRefund.count + row.confirmedRefund.count) / row.total) *
          100
        : 0;
    const signTimeout = perf?.signTimeoutCount ?? 0;

    const outputScore = clampScore(
      normMinMax(netTotals, netTotal) * 0.9 +
        normMinMax(dispatchCounts, dispatchCounts[i]!) * 0.1,
    );
    const efficiencyScore = clampScore(
      normMinMax(conversions, conversions[i]!) * 0.6 +
        normMinMax(signRates, signRates[i]!) * 0.4,
    );
    const qualityScore = clampScore(100 - signTimeout * 8 - refundRate * 30);

    const compositeScore = computeComposite(
      outputScore,
      efficiencyScore,
      qualityScore,
      ROLE_DIMENSION_WEIGHTS.dispatcher,
    );

    return {
      name: row.label,
      compositeScore,
      outputScore,
      efficiencyScore,
      qualityScore,
      highlight: formatMoneyShort(netTotal),
    };
  });

  return raw
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 5)
    .map((entry, i) => ({
      ...entry,
      summary: buildRoleSummary("dispatcher", {
        output: entry.outputScore,
        efficiency: entry.efficiencyScore,
        quality: entry.qualityScore,
        composite: entry.compositeScore,
      }, i + 1),
    }));
}

function computeAllDesignerScores(
  rows: DesignerPerformanceRow[],
  orders: Order[],
  supplements: SupplementOrder[],
): RoleScoreEntry[] {
  const eligible = rows.filter((r) => !r.sampleTooSmall);
  if (eligible.length === 0) return [];

  const orderedAmounts = eligible.map((r) => r.orderedAmount);
  const supplementAmounts = eligible.map((row) => {
    let sum = 0;
    for (const order of orders.filter((o) => o.designer === row.label)) {
      sum += sumSupplementAmount(supplements, order.id);
    }
    return sum;
  });
  const conversions = eligible.map((r) => r.orderConversionRate ?? 0);
  const drawDays = eligible.map((r) => r.avgDrawDays ?? 0);
  const inProgressLoads = eligible.map((r) =>
    r.inProgressCount + r.orderedCount > 0
      ? r.inProgressCount / (r.inProgressCount + r.orderedCount)
      : 0,
  );

  return eligible.map((row, i) => {
    const workload = row.inProgressCount + row.orderedCount;
    const transferRate = workload > 0 ? row.transferOut / workload : 0;
    const badReviews = countDesignerBadReviews(orders, row.label);

    const outputScore = clampScore(
      normMinMax(orderedAmounts, orderedAmounts[i]!) * 0.85 +
        normMinMax(supplementAmounts, supplementAmounts[i]!) * 0.15,
    );
    const efficiencyScore = clampScore(
      normMinMax(conversions, conversions[i]!) * 0.5 +
        normInverseMinMax(drawDays, drawDays[i]!) * 0.3 +
        normInverseMinMax(inProgressLoads, inProgressLoads[i]!) * 0.2,
    );
    const qualityScore = clampScore(
      100 -
        row.timeoutCount * 8 -
        row.refundCount * 10 -
        (row.afterSalesAmount / 10000) * 5 -
        badReviews * 15 -
        transferRate * 100 * 0.2,
    );

    const compositeScore = computeComposite(
      outputScore,
      efficiencyScore,
      qualityScore,
      ROLE_DIMENSION_WEIGHTS.designer,
    );

    return {
      name: row.label,
      compositeScore,
      outputScore,
      efficiencyScore,
      qualityScore,
      highlight: formatMoneyShort(row.orderedAmount),
      summary: "",
    };
  });
}

function scoreDesigners(
  rows: DesignerPerformanceRow[],
  orders: Order[],
  supplements: SupplementOrder[],
): RoleScoreEntry[] {
  const raw = computeAllDesignerScores(rows, orders, supplements);
  if (raw.length === 0) return [];

  return raw
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 5)
    .map((entry, i) => ({
      ...entry,
      summary: buildDesignerPersonInsight(entry, i + 1, raw.length),
    }));
}

export function buildDesignerRankInsights(
  rows: DesignerPerformanceRow[],
  orders: Order[],
  supplements: SupplementOrder[],
): {
  ranked: (RoleScoreEntry & { rank: number; totalRanked: number })[];
  bottomRanked: (RoleScoreEntry & {
    rank: number;
    totalRanked: number;
    summary: string;
    weakness: string;
  })[];
} {
  const raw = computeAllDesignerScores(rows, orders, supplements);
  const sorted = [...raw].sort((a, b) => b.compositeScore - a.compositeScore);
  const totalRanked = sorted.length;
  const ranked = sorted.map((entry, i) => ({
    ...entry,
    rank: i + 1,
    totalRanked,
    summary: buildDesignerPersonInsight(entry, i + 1, totalRanked),
  }));

  if (totalRanked < 4) {
    return { ranked, bottomRanked: [] };
  }

  const bottomSlice = ranked.slice(-3);
  const bottomRanked = bottomSlice.map((entry) => {
    const weak = getWeakestDimension({
      output: entry.outputScore,
      efficiency: entry.efficiencyScore,
      quality: entry.qualityScore,
    });
    return {
      ...entry,
      summary: buildDesignerPersonInsight(entry, entry.rank, totalRanked),
      weakness: DESIGNER_WEAKNESS_LABEL[weak],
    };
  });

  return { ranked, bottomRanked };
}

function scoreInstallers(orders: Order[]): RoleScoreEntry[] {
  const rawMetrics = buildInstallerRawMetrics(orders);
  const ratingAggregates = aggregatePersonRatings(orders, "installer");
  const ratingByName = new Map(
    ratingAggregates.map((a) => [a.personName, a]),
  );

  const eligible = rawMetrics.filter(
    (m) => m.name !== "未指定" && m.completedCount >= MIN_PERSON_RANK_SAMPLE,
  );
  if (eligible.length === 0) {
    return ratingAggregates
      .filter((a) => a.count >= MIN_PERSON_RANK_SAMPLE)
      .slice(0, 5)
      .map((a, i) => ({
        name: a.personName,
        compositeScore: clampScore((a.avgStars / 5) * 100),
        outputScore: 0,
        efficiencyScore: 50,
        qualityScore: clampScore((a.avgStars / 5) * 100),
        highlight: `${a.avgStars.toFixed(1)} 星`,
        summary: buildRoleSummary(
          "installer",
          {
            output: 0,
            efficiency: 50,
            quality: clampScore((a.avgStars / 5) * 100),
            composite: clampScore((a.avgStars / 5) * 100),
          },
          i + 1,
        ),
      }));
  }

  const installDays = eligible.map((m) => m.avgInstallDays ?? 0);
  const pendingRates = eligible.map((m) =>
    m.completedCount > 0 ? m.pendingScanCount / m.completedCount : 0,
  );
  const starScores = eligible.map((m) => {
    const agg = ratingByName.get(m.name);
    return agg?.avgStars ?? m.avgStars;
  });
  const badRates = eligible.map((m) =>
    m.ratedCount > 0 ? m.badReviewCount / m.ratedCount : 0,
  );
  const lowDimRates = eligible.map((m) =>
    m.ratedCount > 0 ? m.lowDimensionCount / m.ratedCount : 0,
  );

  const raw = eligible.map((row, i) => {
    const stars = starScores[i] ?? 0;
    const efficiencyScore = clampScore(
      normInverseMinMax(installDays, installDays[i]!) * 0.6 +
        normInverseMinMax(pendingRates, pendingRates[i]!) * 0.4,
    );
    const qualityScore = clampScore(
      normMinMax(starScores, stars) * 0.6 +
        normInverseMinMax(badRates, badRates[i]!) * 0.3 +
        normInverseMinMax(lowDimRates, lowDimRates[i]!) * 0.1,
    );
    const compositeScore = computeComposite(
      0,
      efficiencyScore,
      qualityScore,
      ROLE_DIMENSION_WEIGHTS.installer,
    );

    return {
      name: row.name,
      compositeScore,
      outputScore: 0,
      efficiencyScore,
      qualityScore,
      highlight: stars > 0 ? `${stars.toFixed(1)} 星` : "—",
    };
  });

  return raw
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 5)
    .map((entry, i) => ({
      ...entry,
      summary: buildRoleSummary("installer", {
        output: entry.outputScore,
        efficiency: entry.efficiencyScore,
        quality: entry.qualityScore,
        composite: entry.compositeScore,
      }, i + 1),
    }));
}

export function buildSmartLeaderboards(
  orders: Order[],
  supplements: SupplementOrder[],
  period: PeriodSelection,
  staffRecords: StaffRecord[],
  designerNames: string[] | null = null,
  dispatcherNames: string[] | null = null,
): SmartLeaderboards {
  const periodOrders = filterOrdersByPeriod(orders, period);
  const periodSupplements = filterSupplementsByPeriod(supplements, period);

  const evalRows = getDispatcherEvaluationRows(
    periodOrders,
    periodSupplements,
    dispatcherNames,
    staffRecords,
  ).filter((r) => !r.isWorkflowSummary);

  const perfRows = getDispatcherPerformanceRows(
    orders,
    supplements,
    dispatcherNames,
    staffRecords,
    period,
  );

  const designerRows = getDesignerPerformanceRows(
    orders,
    supplements,
    designerNames,
    undefined,
    staffRecords,
    period,
  );

  const storeEntries = buildStoreEntries(
    periodOrders,
    periodSupplements,
    staffRecords,
  );

  const storeTotalAmountTop5 = [...storeEntries]
    .sort((a, b) => b.grossTotalAmount - a.grossTotalAmount)
    .slice(0, 5)
    .map((entry, i) => ({
      ...entry,
      summary: buildStoreSummary(entry, i + 1),
    }));

  const storeOrderedAmountTop5 = [...storeEntries]
    .sort((a, b) => b.orderedAmount - a.orderedAmount)
    .slice(0, 5)
    .map((entry, i) => ({
      ...entry,
      summary: buildStoreSummary(entry, i + 1),
    }));

  const storeCompositeTop5 = [...storeEntries]
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 5)
    .map((entry, i) => ({
      ...entry,
      summary: buildStoreSummary(entry, i + 1),
    }));

  return {
    dispatcherTop5: scoreDispatchers(evalRows, perfRows),
    designerTop5: scoreDesigners(designerRows, periodOrders, periodSupplements),
    installerTop5: scoreInstallers(periodOrders),
    storeTotalAmountTop5,
    storeOrderedAmountTop5,
    storeCompositeTop5,
  };
}
