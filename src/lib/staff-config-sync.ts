import {
  loadStaffConfigFromBrowser,
  type StaffConfigSources,
} from "./auth-staff-config";
import {
  CUSTOM_POSITIONS_STORAGE_KEY,
  CUSTOM_STORES_STORAGE_KEY,
} from "./staff-config-storage";

export const STAFF_CONFIG_STORAGE_KEYS = [
  "custom-furniture-dispatch-site-branding-v1",
  "custom-furniture-dispatch-staff-v1",
  "custom-furniture-dispatch-staff-access-v1",
  "custom-furniture-dispatch-staff-home-store-v1",
  "custom-furniture-dispatch-staff-extra-stores-v1",
  "custom-furniture-dispatch-staff-phone-v1",
  "custom-furniture-dispatch-staff-password-v1",
  "custom-furniture-dispatch-staff-removed-v1",
  CUSTOM_POSITIONS_STORAGE_KEY,
  CUSTOM_STORES_STORAGE_KEY,
] as const;

export function buildStaffConfigSnapshotFromBrowserStorage() {
  return loadStaffConfigFromBrowser();
}

/** @deprecated 使用 {@link loadStaffConfigFromBrowser} */
export function loadStaffConfigFromStorage(): Omit<
  StaffConfigSources,
  "customPositions" | "customStores"
> & { siteBranding: StaffConfigSources["siteBranding"] } {
  const snap = loadStaffConfigFromBrowser();
  return {
    customStaff: snap.customStaff,
    accessOverrides: snap.accessOverrides,
    passwordOverrides: snap.passwordOverrides,
    homeStoreOverrides: snap.homeStoreOverrides,
    extraStoreOverrides: snap.extraStoreOverrides,
    phoneOverrides: snap.phoneOverrides,
    removedStaffIds: snap.removedStaffIds,
    siteBranding: snap.siteBranding,
  };
}

export function isStaffConfigStorageKey(key: string | null): boolean {
  if (!key) return false;
  return (STAFF_CONFIG_STORAGE_KEYS as readonly string[]).includes(key);
}
