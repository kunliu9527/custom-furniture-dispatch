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
import type { StaffRecord } from "./staff-roster";
import type { Order } from "./types";

export type StoreSituationNarrative = PerformanceSituationNarrative;

export function buildStoreSituationAnalysis(
  rows: DispatcherEvaluationRow[],
  orders: Order[],
  period: PeriodSelection,
  periodLabel: string,
  scopeHint?: string,
  staffRecords: StaffRecord[] = [],
): PerformanceAnalysisResult {
  return buildPerformanceAnalysisForRole("store", {
    rows,
    orders,
    period,
    periodLabel,
    scopeHint,
    staffRecords,
  });
}

export function buildStoreSituationNarrative(
  rows: DispatcherEvaluationRow[],
  orders: Order[],
  period: PeriodSelection,
  periodLabel: string,
  scopeHint?: string,
  staffRecords: StaffRecord[] = [],
): StoreSituationNarrative {
  return buildStoreSituationAnalysis(
    rows,
    orders,
    period,
    periodLabel,
    scopeHint,
    staffRecords,
  ).narrative;
}

export function formatStoreSituationNarrativeText(
  narrative: StoreSituationNarrative,
): string {
  return formatPerformanceSituationNarrativeText(narrative);
}
