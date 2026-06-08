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

export const PERSON_NARRATIVE_INTRO = "";

export const STORE_NARRATIVE_INTRO = "";

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

function formatWanPlain(amount: number): string {
  return formatWanYuanPlain(amount);
}

interface EntityAnalysisSnapshot {
  orderedShare: number;
  pipelineShare: number;
  notOrderedShare: number;
  pendingShare: number;
  refundShare: number;
  teamConversion: number | null;
}

function buildAnalysisSnapshot(
  m: EntityEvaluationMetrics,
  teamConversion: number | null,
): EntityAnalysisSnapshot {
  const total = m.row.totalAmount || 1;
  return {
    orderedShare: m.row.ordered.amount / total,
    pipelineShare: m.pipeline / total,
    notOrderedShare: m.row.notOrdered.amount / total,
    pendingShare: m.row.pendingRefund.amount / total,
    refundShare: refundAmount(m.row) / total,
    teamConversion,
  };
}

function pctText(ratio: number): string {
  return `${(ratio * 100).toFixed(0)}%`;
}

function formatFactsBrief(m: EntityEvaluationMetrics): string {
  const conv =
    m.conversionRate != null ? `${m.conversionRate.toFixed(1)}%` : "样本不足";
  return (
    `总单额 ${formatWanPlain(m.row.totalAmount)} 万、成交 ${formatWanPlain(m.row.ordered.amount)} 万（转化率 ${conv}），` +
    `存量 ${formatWanPlain(m.pipeline)} 万`
  );
}

function analyzeTopPerformer(
  m: EntityEvaluationMetrics,
  all: EntityEvaluationMetrics[],
  isStore: boolean,
): string {
  const snap = buildAnalysisSnapshot(m, teamConversionPercent(all.map((x) => x.row)));
  const leader = all[0];
  const subject = isStore ? "店面" : "设计师";
  const clauses: string[] = [];

  const convBelowTeam =
    m.conversionRate != null &&
    snap.teamConversion != null &&
    m.conversionRate < snap.teamConversion - 2;
  const convAboveTeam =
    m.conversionRate != null &&
    snap.teamConversion != null &&
    m.conversionRate > snap.teamConversion + 2;

  if (m.totalRank === 1) {
    if (m.conversionLevel === "low" || convBelowTeam) {
      clauses.push(
        `总量第一，但转化率${m.conversionLevel === "low" ? "明显偏弱" : "未跑赢团队均值"}，排名靠前更多来自接单规模而非落地效率`,
      );
    } else if (m.conversionLevel === "high" && snap.pipelineShare < 0.35) {
      clauses.push("总量与转化同步领先，属于真正能打的前排");
    } else {
      clauses.push("总量领先，转化处于可接受区间，是本期业绩支柱");
    }
  } else if (m.totalRank === 2) {
    if (leader && m.row.totalAmount < leader.row.totalAmount * 0.75) {
      clauses.push(`与榜首差距较大，需扩大${isStore ? "门店" : "个人"}接单盘子`);
    } else if (convAboveTeam) {
      clauses.push("转化优于团队均值，跟单质量较好");
    } else {
      clauses.push("体量处第二梯队，整体贡献稳定");
    }
  } else {
    if (m.conversionLevel === "low") {
      clauses.push(
        `虽进前三，但转化率仅 ${m.conversionRate?.toFixed(1) ?? "—"}%，更多靠总单额堆积进前排，落地能力偏弱`,
      );
    } else if (convAboveTeam) {
      clauses.push("转化优于多数同事，具备可复制的跟单经验");
    } else {
      clauses.push("贡献位居前列，但与前两名相比仍有追赶空间");
    }
  }

  if (m.conversionLevel === "low") {
    clauses.push(
      `未成交约占 ${pctText(snap.notOrderedShare)}，客户多停在方案或报价阶段，应逐单排查卡点`,
    );
  } else if (snap.pipelineShare >= 0.45) {
    if (m.avgOrderLevel === "high") {
      clauses.push(
        `未成交与待退单合计占 ${pctText(snap.pipelineShare)}，且客单不低，单笔推进慢会直接拖慢回款`,
      );
    } else {
      clauses.push(
        `未成交存量占 ${pctText(snap.notOrderedShare)}，接单不少但落地偏慢，需提高跟进频次`,
      );
    }
  } else if (snap.pipelineShare >= 0.3 && m.conversionLevel !== "high") {
    clauses.push(
      `仍有约 ${pctText(snap.pipelineShare)} 预算在途，要把"接单优势"尽快兑现为成交`,
    );
  }

  if (snap.refundShare >= 0.15) {
    clauses.push(
      `退单占总量 ${pctText(snap.refundShare)}，需同步关注报价与沟通，避免前排业绩被退单侵蚀`,
    );
  }

  if (m.conversionLevel === "high" && snap.pipelineShare < 0.25 && m.totalRank <= 2) {
    clauses.push(`建议提炼${subject}跟单方法，在团队内部分享`);
  } else if (m.conversionLevel === "low") {
    clauses.push("宜由管理层介入辅导谈单与方案节奏");
  } else if (snap.pipelineShare >= 0.35) {
    clauses.push("优先推动高意向客户落单，缩短存量周转");
  } else if (clauses.length <= 2) {
    clauses.push("保持现有节奏，同时关注新增客源与存量平衡");
  }

  return `${m.row.label}（第 ${m.totalRank}）：${formatFactsBrief(m)}。${clauses.join("；")}。`;
}

