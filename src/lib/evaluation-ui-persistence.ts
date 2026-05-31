import type { EvaluationViewMode } from "./evaluation-stats";
import { DEFAULT_PERIOD, isValidPeriodPreset, type PeriodSelection } from "./period-filter";
import type { ReportTab } from "./report-hub-config";

export type EvaluationSubView =
  | "aggregate"
  | "ranking"
  | "workflow"
  | "performance";

export type EvaluationMainSection = "operations" | "data";
export type EvaluationOperationsSubView = "cockpit" | "reports" | "lookup";

export interface EvaluationUiState {
  mainSection: EvaluationMainSection;
  operationsSubView: EvaluationOperationsSubView;
  reportTab: ReportTab;
  viewMode: EvaluationViewMode;
  dispatcherSubView: EvaluationSubView;
  storeSubView: EvaluationSubView;
  designerSubView: EvaluationSubView;
  acceptanceSubView: EvaluationSubView;
  period: PeriodSelection;
}

function storageKey(username: string) {
  return `custom-furniture-dispatch-evaluation-ui:${username}`;
}

export function loadEvaluationUi(
  username: string | undefined,
): EvaluationUiState | null {
  if (!username || typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(username));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<EvaluationUiState>;
    if (
      parsed.viewMode !== "dispatcher" &&
      parsed.viewMode !== "designer" &&
      parsed.viewMode !== "store" &&
      parsed.viewMode !== "acceptance"
    ) {
      return null;
    }
    const mainSection: EvaluationMainSection =
      parsed.mainSection === "data" ? "data" : "operations";
    const operationsSubView: EvaluationOperationsSubView =
      parsed.operationsSubView === "reports"
        ? "reports"
        : parsed.operationsSubView === "lookup"
          ? "lookup"
          : "cockpit";
    const reportTab: ReportTab =
      parsed.reportTab === "monthly" ||
      parsed.reportTab === "allSummary" ||
      parsed.reportTab === "history" ||
      parsed.reportTab === "pending" ||
      parsed.reportTab === "alerts"
        ? parsed.reportTab
        : "weekly";
    const sub = (v: unknown, migrateWeekly = false): EvaluationSubView => {
      if (migrateWeekly && v === "weekly") return "performance";
      return v === "ranking" ||
        v === "workflow" ||
        v === "performance"
        ? v
        : "aggregate";
    };
    const period = parsePeriod(parsed.period);
    return {
      mainSection,
      operationsSubView,
      reportTab,
      viewMode: parsed.viewMode,
      dispatcherSubView: sub(parsed.dispatcherSubView, true),
      storeSubView: sub(parsed.storeSubView),
      designerSubView: sub(parsed.designerSubView),
      acceptanceSubView: sub(parsed.acceptanceSubView),
      period,
    };
  } catch {
    return null;
  }
}

function parsePeriod(raw: unknown): PeriodSelection {
  if (!raw || typeof raw !== "object") return DEFAULT_PERIOD;
  const p = raw as Partial<PeriodSelection>;
  if (isValidPeriodPreset(p.preset)) {
    return {
      preset: p.preset,
      yearMonth: typeof p.yearMonth === "string" ? p.yearMonth : undefined,
    };
  }
  return DEFAULT_PERIOD;
}

export function saveEvaluationUi(
  username: string,
  state: EvaluationUiState,
): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(storageKey(username), JSON.stringify(state));
}
