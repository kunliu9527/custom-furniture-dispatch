import { buildDesignerHomeStoreIndex } from "../designer-staff-store";
import type { DispatcherEvaluationRow } from "../evaluation-stats";
import {
  computeEntityMetrics,
  CONVERSION_WARNING_THRESHOLD,
  MIN_REFUND_SAMPLE,
  narrativeDataRows,
  pickTop,
  refundAmount,
  refundRatePercent,
  RANK_TOP_SIZE,
  selectWatchListMetrics,
  teamConversionPercent,
  type EntityEvaluationMetrics,
} from "../performance-narrative-core";
import type { StaffRecord } from "../staff-roster";
import type { StoreName } from "../types";
import {
  getPerformanceAnalysisConfig,
  PERFORMANCE_ANALYSIS_METRIC_DEFINITIONS,
} from "./config";
import type {
  PerformanceAnalysisContext,
  PerformanceAnalysisEntityClass,
  PerformanceAnalysisEntitySnapshot,
  PerformanceAnalysisInput,
  PerformanceAnalysisRefundAfterSales,
  PerformanceAnalysisRole,
  PerformanceAnalysisTeamSummary,
} from "./types";

function entityClass(
  m: EntityEvaluationMetrics,
  topKeys: Set<string>,
  watchKeys: Set<string>,
): PerformanceAnalysisEntityClass {
  if (topKeys.has(m.row.key)) return "top";
  if (watchKeys.has(m.row.key)) return "watch";
  return "middle";
}

function toEntitySnapshot(
  m: EntityEvaluationMetrics,
  classification: PerformanceAnalysisEntityClass,
): PerformanceAnalysisEntitySnapshot {
  return {
    key: m.row.key,
    label: m.row.label,
    subtitle: m.row.subtitle,
    rank: m.totalRank,
    totalTier: m.totalTier,
    classification,
    totalOrders: m.row.total,
    totalAmount: m.row.totalAmount,
    orderedAmount: m.row.ordered.amount,
    orderedCount: m.row.ordered.count,
    notOrderedAmount: m.row.notOrdered.amount,
    pendingRefundAmount: m.row.pendingRefund.amount,
    confirmedRefundAmount: m.row.confirmedRefund.amount,
    pipelineAmount: m.pipeline,
    refundAmount: refundAmount(m.row),
    refundRatePercent: refundRatePercent(m.row),
    conversionRate: m.conversionRate,
    averageOrderAmount: m.row.averageOrderAmount,
    afterSalesAmount: m.row.afterSalesAmount,
    conversionLevel: m.conversionLevel,
    pipelineLevel: m.pipelineLevel,
    avgOrderLevel: m.avgOrderLevel,
  };
}

function buildTeamSummary(
  data: DispatcherEvaluationRow[],
  metrics: EntityEvaluationMetrics[],
): PerformanceAnalysisTeamSummary {
  return {
    entityCount: data.length,
    totalAmount: data.reduce((sum, r) => sum + r.totalAmount, 0),
    orderedAmount: data.reduce((sum, r) => sum + r.ordered.amount, 0),
    teamConversionRate: teamConversionPercent(data),
    lowConversionLabels: metrics
      .filter((m) => m.conversionLevel === "low")
      .map((m) => m.row.label),
  };
}

function buildRefundAfterSalesSummary(
  data: DispatcherEvaluationRow[],
): PerformanceAnalysisRefundAfterSales {
  const refundEntities = data.filter((r) => refundAmount(r) > 0);
  const topRefundRow = pickTop(data, (r) => refundAmount(r));
  const refundRateRows = data
    .filter((r) => r.total >= MIN_REFUND_SAMPLE && refundAmount(r) > 0)
    .sort(
      (a, b) =>
        refundRatePercent(b) - refundRatePercent(a) ||
        refundAmount(b) - refundAmount(a),
    );
  const topRateRow = refundRateRows[0] ?? null;
  const withAfterSales = data.filter((r) => r.afterSalesAmount > 0);

  return {
    totalRefundAmount: data.reduce((sum, r) => sum + refundAmount(r), 0),
    refundEntityCount: refundEntities.length,
    topRefundLabel: topRefundRow ? topRefundRow.label : null,
    topRefundAmount: topRefundRow ? refundAmount(topRefundRow) : 0,
    topRefundRateLabel: topRateRow?.label ?? null,
    topRefundRatePercent: topRateRow
      ? refundRatePercent(topRateRow)
      : null,
    afterSalesEntityCount: withAfterSales.length,
    totalAfterSalesAmount: data.reduce((sum, r) => sum + r.afterSalesAmount, 0),
  };
}

