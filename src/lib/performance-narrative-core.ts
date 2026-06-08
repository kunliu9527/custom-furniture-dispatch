import { formatDispatchMoney } from "./dispatch-totals";
import type { DispatcherEvaluationRow } from "./evaluation-stats";
import type { PeriodSelection } from "./period-filter";
import type { Order } from "./types";

export interface PerformanceSituationNarrative {
  title: string;
  periodHint: string;
  scopeHint?: string;
  intro: string;
  sections: { heading: string; items: string[] }[];
  footnote: string;
}

export const MIN_REFUND_SAMPLE = 3;
export const MIN_CONVERSION_SAMPLE = 5;
export const CONVERSION_WARNING_THRESHOLD = 30;
export const REFUND_WARNING_THRESHOLD = 30;
export const AFTER_SALES_RATIO_THRESHOLD = 5;
export const RANK_TOP_SIZE = 3;

export const PERSON_NARRATIVE_INTRO =
  "本报告对同一对象综合合计业绩、转化率、存量订单与均单值进行评价；转化率 = 已下单金额 ÷ 合计金额。";

export const STORE_NARRATIVE_INTRO =
  "店面数据按派单人所属门店汇总（跨店单计入派单人店），评价口径同个人版。";

export const PERSON_NARRATIVE_FOOTNOTE =
  "转化率 = 已下单金额 ÷ 合计金额 · 平均下单值 = 已下单金额 ÷ 已下单数量 · 存量订单 = 未下单金额 + 待退单金额 · 退单率 = 退单金额 ÷ 合计金额 · 排名已剔除合计为 0 · 转化评价需 ≥5 单";

export const DESIGNER_NARRATIVE_FOOTNOTE =
  `按订单 designer 归集 · ${PERSON_NARRATIVE_FOOTNOTE}`;

export const DISPATCHER_NARRATIVE_FOOTNOTE =
  `按订单 dispatcher 归集 · ${PERSON_NARRATIVE_FOOTNOTE}`;

export const STORE_NARRATIVE_FOOTNOTE =
  `${STORE_NARRATIVE_INTRO} · 若店面名册设计师不足 3 人，排名仅供参考`;

/** @deprecated */
export const NARRATIVE_INTRO = PERSON_NARRATIVE_INTRO;
/** @deprecated */
export const NARRATIVE_FOOTNOTE = DESIGNER_NARRATIVE_FOOTNOTE;

export type LevelTag = "high" | "mid" | "low" | "none" | "insufficient";
export type TotalTier = "top" | "mid" | "bottom";

export interface EntityEvaluationMetrics {
  row: DispatcherEvaluationRow;
  totalRank: number;
  conversionRate: number | null;
  conversionLevel: LevelTag;
  pipeline: number;
  pipelineLevel: LevelTag;
  avgOrderLevel: LevelTag;
  totalTier: TotalTier;
}

export function performanceNarrativePeriodScopeLabel(
  period: PeriodSelection,
): string {
  switch (period.preset) {
    case "thisWeek":
      return "本周";
    case "lastWeek":
      return "上周";
    case "thisMonth":
    case "lastMonth":
    case "custom":
      return "本月";
    case "all":
      return "全部时间";
    default:
      return "本期";
  }
}

export function narrativeDataRows(
  rows: DispatcherEvaluationRow[],
): DispatcherEvaluationRow[] {
  return rows.filter((r) => !r.isWorkflowSummary && r.totalAmount > 0);
}

export function pipelineAmount(row: DispatcherEvaluationRow): number {
  return row.notOrdered.amount + row.pendingRefund.amount;
}

export function refundAmount(row: DispatcherEvaluationRow): number {
  return row.pendingRefund.amount + row.confirmedRefund.amount;
}

export function refundRatePercent(row: DispatcherEvaluationRow): number {
  if (row.totalAmount <= 0) return 0;
  return (refundAmount(row) / row.totalAmount) * 100;
}