function analyzeWatchPerformer(
  m: EntityEvaluationMetrics,
  all: EntityEvaluationMetrics[],
  isStore: boolean,
): string {
  const snap = buildAnalysisSnapshot(m, teamConversionPercent(all.map((x) => x.row)));
  const clauses: string[] = [];
  const intakeWord = isStore ? "派单" : "派单";

  const onWatchReasons: string[] = [];
  if (m.totalTier === "bottom") onWatchReasons.push("业绩排名后段");
  if (m.conversionLevel === "low") onWatchReasons.push("转化率不达标");
  const reasonIntro =
    onWatchReasons.length > 0
      ? `列入跟进因${onWatchReasons.join("、")}。`
      : "";

  if (m.conversionLevel === "low" && snap.pipelineShare >= 0.5) {
    clauses.push(
      `转化率仅 ${m.conversionRate?.toFixed(1) ?? "—"}%，却积累了 ${formatWanPlain(m.pipeline)} 万存量，典型"只进不出"——接单不算少，但几乎未转化为成交`,
    );
    clauses.push(`除逐单跟进外，需复盘${intakeWord}质量与客资匹配，必要时调整派单或加强帮扶`);
  } else if (m.conversionLevel === "low" && snap.notOrderedShare >= 0.5) {
    clauses.push(
      `超半数预算仍处未成交，说明客户意向或方案推进受阻，并非单纯"单少"`,
    );
    clauses.push("应重点梳理报价、方案与客户决策链，逐一推动落单");
  } else if (m.conversionLevel === "low") {
    clauses.push(
      `转化率 ${m.conversionRate?.toFixed(1) ?? "—"}% 低于 30% 警戒线，在手订单推进效率不足`,
    );
    if (snap.refundShare >= 0.1) {
      clauses.push(`同时退单占 ${pctText(snap.refundShare)}，报价或沟通环节可能存在问题`);
    }
    clauses.push(isStore ? "需区域介入，持续盯紧在手订单" : "需持续盯紧在手订单直至落单或明确流失");
  } else if (
    m.conversionLevel === "high" &&
    m.totalTier === "bottom" &&
    snap.orderedShare < 0.45
  ) {
    clauses.push(
      `转化率达 ${m.conversionRate?.toFixed(1) ?? "—"}%，说明"卖得动"，但总单额与成交仅 ${formatWanPlain(m.row.ordered.amount)} 万，问题在${intakeWord}不足而非转化`,
    );
    clauses.push(`应加大${intakeWord}力度、拓展客源，把转化优势转化为业绩增量`);
  } else if (
    m.conversionLevel === "high" &&
    m.totalTier !== "top" &&
    snap.pipelineShare < 0.35
  ) {
    clauses.push(
      `转化表现 ${m.conversionRate?.toFixed(1) ?? "—"}% 优于多数同事，但总量与成交体量一般，存量不多`,
    );
    clauses.push("短板在接单规模——建议挖掘客源、提高派单饱和度，现有订单继续保持高转化");
  } else if (
    m.totalTier === "bottom" &&
    m.conversionLevel === "mid" &&
    (m.avgOrderLevel === "low" || m.avgOrderLevel === "none")
  ) {
    clauses.push(
      `业绩垫底，总单量 ${m.row.total} 单、客单偏低，${intakeWord}与成交规模均不足`,
    );
    clauses.push(
      `转化 ${m.conversionRate?.toFixed(1) ?? "—"}% 尚可，说明并非完全"不会卖"，关键是缺单、缺大单`,
    );
    clauses.push(`需从${intakeWord}与客源两端同时发力`);
  } else if (m.totalTier === "bottom" && m.conversionLevel === "mid") {
    clauses.push(
      `排名后段，转化 ${m.conversionRate?.toFixed(1) ?? "—"}% 中等，但总量有限`,
    );
    if (snap.pipelineShare >= 0.3) {
      clauses.push(`存量 ${formatWanPlain(m.pipeline)} 万尚未释放，跟单提速可直接改善业绩`);
    } else {
      clauses.push(`需同步提升${intakeWord}与跟单深度`);
    }
  } else if (m.totalTier === "bottom") {
    clauses.push(`综合表现处团队后 1/3，总量与转化均未形成有效支撑`);
    clauses.push(`需明确是${intakeWord}不足、转化偏弱还是两者兼有，对症制定改进计划`);
  } else if (m.conversionLevel === "mid" && snap.pipelineShare >= 0.4) {
    clauses.push(
      `转化率尚可但存量 ${formatWanPlain(m.pipeline)} 万偏高，存在"有单难落"风险`,
    );
    clauses.push("宜逐单锁定高意向客户，避免存量长期沉淀");
  } else {
    clauses.push("指标呈现结构性短板，需结合存量与转化制定专项跟进计划");
  }

  return `${m.row.label}（第 ${m.totalRank}）：${formatFactsBrief(m)}。${reasonIntro}${clauses.join("；")}。`;
}