function storesWithSmallRoster(
  rows: DispatcherEvaluationRow[],
  staffRecords: StaffRecord[],
): string[] {
  const index = buildDesignerHomeStoreIndex(staffRecords);
  return rows
    .filter((r) => {
      let count = 0;
      for (const [, homeStore] of index) {
        if (homeStore === (r.label as StoreName)) count += 1;
      }
      return count < 3;
    })
    .map((r) => r.label);
}

export function buildPerformanceAnalysisContext(
  input: PerformanceAnalysisInput,
): PerformanceAnalysisContext {
  const config = getPerformanceAnalysisConfig(input.role);
  const data = narrativeDataRows(input.rows);
  const metrics = computeEntityMetrics(data);
  const topMetrics = metrics.slice(0, RANK_TOP_SIZE);
  const topKeys = new Set(topMetrics.map((m) => m.row.key));
  const watchMetrics = selectWatchListMetrics(metrics, topKeys);
  const watchKeys = new Set(watchMetrics.map((m) => m.row.key));

  const entities = metrics.map((m) =>
    toEntitySnapshot(m, entityClass(m, topKeys, watchKeys)),
  );

  return {
    role: input.role,
    roleLabel: config.roleLabel,
    period: {
      preset: input.period.preset,
      label: input.periodLabel,
      scopeHint: input.scopeHint,
    },
    team: buildTeamSummary(data, metrics),
    entities,
    topPerformers: entities.filter((e) => e.classification === "top"),
    watchList: entities.filter((e) => e.classification === "watch"),
    refundAfterSales: buildRefundAfterSalesSummary(data),
    metricDefinitions: {
      ...PERFORMANCE_ANALYSIS_METRIC_DEFINITIONS,
      conversionWarningThreshold: `转化率低于 ${CONVERSION_WARNING_THRESHOLD}% 视为偏低`,
      ...(input.role === "store" && input.staffRecords?.length
        ? {
            smallRosterStores: storesWithSmallRoster(
              data,
              input.staffRecords,
            ).join("、"),
          }
        : {}),
    },
  };
}

export function formatPerformanceAnalysisContextJson(
  context: PerformanceAnalysisContext,
): string {
  return JSON.stringify(context, null, 2);
}

/** 将结构化上下文转为 LLM 可读摘要（不调用外部 API） */
export function formatPerformanceAnalysisContextForPrompt(
  context: PerformanceAnalysisContext,
): string {
  const lines: string[] = [
    `# 绩效分析数据（${context.roleLabel}）`,
    `统计周期：${context.period.label}${context.period.scopeHint ? ` · ${context.period.scopeHint}` : ""}`,
    "",
    "## 团队汇总",
    `- 有效${context.role === "store" ? "店面" : "人数"}：${context.team.entityCount}`,
    `- 合计金额：${context.team.totalAmount}`,
    `- 已成交金额：${context.team.orderedAmount}`,
    `- 整体转化率：${context.team.teamConversionRate?.toFixed(1) ?? "—"}%`,
  ];

  if (context.team.lowConversionLabels.length > 0) {
    lines.push(
      `- 低转化（<${CONVERSION_WARNING_THRESHOLD}%）：${context.team.lowConversionLabels.join("、")}`,
    );
  }

  lines.push("", "## 业绩靠前");
  for (const e of context.topPerformers) {
    lines.push(
      `- ${e.label}（第 ${e.rank} 名）：合计 ${e.totalAmount}，已下单 ${e.orderedAmount}，转化 ${e.conversionRate?.toFixed(1) ?? "—"}%，存量 ${e.pipelineAmount}`,
    );
  }

  if (context.watchList.length > 0) {
    lines.push("", "## 重点跟进");
    for (const e of context.watchList) {
      lines.push(
        `- ${e.label}（第 ${e.rank} 名）：合计 ${e.totalAmount}，转化 ${e.conversionRate?.toFixed(1) ?? "—"}%，存量 ${e.pipelineAmount}，退单 ${e.refundAmount}`,
      );
    }
  }

  lines.push(
    "",
    "## 退单与售后",
    `- 总退单金额：${context.refundAfterSales.totalRefundAmount}`,
    `- 售后金额：${context.refundAfterSales.totalAfterSalesAmount}`,
    "",
    "## 指标口径",
  );
  for (const [key, def] of Object.entries(context.metricDefinitions)) {
    lines.push(`- ${key}：${def}`);
  }

  return lines.join("\n");
}
