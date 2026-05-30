import type { ViewMode } from "./manager-stats";

export type ManagerMainSection = "weekly" | "reports" | "lookup";
export type ManagerReportTab = "pending" | "alerts";
export type ManagerWeeklyPeriodPreset = "thisWeek" | "lastWeek";

export interface ManagerUiState {
  mainSection: ManagerMainSection;
  reportTab: ManagerReportTab;
  viewMode: ViewMode;
  weeklyPeriod?: ManagerWeeklyPeriodPreset;
}

function storageKey(username: string) {
  return `custom-furniture-dispatch-manager-ui:${username}`;
}

export function loadManagerUi(username: string | undefined): ManagerUiState | null {
  if (!username || typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(username));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ManagerUiState>;
    const mainSection: ManagerMainSection =
      parsed.mainSection === "lookup"
        ? "lookup"
        : parsed.mainSection === "weekly"
          ? "weekly"
          : parsed.mainSection === "reports"
            ? "reports"
            : "weekly";
    const reportTab: ManagerReportTab =
      parsed.reportTab === "alerts" ? "alerts" : "pending";
    const weeklyPeriod: ManagerWeeklyPeriodPreset =
      parsed.weeklyPeriod === "lastWeek" ? "lastWeek" : "thisWeek";
    const viewMode: ViewMode =
      parsed.viewMode === "dispatcher" ||
      parsed.viewMode === "designer" ||
      parsed.viewMode === "store"
        ? parsed.viewMode
        : "status";
    return { mainSection, reportTab, viewMode, weeklyPeriod };
  } catch {
    return null;
  }
}

export function saveManagerUi(username: string, state: ManagerUiState): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(storageKey(username), JSON.stringify(state));
}
