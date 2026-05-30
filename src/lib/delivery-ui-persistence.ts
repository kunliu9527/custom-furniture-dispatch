import type { DeliveryViewMode } from "./delivery-stats";

export interface DeliveryUiState {
  viewMode: DeliveryViewMode;
}

function storageKey(username: string) {
  return `custom-furniture-dispatch-delivery-ui:${username}`;
}

export function loadDeliveryUi(
  username: string | undefined,
): DeliveryUiState | null {
  if (!username || typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(username));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DeliveryUiState>;
    const viewMode: DeliveryViewMode =
      parsed.viewMode === "installer" ||
      parsed.viewMode === "store" ||
      parsed.viewMode === "acceptance"
        ? parsed.viewMode
        : "status";
    return { viewMode };
  } catch {
    return null;
  }
}

export function saveDeliveryUi(username: string, state: DeliveryUiState): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(storageKey(username), JSON.stringify(state));
}
