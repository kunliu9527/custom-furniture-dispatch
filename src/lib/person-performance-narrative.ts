import { normalizeDispatcherName } from "./admin-stats";
import type { DispatcherEvaluationRow } from "./evaluation-stats";
import type { PeriodSelection } from "./period-filter";
import {
  buildEntityCentricSections,
  DESIGNER_NARRATIVE_FOOTNOTE,
  DISPATCHER_NARRATIVE_FOOTNOTE,
  formatPerformanceSituationNarrativeText,
  narrativeDataRows,
  performanceNarrativePeriodScopeLabel,
  PERSON_NARRATIVE_INTRO,
  type PerformanceSituationNarrative,
} from "./performance-narrative-core";
import type { Order } from "./types";

export interface PersonPerformanceNarrativeConfig {
  titleSuffix: string;
  roleLabel: string;
  teamScope: string;
  emptyDataMessage: string;
  footnote: string;
  matchPerson: (order: Order, name: string) => boolean;
}

export const DESIGNER_PERSON_CONFIG: PersonPerformanceNarrativeConfig = {
  titleSuffix: "设计师绩效评价",
  roleLabel: "设计师",
  teamScope: "全员",
  emptyDataMessage: "当前周期与权限范围内暂无设计师订单数据。",
  footnote: DESIGNER_NARRATIVE_FOOTNOTE,
  matchPerson: (order, name) => order.designer === name,
};

export const DISPATCHER_PERSON_CONFIG: PersonPerformanceNarrativeConfig = {
  titleSuffix: "派单人绩效评价",
  roleLabel: "派单人",
  teamScope: "全体派单人",
  emptyDataMessage: "当前周期与权限范围内暂无派单人订单数据。",
  footnote: DISPATCHER_NARRATIVE_FOOTNOTE,
  matchPerson: (order, name) =>
    normalizeDispatcherName(order.dispatcherName) === name,
};

export function buildPersonPerformanceNarrative(
  config: PersonPerformanceNarrativeConfig,
  rows: DispatcherEvaluationRow[],
  orders: Order[],
  period: PeriodSelection,
  periodLabel: string,
  scopeHint?: string,
): PerformanceSituationNarrative {
  const scope = performanceNarrativePeriodScopeLabel(period);
  const title = `「${scope}」${config.titleSuffix}`;
  const data = narrativeDataRows(rows);

  if (data.length === 0) {
    return {
      title,
      periodHint: periodLabel,
      scopeHint,
      intro: PERSON_NARRATIVE_INTRO,
      sections: [
        { heading: "团队概览", items: [config.emptyDataMessage] },
      ],
      footnote: config.footnote,
    };
  }

  return {
    title,
    periodHint: periodLabel,
    scopeHint,
    intro: PERSON_NARRATIVE_INTRO,
    sections: buildEntityCentricSections(data, orders, {
      entityLabel: config.roleLabel,
      teamScope: config.teamScope,
      isStore: false,
      matchPerson: config.matchPerson,
    }),
    footnote: config.footnote,
  };
}

export function formatPersonPerformanceNarrativeText(
  narrative: PerformanceSituationNarrative,
): string {
  return formatPerformanceSituationNarrativeText(narrative);
}
