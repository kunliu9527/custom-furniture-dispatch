import type { DesignerSidebarFilter } from "./designer-sidebar-filter";

export interface DesignerUiState {
  statusFilter: DesignerSidebarFilter;
}

function storageKey(username: string) {
  return `custom-furniture-dispatch-designer-ui:${username}`;
}

export function loadDesignerUi(
  username: string | undefined,
): DesignerUiState | null {
  if (!username || typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(username));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DesignerUiState>;
    return {
      statusFilter:
        typeof parsed.statusFilter === "string"
          ? (parsed.statusFilter as DesignerSidebarFilter)
          : "全部",
    };
  } catch {
    return null;
  }
}

export function saveDesignerUi(username: string, state: DesignerUiState): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(storageKey(username), JSON.stringify(state));
}
