import type { EvaluationViewMode } from "./evaluation-stats";
import { DEFAULT_PERIOD, type PeriodSelection } from "./period-filter";

export type EvaluationSubView =
  | "aggregate"
  | "ranking"
  | "workflow"
  | "performance";

export interface EvaluationUiState {
  viewMode: EvaluationViewMode;
  dispatcherSubView: EvaluationSubView;
  storeSubView: EvaluationSubView;
  designerSubView: EvaluationSubView;
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
      parsed.viewMode !== "store"
    ) {
      return null;
    }
    const sub = (v: unknown): EvaluationSubView =>
      v === "ranking" || v === "workflow" || v === "performance"
        ? v
        : "aggregate";
    const period = parsePeriod(parsed.period);
    return {
      viewMode: parsed.viewMode,
      dispatcherSubView: sub(parsed.dispatcherSubView),
      storeSubView: sub(parsed.storeSubView),
      designerSubView: sub(parsed.designerSubView),
      period,
    };
  } catch {
    return null;
  }
}

function parsePeriod(raw: unknown): PeriodSelection {
  if (!raw || typeof raw !== "object") return DEFAULT_PERIOD;
  const p = raw as Partial<PeriodSelection>;
  if (
    p.preset === "all" ||
    p.preset === "thisMonth" ||
    p.preset === "lastMonth" ||
    p.preset === "custom"
  ) {
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
