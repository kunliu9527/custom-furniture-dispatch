import {
  CUSTOM_POSITIONS_STORAGE_KEY,
  CUSTOM_STORES_STORAGE_KEY,
  loadCustomPositionDefinitions,
  loadCustomStoreNames,
} from "./staff-config-storage";
import { loadStaffAccessOverrides } from "./staff-access-storage";
import { loadStaffExtraStoresOverrides } from "./staff-extra-stores-storage";
import { loadStaffHomeStoreOverrides } from "./staff-home-store-storage";
import { loadStaffPasswordOverrides } from "./staff-password-storage";
import { loadCustomStaff, normalizeCustomStaffRecord } from "./staff-storage";

export const STAFF_CONFIG_STORAGE_KEYS = [
  "custom-furniture-dispatch-staff-v1",
  "custom-furniture-dispatch-staff-access-v1",
  "custom-furniture-dispatch-staff-home-store-v1",
  "custom-furniture-dispatch-staff-extra-stores-v1",
  "custom-furniture-dispatch-staff-password-v1",
  CUSTOM_POSITIONS_STORAGE_KEY,
  CUSTOM_STORES_STORAGE_KEY,
] as const;

export function buildStaffConfigSnapshotFromBrowserStorage() {
  const config = loadStaffConfigFromStorage();
  return {
    customStaff: config.customStaff,
    accessOverrides: config.accessOverrides,
    passwordOverrides: config.passwordOverrides,
    homeStoreOverrides: config.homeStoreOverrides,
    extraStoreOverrides: config.extraStoreOverrides,
    customPositions: loadCustomPositionDefinitions(),
    customStores: loadCustomStoreNames(),
  };
}

export function loadStaffConfigFromStorage() {
  return {
    customStaff: loadCustomStaff().map(normalizeCustomStaffRecord),
    accessOverrides: loadStaffAccessOverrides(),
    passwordOverrides: loadStaffPasswordOverrides(),
    homeStoreOverrides: loadStaffHomeStoreOverrides(),
    extraStoreOverrides: loadStaffExtraStoresOverrides(),
  };
}

export function isStaffConfigStorageKey(key: string | null): boolean {
  if (!key) return false;
  return (STAFF_CONFIG_STORAGE_KEYS as readonly string[]).includes(key);
}
