import type { DispatcherEvaluationRow } from "./evaluation-stats";
import type { PeriodSelection } from "./period-filter";
import {
  buildPerformanceAnalysisForRole,
  type PerformanceAnalysisResult,
} from "./performance-analysis";
import {
  formatPerformanceSituationNarrativeText,
  type PerformanceSituationNarrative,
} from "./performance-narrative-core";
import type { Order } from "./types";

export type DispatcherSituationNarrative = PerformanceSituationNarrative;

export function buildDispatcherSituationAnalysis(
  rows: DispatcherEvaluationRow[],
  orders: Order[],
  period: PeriodSelection,
  periodLabel: string,
  scopeHint?: string,
): PerformanceAnalysisResult {
  return buildPerformanceAnalysisForRole("dispatcher", {
    rows,
    orders,
    period,
    periodLabel,
    scopeHint,
  });
}

export function buildDispatcherSituationNarrative(
  rows: DispatcherEvaluationRow[],
  orders: Order[],
  period: PeriodSelection,
  periodLabel: string,
  scopeHint?: string,
): DispatcherSituationNarrative {
  return buildDispatcherSituationAnalysis(
    rows,
    orders,
    period,
    periodLabel,
    scopeHint,
  ).narrative;
}

export function formatDispatcherSituationNarrativeText(
  narrative: DispatcherSituationNarrative,
): string {
  return formatPerformanceSituationNarrativeText(narrative);
}
