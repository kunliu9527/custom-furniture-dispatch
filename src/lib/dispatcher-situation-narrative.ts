import type { DispatcherEvaluationRow } from "./evaluation-stats";
import type { PeriodSelection } from "./period-filter";
import {
  buildPersonPerformanceNarrative,
  DISPATCHER_PERSON_CONFIG,
  formatPersonPerformanceNarrativeText,
} from "./person-performance-narrative";
import type { PerformanceSituationNarrative } from "./performance-narrative-core";
import type { Order } from "./types";

export type DispatcherSituationNarrative = PerformanceSituationNarrative;

export function buildDispatcherSituationNarrative(
  rows: DispatcherEvaluationRow[],
  orders: Order[],
  period: PeriodSelection,
  periodLabel: string,
  scopeHint?: string,
): DispatcherSituationNarrative {
  return buildPersonPerformanceNarrative(
    DISPATCHER_PERSON_CONFIG,
    rows,
    orders,
    period,
    periodLabel,
    scopeHint,
  );
}

export function formatDispatcherSituationNarrativeText(
  narrative: DispatcherSituationNarrative,
): string {
  return formatPersonPerformanceNarrativeText(narrative);
}
