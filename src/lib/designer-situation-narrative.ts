import { formatDispatchMoney } from "./dispatch-totals";
import type { DispatcherEvaluationRow } from "./evaluation-stats";
import type { PeriodSelection } from "./period-filter";
import type { Order } from "./types";

export interface DesignerSituationNarrative {
  title: string;
  periodHint: string;
  sections: { heading: string; items: string[] }[];
  footnote: string;
}

const MIN_REFUND_SAMPLE = 3;
const MIN_CONVERSION_SAMPLE = 5;
const BOTTOM_TIER_SIZE = 3;

function dataRows(rows: DispatcherEvaluationRow[]): DispatcherEvaluationRow[] {
  return rows.filter((r) => !r.isWorkflowSummary && r.total > 0);
}

export function designerSituationPeriodScopeLabel(
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
      return "全部";
    default:
      return "本期";
  }
}

function formatMoneyBrief(amount: number): string {
  if (amount <= 0) return "¥0";
  if (amount >= 10_000) {
    const wan = amount / 10_000;
    const text =
      wan >= 100 ? wan.toFixed(0) : wan >= 10 ? wan.toFixed(1) : wan.toFixed(2);
    return `约${text}万元`;
  }
  return formatDispatchMoney(amount);
}

function refundCount(row: DispatcherEvaluationRow): number {
  return row.pendingRefund.count + row.confirmedRefund.count;
}

function refundRatePercent(row: DispatcherEvaluationRow): number {
  if (row.total <= 0) return 0;
  return (refundCount(row) / row.total) * 100;
}

function amountConversionRate(row: DispatcherEvaluationRow): number | null {
  if (row.total < MIN_CONVERSION_SAMPLE) return null;
  return row.orderConversionRate;
}

function rankDescending(
  rows: DispatcherEvaluationRow[],
  value: (row: DispatcherEvaluationRow) => number,
): Map<string, number> {
  const sorted = [...rows].sort((a, b) => value(b) - value(a));
  const ranks = new Map<string, number>();
  sorted.forEach((row, index) => ranks.set(row.key, index + 1));
  return ranks;
}

