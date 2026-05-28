import type { EvaluationViewMode } from "./evaluation-stats";

export type EvaluationSubView = "aggregate" | "ranking" | "workflow";

export interface EvaluationUiState {
  viewMode: EvaluationViewMode;
  dispatcherSubView: EvaluationSubView;
  storeSubView: EvaluationSubView;
  designerSubView: EvaluationSubView;
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
      v === "ranking" || v === "workflow" ? v : "aggregate";
    return {
      viewMode: parsed.viewMode,
      dispatcherSubView: sub(parsed.dispatcherSubView),
      storeSubView: sub(parsed.storeSubView),
      designerSubView: sub(parsed.designerSubView),
    };
  } catch {
    return null;
  }
}

export function saveEvaluationUi(
  username: string,
  state: EvaluationUiState,
): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(storageKey(username), JSON.stringify(state));
}
