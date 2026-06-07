import type { AdminViewMode } from "./admin-stats";

function storageKey(username: string) {
  return `custom-furniture-dispatch-admin-ui:${username}`;
}

export function loadAdminViewMode(
  username: string | undefined,
): AdminViewMode | null {
  if (!username || typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(username));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { viewMode?: string };
    const mode = parsed.viewMode;
    if (
      mode === "dispatch" ||
      mode === "orderLookup" ||
      mode === "staff" ||
      mode === "branding" ||
      mode === "dataTools"
    ) {
      return mode;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveAdminViewMode(
  username: string,
  viewMode: AdminViewMode,
): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(storageKey(username), JSON.stringify({ viewMode }));
}