function worstCompositeNames(
  rows: DispatcherEvaluationRow[],
  take = BOTTOM_TIER_SIZE,
): string[] {
  if (rows.length === 0) return [];
  const byTotal = rankDescending(rows, (r) => r.totalAmount);
  const byOrdered = rankDescending(rows, (r) => r.ordered.amount);
  return [...rows]
    .map((row) => ({
      row,
      score:
        (byTotal.get(row.key) ?? rows.length) +
        (byOrdered.get(row.key) ?? rows.length),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, take)
    .map((x) => x.row.label);
}

function inferRefundReasonHint(
  orders: Order[],
  designerName: string,
): string | null {
  let priceHits = 0;
  for (const order of orders) {
    if (order.designer !== designerName) continue;
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

function pickTop(
  rows: DispatcherEvaluationRow[],
  value: (row: DispatcherEvaluationRow) => number,
): DispatcherEvaluationRow | null {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map(value));
  if (max <= 0) return null;
  return rows.find((r) => value(r) === max) ?? null;
}

function formatNameList(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]}、${names[1]}`;
  return `${names.slice(0, -1).join("、")}、${names[names.length - 1]}`;
}

export function buildDesignerSituationNarrative(
  rows: DispatcherEvaluationRow[],
  orders: Order[],
  period: PeriodSelection,
  periodLabel: string,
): DesignerSituationNarrative {
  const scope = designerSituationPeriodScopeLabel(period);
  const title = `「${scope}」总设计情况评价`;
  const data = dataRows(rows);

  const overview: string[] = [];
  const refund: string[] = [];
  const followUp: string[] = [];
  const afterSales: string[] = [];

  if (data.length === 0) {
    return {
      title,
      periodHint: periodLabel,
      sections: [
        {
          heading: "总设计情况",
          items: ["当前周期与权限范围内暂无设计师订单数据。"],
        },
      ],
      footnote:
        "按订单 designer 归集 · 合计金额=四桶之和 · 转化率=已下单金额÷合计金额 · 退单率含待退单与已退单",
    };
  }

  const topTotal = pickTop(data, (r) => r.totalAmount);
  const topNotOrdered = pickTop(data, (r) => r.notOrdered.amount);

  if (topTotal) {
    if (
      topNotOrdered &&
      topNotOrdered.key === topTotal.key &&
      topNotOrdered.notOrdered.amount > 0
    ) {
      overview.push(
        `${topTotal.label}的总订单金额最高（${formatMoneyBrief(topTotal.totalAmount)}），未下单金额亦最高（${formatMoneyBrief(topNotOrdered.notOrdered.amount)}），共 ${topTotal.total} 单。`,
      );
    } else {
      overview.push(
        `${topTotal.label}的总订单金额最高（${formatMoneyBrief(topTotal.totalAmount)}），共 ${topTotal.total} 单。`,
      );
      if (topNotOrdered && topNotOrdered.notOrdered.amount > 0) {
        overview.push(
          `${topNotOrdered.label}的未下单金额最高（${formatMoneyBrief(topNotOrdered.notOrdered.amount)}，${topNotOrdered.notOrdered.count} 单）。`,
        );
      }
    }
  }

  const conversionCandidates = data
    .map((row) => ({ row, rate: amountConversionRate(row) }))
    .filter((x): x is { row: DispatcherEvaluationRow; rate: number } =>
      x.rate != null,
    )
    .sort((a, b) => b.rate - a.rate || b.row.total - a.row.total);

  if (conversionCandidates.length > 0) {
    const best = conversionCandidates[0];
    const lowVolume = best.row.total < 10;
    overview.push(
      `${best.row.label}的下单转化率最高，达 ${best.rate.toFixed(1)}%（已下单 ${formatMoneyBrief(best.row.ordered.amount)} ÷ 合计 ${formatMoneyBrief(best.row.totalAmount)}）${lowVolume ? "，但存量订单偏少" : ""}。`,
    );
  }

  const topVolume = pickTop(data, (r) => r.total);
  if (topVolume && topVolume.key !== topTotal?.key) {
    const highNotOrdered = topVolume.notOrdered.count >= 3;
    overview.push(
      `${topVolume.label}的总订单数最多（${topVolume.total} 单）${highNotOrdered ? `，未下单 ${topVolume.notOrdered.count} 单` : ""}。`,
    );
  } else if (topVolume && topVolume.notOrdered.count >= 3) {
    overview.push(
      `${topVolume.label}未下单 ${topVolume.notOrdered.count} 单，在途跟进量较大。`,
    );
  }

  const refundRateRows = data
    .filter((r) => r.total >= MIN_REFUND_SAMPLE && refundCount(r) > 0)
    .sort(
      (a, b) =>
        refundRatePercent(b) - refundRatePercent(a) ||
        refundCount(b) - refundCount(a),
    );

  if (refundRateRows.length > 0) {
    const top = refundRateRows[0];
    const hint = inferRefundReasonHint(orders, top.label);
    let line = `${top.label}的退单率最高，为 ${refundRatePercent(top).toFixed(2)}%（${top.total} 单中 ${refundCount(top)} 单退单）`;
    if (top.confirmedRefund.amount > 0) {
      line += `，退单金额 ${formatMoneyBrief(top.confirmedRefund.amount)}`;
    }
    line += hint ? `，需关注退单原因（${hint}）` : "，需关注退单原因";
    line += "。";
    refund.push(line);
  }

  const refundAmountRows = [...data]
    .filter((r) => r.confirmedRefund.count > 0)
    .sort(
      (a, b) =>
        b.confirmedRefund.amount - a.confirmedRefund.amount ||
        b.confirmedRefund.count - a.confirmedRefund.count,
    );

  if (refundAmountRows.length > 0) {
    const top = refundAmountRows[0];
    if (top.key !== refundRateRows[0]?.key) {
      refund.push(
        `${top.label}的退单数 ${top.confirmedRefund.count} 单，退单金额 ${formatMoneyBrief(top.confirmedRefund.amount)}，金额影响较大。`,
      );
    }
  }

  const lagging = worstCompositeNames(data, BOTTOM_TIER_SIZE);
  if (lagging.length > 0) {
    followUp.push(
      `${formatNameList(lagging)}等总订单金额与已下单金额均偏后，需加强派单与转化跟进。`,
    );
  }

  const lowNotOrdered = [...data]
    .sort(
      (a, b) =>
        a.notOrdered.count - b.notOrdered.count ||
        a.notOrdered.amount - b.notOrdered.amount,
    )
    .slice(0, BOTTOM_TIER_SIZE)
    .filter((r) => r.total >= 1);

  if (lowNotOrdered.length > 0 && data.length > BOTTOM_TIER_SIZE) {
    followUp.push(
      `未下单笔数最少（后 ${BOTTOM_TIER_SIZE} 名）：${formatNameList(lowNotOrdered.map((r) => r.label))}，需关注工作安排与接单饱和度。`,
    );
  }

  const withAfterSales = data
    .filter((r) => r.afterSalesAmount > 0)
    .sort((a, b) => b.afterSalesAmount - a.afterSalesAmount);

  if (withAfterSales.length === 0) {
    afterSales.push("本期大部分设计师无售后金额产生。");
  } else {
    const parts = withAfterSales.map(
      (r) => `${r.label}（${formatDispatchMoney(r.afterSalesAmount)}）`,
    );
    afterSales.push(
      `本期大部分设计师无售后或金额较低；${parts.join("、")} 有售后记录（数据可能未录全，后续补充）。`,
    );
  }

  const sections: { heading: string; items: string[] }[] = [];
  if (overview.length > 0) {
    sections.push({ heading: "总设计情况", items: overview });
  }
  if (refund.length > 0) {
    sections.push({ heading: "退单情况分析", items: refund });
  }
  if (followUp.length > 0) {
    sections.push({ heading: "靠后与未下单关注", items: followUp });
  }
  if (afterSales.length > 0) {
    sections.push({ heading: "售后与金额", items: afterSales });
  }

  return {
    title,
    periodHint: periodLabel,
    sections,
    footnote:
      "按订单 designer 归集 · 合计金额=四桶之和 · 未下单量=原始未下单 · 转化率=已下单金额÷合计金额（≥5单） · 退单率=（待退单+已退单）笔数÷总单数（≥3单）",
  };
}

export function formatDesignerSituationNarrativeText(
  narrative: DesignerSituationNarrative,
): string {
  const lines = [narrative.title, `统计周期：${narrative.periodHint}`, ""];
  let index = 1;
  for (const section of narrative.sections) {
    lines.push(`${section.heading}：`);
    for (const item of section.items) {
      lines.push(`${index}. ${item}`);
      index += 1;
    }
    lines.push("");
  }
  lines.push(narrative.footnote);
  return lines.join("\n").trim();
}
