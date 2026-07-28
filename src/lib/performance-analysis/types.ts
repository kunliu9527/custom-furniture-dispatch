import type { DispatcherEvaluationRow } from "../evaluation-stats";
import type { PeriodSelection } from "../period-filter";
import type {
  LevelTag,
  PerformanceSituationNarrative,
  TotalTier,
} from "../performance-narrative-core";
import type { Order } from "../types";
import type { StaffRecord } from "../staff-roster";

/** 绩效分析维度：设计师 / 派单人 / 门店 */
export type PerformanceAnalysisRole = "designer" | "dispatcher" | "store";

export type PerformanceAnalysisEntityClass = "top" | "watch" | "middle";

export interface PerformanceAnalysisEntitySnapshot {
  key: string;
  label: string;
  subtitle?: string;
  rank: number;
  totalTier: TotalTier;
  classification: PerformanceAnalysisEntityClass;
  totalOrders: number;
  totalAmount: number;
  orderedAmount: number;
  orderedCount: number;
  notOrderedAmount: number;
  pendingRefundAmount: number;
  confirmedRefundAmount: number;
  pipelineAmount: number;
  refundAmount: number;
  refundRatePercent: number;
  conversionRate: number | null;
  averageOrderAmount: number | null;
  afterSalesAmount: number;
  conversionLevel: LevelTag;
  pipelineLevel: LevelTag;
  avgOrderLevel: LevelTag;
}

export interface PerformanceAnalysisTeamSummary {
  entityCount: number;
  totalAmount: number;
  orderedAmount: number;
  teamConversionRate: number | null;
  lowConversionLabels: string[];
}

export interface PerformanceAnalysisRefundAfterSales {
  totalRefundAmount: number;
  refundEntityCount: number;
  topRefundLabel: string | null;
  topRefundAmount: number;
  topRefundRateLabel: string | null;
  topRefundRatePercent: number | null;
  afterSalesEntityCount: number;
  totalAfterSalesAmount: number;
}

/** 结构化分析上下文，供规则引擎校验或后续 LLM 解读 */
export interface PerformanceAnalysisContext {
  role: PerformanceAnalysisRole;
  roleLabel: string;
  period: {
    preset: PeriodSelection["preset"];
    label: string;
    scopeHint?: string;
  };
  team: PerformanceAnalysisTeamSummary;
  entities: PerformanceAnalysisEntitySnapshot[];
  topPerformers: PerformanceAnalysisEntitySnapshot[];
  watchList: PerformanceAnalysisEntitySnapshot[];
  refundAfterSales: PerformanceAnalysisRefundAfterSales;
  metricDefinitions: Record<string, string>;
}

export interface PerformanceAnalysisInput {
  role: PerformanceAnalysisRole;
  rows: DispatcherEvaluationRow[];
  orders: Order[];
  period: PeriodSelection;
  periodLabel: string;
  scopeHint?: string;
  staffRecords?: StaffRecord[];
}

export interface PerformanceAnalysisResult {
  context: PerformanceAnalysisContext;
  narrative: PerformanceSituationNarrative;
  plainText: string;
}