function formatTopEntityBrief(
  metrics: EntityEvaluationMetrics,
  all: EntityEvaluationMetrics[],
  isStore: boolean,
): string {
  return analyzeTopPerformer(metrics, all, isStore);
}

function formatWatchEntityBrief(
  metrics: EntityEvaluationMetrics,
  all: EntityEvaluationMetrics[],
  isStore: boolean,
): string {
  return analyzeWatchPerformer(metrics, all, isStore);
}

export function buildTeamOverviewItem(
  data: DispatcherEvaluationRow[],
  entityLabel: string,
  _teamScope: string,
  isStore: boolean,
): string {
  const teamTotal = data.reduce((sum, r) => sum + r.totalAmount, 0);
  const teamOrdered = data.reduce((sum, r) => sum + r.ordered.amount, 0);
  const teamRate = teamConversionPercent(data);
  const metrics = computeEntityMetrics(data);

  const lowConversion = metrics
    .filter((m) => m.conversionLevel === "low")
    .map((m) => m.row.label);

  const scopeWord = isStore ? "全部门店" : "团队";
  let line =
    `本期${scopeWord}总订单额 ${formatWanPlain(teamTotal)} 万，` +
    `已成交 ${formatWanPlain(teamOrdered)} 万`;
  if (teamRate != null) {
    line += `，整体转化率 ${teamRate.toFixed(1)}%`;
  }
  line += `。${data.length} ${isStore ? "家店面" : `名${entityLabel}`}有有效数据`;

  if (lowConversion.length > 0) {
    line += `，${formatNameList(lowConversion)} ${lowConversion.length} ${isStore ? "家" : "人"}转化率不足 ${CONVERSION_WARNING_THRESHOLD}%`;
    line += isStore
      ? "，需区域介入、紧盯订单推进"
      : "，说明部分设计师接单多但落地慢，需紧盯订单推进";
  } else if (teamRate != null && teamRate < CONVERSION_WARNING_THRESHOLD) {
    line += "，整体转化偏弱，团队需同步提升跟单效率";
  } else if (teamRate != null && teamRate >= 50) {
    line += "，整体转化较好，后续重点在存量消化与客源拓展";
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

export function buildRefundAfterSalesItem(
  data: DispatcherEvaluationRow[],
  orders: Order[],
  entityLabel: string,
  matchPerson?: (order: Order, name: string) => boolean,
  isStore = false,
): string {
  const parts: string[] = [];

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
    const unit = isStore ? "家店面" : `名${entityLabel}`;
    let refundLine = `本期总退单 ${formatWanPlain(totalRefund)} 万，涉及 ${refundEntities.length} ${unit}`;
    if (topRefundAmount && refundAmount(topRefundAmount) > 0) {
      const topRateRow = refundRateRows[0];
      const isBothTop =
        topRateRow && topRateRow.key === topRefundAmount.key;
      if (isBothTop) {
        let hint = "";
        if (matchPerson) {
          const raw = inferRefundReasonHintForPerson(
            orders,
            topRefundAmount.label,
            matchPerson,
          );
          if (raw === "多为价格问题") hint = "，问题多集中在价格方面";
          else if (raw === "含价格因素") hint = "，问题含价格因素";
        }
        const scope = isStore ? "各店面" : "团队";
        refundLine += `。${topRefundAmount.label} 的退单金额、退单率均为${scope}最高${hint}，需优化报价、方案与客户沟通`;
      } else {
        refundLine += `。${topRefundAmount.label} 退单金额最高（${formatWanPlain(refundAmount(topRefundAmount))} 万）`;
        if (topRateRow) {
          refundLine += `，${topRateRow.label} 退单率最高（${refundRatePercent(topRateRow).toFixed(1)}%）`;
        }
        refundLine += "，需关注价格、方案与沟通环节";
      }
    }
    refundLine += "。";
    parts.push(refundLine);
  } else {
    parts.push(`本期暂无${entityLabel}退单记录。`);
  }

  const withAfterSales = data.filter((r) => r.afterSalesAmount > 0);
  const totalAfterSales = data.reduce((sum, r) => sum + r.afterSalesAmount, 0);

  if (withAfterSales.length === 0) {
    parts.push("整体交付质量良好，后续补全相关数据即可。");
  } else {
    const unit = isStore ? "家店面" : "人";
    let afterLine = `仅 ${withAfterSales.length} ${unit}产生售后，总金额 ${formatDispatchMoney(totalAfterSales)}`;
    if (totalAfterSales <= 500) {
      afterLine += "，整体交付质量良好，后续补全相关数据即可。";
    } else {
      afterLine += "，请后续补全相关数据。";
    }
    parts.push(afterLine);
  }

  return parts.join("");
}

export function buildOtherSituationsItems(
  data: DispatcherEvaluationRow[],
  orders: Order[],
  entityLabel: string,
  matchPerson?: (order: Order, name: string) => boolean,
  isStore = false,
): string[] {
  return [
    buildRefundAfterSalesItem(data, orders, entityLabel, matchPerson, isStore),
  ];
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
      heading: "整体情况",
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
      heading: options.isStore ? "业绩靠前店面" : "业绩靠前人员",
      items: topMetrics.map((m) =>
        formatTopEntityBrief(m, metrics, options.isStore),
      ),
    },
  ];

  if (watchMetrics.length > 0) {
    sections.push({
      heading: options.isStore
        ? "重点跟进店面（附排名）"
        : "重点跟进人员（附排名）",
      items: watchMetrics.map((m) =>
        formatWatchEntityBrief(m, metrics, options.isStore),
      ),
    });
  }

  sections.push({
    heading: "退单 & 售后",
    items: [
      buildRefundAfterSalesItem(
        data,
        orders,
        options.entityLabel,
        options.matchPerson,
        options.isStore,
      ),
    ],
  });

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
