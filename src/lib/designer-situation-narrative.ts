import type { DispatcherEvaluationRow } from "./evaluation-stats";
import type { PeriodSelection } from "./period-filter";
import {
  buildPerformanceAnalysisForRole,
  type PerformanceAnalysisResult,
} from "./performance-analysis";
import {
  formatPerformanceSituationNarrativeText,
  performanceNarrativePeriodScopeLabel,
  type PerformanceSituationNarrative,
} from "./performance-narrative-core";
import type { Order } from "./types";

export type DesignerSituationNarrative = PerformanceSituationNarrative;

export function designerSituationPeriodScopeLabel(
  period: PeriodSelection,
): string {
  return performanceNarrativePeriodScopeLabel(period);
}

export function buildDesignerSituationAnalysis(
  rows: DispatcherEvaluationRow[],
  orders: Order[],
  period: PeriodSelection,
  periodLabel: string,
  scopeHint?: string,
): PerformanceAnalysisResult {
  return buildPerformanceAnalysisForRole("designer", {
    rows,
    orders,
    period,
    periodLabel,
    scopeHint,
  });
}

export function buildDesignerSituationNarrative(
  rows: DispatcherEvaluationRow[],
  orders: Order[],
  period: PeriodSelection,
  periodLabel: string,
  scopeHint?: string,
): DesignerSituationNarrative {
  return buildDesignerSituationAnalysis(
    rows,
    orders,
    period,
    periodLabel,
    scopeHint,
  ).narrative;
}

export function formatDesignerSituationNarrativeText(
  narrative: DesignerSituationNarrative,
): string {
  return formatPerformanceSituationNarrativeText(narrative);
}