export function amountConversionRate(
  row: DispatcherEvaluationRow,
): number | null {
  if (row.total < MIN_CONVERSION_SAMPLE || row.orderConversionRate == null) {
    return null;
  }
  return row.orderConversionRate;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function levelByMedian(
  value: number,
  values: number[],
  noneWhenZero = false,
): LevelTag {
  if (noneWhenZero && value <= 0) return "none";
  const m = median(values.filter((v) => v > 0));
  if (m <= 0) return value > 0 ? "mid" : "low";
  if (value >= m * 1.15) return "high";
  if (value <= m * 0.85) return "low";
  return "mid";
}

function conversionLevel(rate: number | null): LevelTag {
  if (rate == null) return "insufficient";
  if (rate >= 50) return "high";
  if (rate >= CONVERSION_WARNING_THRESHOLD) return "mid";
  return "low";
}

function totalTier(rank: number, count: number): TotalTier {
  const bottomSize = Math.ceil(count / 3);
  const topSize = Math.ceil(count / 3);
  if (rank <= topSize) return "top";
  if (rank > count - bottomSize) return "bottom";
  return "mid";
}

function levelLabel(level: LevelTag): string {
  switch (level) {
    case "high":
      return "偏高";
    case "mid":
      return "中等";
    case "low":
      return "偏低";
    case "none":
      return "暂无";
    case "insufficient":
      return "样本不足";
    default:
      return "";
  }
}

export function computeEntityMetrics(
  data: DispatcherEvaluationRow[],
): EntityEvaluationMetrics[] {
  const byTotal = sortRowsBy(data, (r) => r.totalAmount);
  const pipelineValues = data.map((r) => pipelineAmount(r));
  const avgValues = data.map((r) => r.averageOrderAmount ?? 0);

  return byTotal.map((row, index) => {
    const rate = amountConversionRate(row);
    return {
      row,
      totalRank: index + 1,
      conversionRate: rate,
      conversionLevel: conversionLevel(rate),
      pipeline: pipelineAmount(row),
      pipelineLevel: levelByMedian(pipelineAmount(row), pipelineValues, true),
      avgOrderLevel: levelByMedian(
        row.averageOrderAmount ?? 0,
        avgValues,
        true,
      ),
      totalTier: totalTier(index + 1, data.length),
    };
  });
}

export function formatMoneyWan(amount: number): string {
  if (amount <= 0) return "0";
  const wan = amount / 10_000;
  return wan >= 100 ? wan.toFixed(0) : wan >= 10 ? wan.toFixed(1) : wan.toFixed(2);
}

export function formatWanYuan(amount: number): string {
  if (amount <= 0) return "0 万元";
  return `约 ${formatMoneyWan(amount)} 万元`;
}

export function formatWanYuanPlain(amount: number): string {
  if (amount <= 0) return "0";
  return formatMoneyWan(amount);
}

export function formatMoneyBrief(amount: number): string {
  if (amount <= 0) return "¥0";
  if (amount >= 10_000) {
    return `约${formatMoneyWan(amount)}万元`;
  }
  return formatDispatchMoney(amount);
}

export function formatAverageOrderWanPerUnit(
  row: DispatcherEvaluationRow,
): string {
  if (row.ordered.count <= 0 || row.averageOrderAmount == null) {
    return "暂无";
  }
  if (row.averageOrderAmount <= 0) return "暂无";
  const wan = row.averageOrderAmount / 10_000;
  const text =
    wan >= 10 ? wan.toFixed(1) : wan >= 1 ? wan.toFixed(1) : wan.toFixed(2);
  return `约 ${text} 万元/单`;
}

export function formatNameList(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]}、${names[1]}`;
  return `${names.slice(0, -1).join("、")}、${names[names.length - 1]}`;
}

export function sortRowsBy(
  rows: DispatcherEvaluationRow[],
  value: (row: DispatcherEvaluationRow) => number,
  descending = true,
): DispatcherEvaluationRow[] {
  return [...rows].sort((a, b) => {
    const diff = value(b) - value(a);
    return descending ? diff : -diff;
  });
}

export function pickTop(
  rows: DispatcherEvaluationRow[],
  value: (row: DispatcherEvaluationRow) => number,
): DispatcherEvaluationRow | null {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map(value));
  if (max <= 0) return null;
  return rows.find((r) => value(r) === max) ?? null;
}

export function teamConversionPercent(
  rows: DispatcherEvaluationRow[],
): number | null {
  const totalAmount = rows.reduce((sum, r) => sum + r.totalAmount, 0);
  const orderedAmount = rows.reduce((sum, r) => sum + r.ordered.amount, 0);
  if (totalAmount <= 0) return null;
  return (orderedAmount / totalAmount) * 100;
}

function conversionLevelText(level: LevelTag, rate: number | null): string {
  if (rate != null) {
    return `转化率 ${rate.toFixed(1)}%（${levelLabel(level)}）`;
  }
  return "转化率样本不足（＜5 单）";
}

export function synthesizeEntityConclusion(
  metrics: EntityEvaluationMetrics,
  context: { isTopSection: boolean; isStore: boolean },
): string {
  const { totalTier, conversionLevel, pipelineLevel, avgOrderLevel } = metrics;
  const intakeWord = context.isStore ? "派单" : "派单";

  if (
    totalTier === "bottom" &&
    conversionLevel === "high" &&
    (pipelineLevel === "low" || pipelineLevel === "none") &&
    (avgOrderLevel === "low" || avgOrderLevel === "none")
  ) {
    return `能转化但总量、均单与存量均偏低，主要问题在订单承接不足，建议加强${intakeWord}与客源匹配。`;
  }

  if (totalTier === "bottom" && conversionLevel === "low") {
    return `接单与转化均偏弱，需重点关注手上订单进度，并综合评估${intakeWord}与跟单支持。`;
  }

  if (conversionLevel === "low") {
    if (pipelineLevel === "high" || pipelineLevel === "mid") {
      return "转化偏弱且存量不低，需重点关注手上订单进度情况，并排查报价、方案或客户意向卡点。";
    }
    if (context.isStore) {
      return "需区域经理介入，重点关注手上订单进度情况。";
    }
    return "需重点关注手上订单进度情况。";
  }

  if (context.isTopSection) {
    if (totalTier === "top" && pipelineLevel === "high") {
      return "业绩总量领先，但未下单与待退单存量偏大，需在保持质量的同时加快手上订单推进。";
    }
    if (
      totalTier === "top" &&
      conversionLevel === "high" &&
      (pipelineLevel === "low" || pipelineLevel === "none")
    ) {
      return "业绩与转化表现均衡，可作内部标杆。";
    }
    if (conversionLevel === "mid" && pipelineLevel !== "high") {
      return "接单量与转化较均衡，可重点复制其跟单节奏。";
    }
    if (conversionLevel === "mid" && pipelineLevel === "high") {
      return "订单池较大，需重点关注手上订单进度，加快存量消化。";
    }
    return "整体表现位于前列，请继续保持并关注存量订单消化。";
  }

  if (totalTier === "bottom" && conversionLevel === "mid") {
    return "业绩排名后段，需重点关注手上订单进度并加强跟单推进。";
  }

  return "建议结合存量与转化情况，重点关注手上订单进度。";
}

export function formatEntityEvaluationParagraph(
  metrics: EntityEvaluationMetrics,
  options: { isTopSection: boolean; isStore: boolean },
): string {
  const { row } = metrics;
  const rankWord = options.isStore ? "店面" : "";
  const intro = `${row.label}（合计排名第 ${metrics.totalRank}${rankWord ? "" : ""}）`;

  const body =
    `合计 ${formatWanYuan(row.totalAmount)} / ${row.total} 单，` +
    `已下单 ${formatWanYuanPlain(row.ordered.amount)} 万元，` +
    `${conversionLevelText(metrics.conversionLevel, metrics.conversionRate)}；` +
    `存量 ${formatWanYuan(metrics.pipeline)}（未下单 ${formatWanYuanPlain(row.notOrdered.amount)} 万元，` +
    `待退单 ${formatWanYuanPlain(row.pendingRefund.amount)} 万元，${levelLabel(metrics.pipelineLevel)}），` +
    `均单 ${formatAverageOrderWanPerUnit(row)}（${levelLabel(metrics.avgOrderLevel)}）。` +
    `综合评价：${synthesizeEntityConclusion(metrics, options)}`;

  return `${intro}：${body}`;
}

export function buildTeamOverviewItem(
  data: DispatcherEvaluationRow[],
  entityLabel: string,
  teamScope: string,
  isStore: boolean,
): string {
  const teamTotal = data.reduce((sum, r) => sum + r.totalAmount, 0);
  const teamOrdered = data.reduce((sum, r) => sum + r.ordered.amount, 0);
  const teamRate = teamConversionPercent(data);
  const metrics = computeEntityMetrics(data);

  const lowConversion = metrics
    .filter((m) => m.conversionLevel === "low")
    .map((m) => m.row.label);

  let line =
    `统计周期内，${teamScope}合计总订单金额 ${formatWanYuanPlain(teamTotal)} 万元，` +
    `合计已下单 ${formatWanYuanPlain(teamOrdered)} 万元`;
  if (teamRate != null) {
    line += `，整体下单转化率 ${teamRate.toFixed(1)}%`;
  }
  line += `。共 ${data.length} ${isStore ? "家店面" : `个${entityLabel}`}有有效数据`;

  if (lowConversion.length > 0) {
    const unit = isStore ? "家" : "人";
    line += `，其中转化率低于 ${CONVERSION_WARNING_THRESHOLD}% 的有 ${formatNameList(lowConversion)} 等 ${lowConversion.length} ${unit}`;
    line += isStore
      ? "，需区域经理介入并重点关注手上订单进度情况"
      : "，需重点关注手上订单进度情况";
  }
  line += "。";
  return line;
}

export function selectWatchListMetrics(
  metrics: EntityEvaluationMetrics[],
  topKeys: Set<string>,
): EntityEvaluationMetrics[] {
  const watch = metrics.filter((m) => {
    if (topKeys.has(m.row.key)) return false;
    if (m.totalTier === "bottom") return true;
    if (m.conversionLevel === "low") return true;
    return false;
  });

  const seen = new Set<string>();
  return watch
    .filter((m) => {
      if (seen.has(m.row.key)) return false;
      seen.add(m.row.key);
      return true;
    })
    .sort(
      (a, b) =>
        b.totalRank - a.totalRank ||
        (a.conversionRate ?? 100) - (b.conversionRate ?? 100),
    );
}

export function inferRefundReasonHintForPerson(
  orders: Order[],
  entityName: string,
  matchPerson: (order: Order, name: string) => boolean,
): string | null {
  let priceHits = 0;
  for (const order of orders) {
    if (!matchPerson(order, entityName)) continue;
    if (order.status !== "已退单" && order.status !== "待退单") continue;
    const texts = [
      ...(order.workflowRemarks ?? []).map((r) => r.text),
      order.workflowRemark ?? "",
    ].filter(Boolean);
    if (texts.some((t) => /价格|价高|报价/.test(t))) priceHits += 1;
  }
  if (priceHits >= 2) return "多为价格问题";
  if (priceHits >= 1) return "含价格因素";
  return null;
}

export function buildOtherSituationsItems(
  data: DispatcherEvaluationRow[],
  orders: Order[],
  entityLabel: string,
  matchPerson?: (order: Order, name: string) => boolean,
  isStore = false,
): string[] {
  const items: string[] = [];

  const totalRefund = data.reduce((sum, r) => sum + refundAmount(r), 0);
  const refundEntities = data.filter((r) => refundAmount(r) > 0);
  const topRefundAmount = pickTop(data, (r) => refundAmount(r));
  const refundRateRows = data
    .filter((r) => r.total >= MIN_REFUND_SAMPLE && refundAmount(r) > 0)
    .sort(
      (a, b) =>
        refundRatePercent(b) - refundRatePercent(a) ||
        refundAmount(b) - refundAmount(a),
    );

  if (totalRefund > 0 || refundEntities.length > 0) {
    let refundLine = `期间内退单总金额 ${formatMoneyBrief(totalRefund)}，涉及退单的${entityLabel}共 ${refundEntities.length} 个`;
    if (topRefundAmount && refundAmount(topRefundAmount) > 0) {
      refundLine += `。退单金额最高的为 ${topRefundAmount.label}（${formatMoneyBrief(refundAmount(topRefundAmount))}）`;
    }
    if (refundRateRows.length > 0) {
      const topRate = refundRateRows[0];
      refundLine += `，退单率最高的为 ${topRate.label}（退单率 ${refundRatePercent(topRate).toFixed(1)}% = 退单金额 ÷ 合计金额 × 100%）`;
      if (matchPerson) {
        const hint = inferRefundReasonHintForPerson(
          orders,
          topRate.label,
          matchPerson,
        );
        if (hint) refundLine += `，${hint}`;
      }
    }
    refundLine += "。请重点关注价格、方案或沟通环节。";
    items.push(refundLine);
  } else {
    items.push(`期间内暂无${entityLabel}退单金额记录。`);
  }

  const withAfterSales = data
    .filter((r) => r.afterSalesAmount > 0)
    .sort((a, b) => b.afterSalesAmount - a.afterSalesAmount);
  const totalAfterSales = data.reduce((sum, r) => sum + r.afterSalesAmount, 0);

  if (withAfterSales.length === 0) {
    items.push(
      `有售后记录的${entityLabel}共 0 个，售后总金额 0 元。交付质量良好；若个别${isStore ? "店面" : "门店"}未录入售后，请后续补充。`,
    );
  } else {
    const topAfterSales = withAfterSales[0];
    let afterLine = `有售后记录的${entityLabel}共 ${withAfterSales.length} 个，售后总金额 ${formatDispatchMoney(totalAfterSales)}`;
    afterLine += `。售后金额最高的为 ${topAfterSales.label}（${formatDispatchMoney(topAfterSales.afterSalesAmount)}）`;
    if (totalAfterSales <= 500) {
      afterLine += "。整体售后金额极低，交付质量良好；若数据不全，请后续补充";
    } else {
      afterLine += "。若数据不全，请后续补充";
    }
    afterLine += "。";
    items.push(afterLine);
  }

  return items;
}

export function formatPerformanceSituationNarrativeText(
  narrative: PerformanceSituationNarrative,
): string {
  const lines = [
    narrative.title,
    `统计周期：${narrative.periodHint}${narrative.scopeHint ? ` · 所属：${narrative.scopeHint}` : ""}`,
    "",
  ];
  if (narrative.intro) {
    lines.push(narrative.intro, "");
  }
  let index = 1;
  for (const section of narrative.sections) {
    lines.push(`${section.heading}：`);
    for (const item of section.items) {
      lines.push(`${index}. ${item}`);
      index += 1;
    }
    lines.push("");
  }
  lines.push(`数据口径说明：${narrative.footnote}`);
  return lines.join("\n").trim();
}

export function buildEntityCentricSections(
  data: DispatcherEvaluationRow[],
  orders: Order[],
  options: {
    entityLabel: string;
    teamScope: string;
    isStore: boolean;
    matchPerson?: (order: Order, name: string) => boolean;
  },
): { heading: string; items: string[] }[] {
  const metrics = computeEntityMetrics(data);
  const topMetrics = metrics.slice(0, RANK_TOP_SIZE);
  const topKeys = new Set(topMetrics.map((m) => m.row.key));
  const watchMetrics = selectWatchListMetrics(metrics, topKeys);

  const sections: { heading: string; items: string[] }[] = [
    {
      heading: "团队概览",
      items: [
        buildTeamOverviewItem(
          data,
          options.entityLabel,
          options.teamScope,
          options.isStore,
        ),
      ],
    },
    {
      heading: options.isStore
        ? "业绩前列店面综合评价"
        : `业绩前列${options.entityLabel}综合评价`,
      items: topMetrics.map((m) =>
        formatEntityEvaluationParagraph(m, {
          isTopSection: true,
          isStore: options.isStore,
        }),
      ),
    },
  ];

  if (watchMetrics.length > 0) {
    sections.push({
      heading: options.isStore
        ? "需重点关注店面综合评价"
        : `需重点关注${options.entityLabel}综合评价`,
      items: watchMetrics.map((m) =>
        formatEntityEvaluationParagraph(m, {
          isTopSection: false,
          isStore: options.isStore,
        }),
      ),
    });
  }

  const otherItems = buildOtherSituationsItems(
    data,
    orders,
    options.entityLabel,
    options.matchPerson,
    options.isStore,
  );
  if (otherItems.length > 0) {
    sections.push({ heading: "其他情况", items: otherItems });
  }

  return sections;
}

// legacy exports used elsewhere
export function conversionRankedRows(
  rows: DispatcherEvaluationRow[],
): DispatcherEvaluationRow[] {
  return rows
    .filter((r) => amountConversionRate(r) != null)
    .sort(
      (a, b) =>
        (b.orderConversionRate ?? 0) - (a.orderConversionRate ?? 0) ||
        b.totalAmount - a.totalAmount,
    );
}

export function formatRateEntry(label: string, rate: number): string {
  return `${label}（${rate.toFixed(1)}%）`;
}
