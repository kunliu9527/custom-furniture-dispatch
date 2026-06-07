import {
  DEFAULT_COMMISSION_SETTINGS,
  normalizeCommissionSettings,
  type CommissionSettings,
} from "./commission-settings";

import { COMMISSION_SETTINGS_STORAGE_KEY } from "./app-storage-keys";

export { COMMISSION_SETTINGS_STORAGE_KEY };

export function loadCommissionSettings(): CommissionSettings {
  if (typeof window === "undefined") return { ...DEFAULT_COMMISSION_SETTINGS };
  try {
    const raw = localStorage.getItem(COMMISSION_SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_COMMISSION_SETTINGS };
    return normalizeCommissionSettings(
      JSON.parse(raw) as Partial<CommissionSettings>,
    );
  } catch {
    return { ...DEFAULT_COMMISSION_SETTINGS };
  }
}

export function saveCommissionSettings(settings: CommissionSettings): void {
  localStorage.setItem(
    COMMISSION_SETTINGS_STORAGE_KEY,
    JSON.stringify(normalizeCommissionSettings(settings)),
  );
}
