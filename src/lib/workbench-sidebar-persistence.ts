const WORKBENCH_SIDEBAR_COLLAPSED_KEY = "workbench-sidebar-collapsed";

export function loadWorkbenchSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(WORKBENCH_SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveWorkbenchSidebarCollapsed(collapsed: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WORKBENCH_SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    // ignore quota / private mode
  }
}
