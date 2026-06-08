import type { DispatcherEvaluationRow } from "./evaluation-stats";
import { getDispatcherHomeStore } from "./dispatchers";
import { buildDesignerHomeStoreIndex } from "./designer-staff-store";
import type { PeriodSelection } from "./period-filter";
import type { StaffRecord } from "./staff-roster";
import type { StoreName, Order } from "./types";
import {
  buildEntityCentricSections,
  formatNameList,
  formatPerformanceSituationNarrativeText,
  narrativeDataRows,
  performanceNarrativePeriodScopeLabel,
  STORE_NARRATIVE_FOOTNOTE,
  STORE_NARRATIVE_INTRO,
  type PerformanceSituationNarrative,
} from "./performance-narrative-core";

export type StoreSituationNarrative = PerformanceSituationNarrative;

function countDesignersOnRosterForStore(
  store: StoreName,
  staffRecords: StaffRecord[],
): number {
  const index = buildDesignerHomeStoreIndex(staffRecords);
  let count = 0;
  for (const [, homeStore] of index) {
    if (homeStore === store) count += 1;
  }
  return count;
}

function storesWithSmallRoster(
  rows: DispatcherEvaluationRow[],
  staffRecords: StaffRecord[],
): string[] {
  return rows
    .filter(
      (r) =>
        countDesignersOnRosterForStore(r.label as StoreName, staffRecords) < 3,
    )
    .map((r) => r.label);
}

export function buildStoreSituationNarrative(
  rows: DispatcherEvaluationRow[],
  orders: Order[],
  period: PeriodSelection,
  periodLabel: string,
  scopeHint?: string,
  staffRecords: StaffRecord[] = [],
): StoreSituationNarrative {
  const scope = performanceNarrativePeriodScopeLabel(period);
  const title = `「${scope}」各店面绩效评价`;
  const data = narrativeDataRows(rows);

  const smallRosterStores = storesWithSmallRoster(data, staffRecords);
  let footnote = STORE_NARRATIVE_FOOTNOTE;
  if (smallRosterStores.length > 0) {
    footnote += ` · 名册设计师不足 3 人的店面：${formatNameList(smallRosterStores)}`;
  }

  if (data.length === 0) {
    return {
      title,
      periodHint: periodLabel,
      scopeHint,
      intro: STORE_NARRATIVE_INTRO,
      sections: [
        { heading: "整体情况", items: ["当前周期与权限范围内暂无店面订单数据。"] },
      ],
      footnote,
    };
  }

  return {
    title,
    periodHint: periodLabel,
    scopeHint,
    intro: STORE_NARRATIVE_INTRO,
    sections: buildEntityCentricSections(data, orders, {
      entityLabel: "店面",
      teamScope: "全部门店",
      isStore: true,
      matchPerson: (order, storeName) =>
        getDispatcherHomeStore(order.dispatcherName, order.dispatchStore) ===
        storeName,
    }),
    footnote,
  };
}

export function formatStoreSituationNarrativeText(
  narrative: StoreSituationNarrative,
): string {
  return formatPerformanceSituationNarrativeText(narrative);
}
