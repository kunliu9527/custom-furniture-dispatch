import type { StoreName } from "./types";

export const STAFF_HOME_STORE_STORAGE_KEY =
  "custom-furniture-dispatch-staff-home-store-v1";

export type StaffHomeStoreOverrides = Record<string, StoreName>;

export function loadStaffHomeStoreOverrides(): StaffHomeStoreOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STAFF_HOME_STORE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StaffHomeStoreOverrides;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveStaffHomeStoreOverrides(
  overrides: StaffHomeStoreOverrides,
): void {
  localStorage.setItem(STAFF_HOME_STORE_STORAGE_KEY, JSON.stringify(overrides));
}
