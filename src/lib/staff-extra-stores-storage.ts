import type { StoreName } from "./types";

export const STAFF_EXTRA_STORES_STORAGE_KEY =
  "custom-furniture-dispatch-staff-extra-stores-v1";

export type StaffExtraStoresOverrides = Record<string, StoreName[]>;

export function loadStaffExtraStoresOverrides(): StaffExtraStoresOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STAFF_EXTRA_STORES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StaffExtraStoresOverrides;
    if (!parsed || typeof parsed !== "object") return {};
    const result: StaffExtraStoresOverrides = {};
    for (const [id, stores] of Object.entries(parsed)) {
      if (Array.isArray(stores)) {
        result[id] = stores.filter((s): s is StoreName => typeof s === "string");
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function saveStaffExtraStoresOverrides(
  overrides: StaffExtraStoresOverrides,
): void {
  localStorage.setItem(STAFF_EXTRA_STORES_STORAGE_KEY, JSON.stringify(overrides));
}
