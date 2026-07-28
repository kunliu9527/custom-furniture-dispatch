import { buildDesignerHomeStoreIndex } from "../designer-staff-store";
import {
  buildEntityCentricSections,
  formatNameList,
  formatPerformanceSituationNarrativeText,
  narrativeDataRows,
  performanceNarrativePeriodScopeLabel,
  PERSON_NARRATIVE_INTRO,
  STORE_NARRATIVE_INTRO,
} from "../performance-narrative-core";
import type { StaffRecord } from "../staff-roster";
import type { StoreName } from "../types";
import {
  getPerformanceAnalysisConfig,
  STORE_ANALYSIS_CONFIG,
} from "./config";
import {
  buildPerformanceAnalysisContext,
  formatPerformanceAnalysisContextForPrompt,
  formatPerformanceAnalysisContextJson,
} from "./context";
import type {
  PerformanceAnalysisInput,
  PerformanceAnalysisResult,
  PerformanceAnalysisRole,
} from "./types";

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

function resolveStoreFootnote(
  staffRecords: StaffRecord[] | undefined,
  data: ReturnType<typeof narrativeDataRows>,
): string {
  let footnote = STORE_ANALYSIS_CONFIG.footnote;
  if (!staffRecords?.length) return footnote;

  const smallRosterStores = data
    .filter(
      (r) =>
        countDesignersOnRosterForStore(r.label as StoreName, staffRecords) < 3,
    )
    .map((r) => r.label);

  if (smallRosterStores.length > 0) {
    footnote += ` · 名册设计师不足 3 人的店面：${formatNameList(smallRosterStores)}`;
  }
  return footnote;
}

/** 统一入口：生成结构化上下文 + 规则叙事 + 纯文本 */
export function buildPerformanceAnalysis(
  input: PerformanceAnalysisInput,
): PerformanceAnalysisResult {
  const config = getPerformanceAnalysisConfig(input.role);
  const context = buildPerformanceAnalysisContext(input);
  const scope = performanceNarrativePeriodScopeLabel(input.period);
  const title = `「${scope}」${config.titleSuffix}`;
  const data = narrativeDataRows(input.rows);
  const intro =
    input.role === "store" ? STORE_NARRATIVE_INTRO : PERSON_NARRATIVE_INTRO;
  const footnote =
    input.role === "store"
      ? resolveStoreFootnote(input.staffRecords, data)
      : config.footnote;

  const narrative =
    data.length === 0
      ? {
          title,
          periodHint: input.periodLabel,
          scopeHint: input.scopeHint,
          intro,
          sections: [
            { heading: "整体情况", items: [config.emptyDataMessage] },
          ],
          footnote,
        }
      : {
          title,
          periodHint: input.periodLabel,
          scopeHint: input.scopeHint,
          intro,
          sections: buildEntityCentricSections(data, input.orders, {
            entityLabel: config.roleLabel,
            teamScope: config.teamScope,
            isStore: config.isStore,
            matchPerson: config.matchPerson,
          }),
          footnote,
        };

  return {
    context,
    narrative,
    plainText: formatPerformanceSituationNarrativeText(narrative),
  };
}

export function buildPerformanceAnalysisForRole(
  role: PerformanceAnalysisRole,
  input: Omit<PerformanceAnalysisInput, "role">,
): PerformanceAnalysisResult {
  return buildPerformanceAnalysis({ ...input, role });
}

export {
  buildPerformanceAnalysisContext,
  formatPerformanceAnalysisContextForPrompt,
  formatPerformanceAnalysisContextJson,
};

export {
  getPerformanceAnalysisConfig,
  DESIGNER_ANALYSIS_CONFIG,
  DISPATCHER_ANALYSIS_CONFIG,
  STORE_ANALYSIS_CONFIG,
  PERFORMANCE_ANALYSIS_METRIC_DEFINITIONS,
} from "./config";

export type {
  PerformanceAnalysisContext,
  PerformanceAnalysisEntitySnapshot,
  PerformanceAnalysisInput,
  PerformanceAnalysisResult,
  PerformanceAnalysisRole,
  PerformanceAnalysisTeamSummary,
} from "./types";
