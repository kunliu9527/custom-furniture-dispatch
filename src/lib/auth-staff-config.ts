import {
  loadCustomPositionDefinitions,
  loadCustomStoreNames,
  saveCustomPositionDefinitions,
  saveCustomStoreNames,
} from "./staff-config-storage";
import {
  loadStaffAccessOverrides,
  saveStaffAccessOverrides,
  type StaffAccessOverrides,
} from "./staff-access-storage";
import {
  loadStaffExtraStoresOverrides,
  saveStaffExtraStoresOverrides,
  type StaffExtraStoresOverrides,
} from "./staff-extra-stores-storage";
import {
  loadStaffHomeStoreOverrides,
  saveStaffHomeStoreOverrides,
  type StaffHomeStoreOverrides,
} from "./staff-home-store-storage";
import {
  loadStaffPasswordOverrides,
  saveStaffPasswordOverrides,
  type StaffPasswordOverrides,
} from "./staff-password-storage";
import {
  loadRemovedStaffIds,
  saveRemovedStaffIds,
  type RemovedStaffIds,
} from "./staff-removed-storage";
import type { StaffConfigSnapshot } from "./server/snapshot-types";
import {
  getCachedSnapshot,
  patchSnapshotCache,
} from "./snapshot-cache";
import { isRemoteSyncEnabled } from "./sync-config";
import {
  loadCustomStaff,
  mergeStaffRecords,
  normalizeCustomStaffRecord,
  saveCustomStaff,
} from "./staff-storage";
import {
  ADMIN_STAFF_RECORD,
  BUILTIN_STAFF_RECORDS,
  type StaffRecord,
} from "./staff-roster";
import {
  normalizeSiteBranding,
  type SiteBranding,
} from "./site-branding";
import { saveSiteBranding } from "./site-branding-storage";
import { loadSiteBranding } from "./site-branding-storage";

export interface StaffConfigSources {
  customStaff: StaffRecord[];
  accessOverrides: StaffAccessOverrides;
  passwordOverrides: StaffPasswordOverrides;
  homeStoreOverrides: StaffHomeStoreOverrides;
  extraStoreOverrides: StaffExtraStoresOverrides;
  removedStaffIds: RemovedStaffIds;
  siteBranding: SiteBranding;
}

export function buildMergedStaffRecords(
  sources: Pick<
    StaffConfigSources,
    | "customStaff"
    | "accessOverrides"
    | "passwordOverrides"
    | "homeStoreOverrides"
    | "extraStoreOverrides"
    | "removedStaffIds"
  >,
): StaffRecord[] {
  const merged = mergeStaffRecords(
    [ADMIN_STAFF_RECORD, ...BUILTIN_STAFF_RECORDS],
    sources.customStaff,
    sources.accessOverrides,
    sources.passwordOverrides,
    sources.homeStoreOverrides,
    sources.extraStoreOverrides,
  );
  if (!sources.removedStaffIds.length) return merged;
  const removed = new Set(sources.removedStaffIds);
  return merged.filter((row) => !removed.has(row.id));
}

export function clearStaffOverridesForId(
  staffId: string,
  sources: Pick<
    StaffConfigSources,
    | "accessOverrides"
    | "passwordOverrides"
    | "homeStoreOverrides"
    | "extraStoreOverrides"
  >,
): Pick<
  StaffConfigSources,
  | "accessOverrides"
  | "passwordOverrides"
  | "homeStoreOverrides"
  | "extraStoreOverrides"
> {
  const nextAccess = { ...sources.accessOverrides };
  const nextPasswords = { ...sources.passwordOverrides };
  const nextHomeStores = { ...sources.homeStoreOverrides };
  const nextExtraStores = { ...sources.extraStoreOverrides };
  delete nextAccess[staffId];
  delete nextPasswords[staffId];
  delete nextHomeStores[staffId];
  delete nextExtraStores[staffId];
  return {
    accessOverrides: nextAccess,
    passwordOverrides: nextPasswords,
    homeStoreOverrides: nextHomeStores,
    extraStoreOverrides: nextExtraStores,
  };
}

export function buildStaffConfigSnapshot(
  sources: StaffConfigSources,
): StaffConfigSnapshot {
  return {
    customStaff: sources.customStaff.map(normalizeCustomStaffRecord),
    accessOverrides: sources.accessOverrides,
    passwordOverrides: sources.passwordOverrides,
    homeStoreOverrides: sources.homeStoreOverrides,
    extraStoreOverrides: sources.extraStoreOverrides,
    removedStaffIds: [...new Set(sources.removedStaffIds)],
    customPositions: loadCustomPositionDefinitions(),
    customStores: loadCustomStoreNames(),
    siteBranding: normalizeSiteBranding(sources.siteBranding),
  };
}

export function loadStaffConfigFromBrowser(): StaffConfigSnapshot {
  return buildStaffConfigSnapshot({
    customStaff: loadCustomStaff().map(normalizeCustomStaffRecord),
    accessOverrides: loadStaffAccessOverrides(),
    passwordOverrides: loadStaffPasswordOverrides(),
    homeStoreOverrides: loadStaffHomeStoreOverrides(),
    extraStoreOverrides: loadStaffExtraStoresOverrides(),
    removedStaffIds: loadRemovedStaffIds(),
    siteBranding: loadSiteBranding(),
  });
}

export function persistStaffConfigToLocalStorage(
  config: StaffConfigSnapshot,
): void {
  saveCustomStaff(config.customStaff);
  saveStaffAccessOverrides(config.accessOverrides);
  saveStaffPasswordOverrides(config.passwordOverrides);
  saveStaffHomeStoreOverrides(config.homeStoreOverrides);
  saveStaffExtraStoresOverrides(config.extraStoreOverrides);
  saveRemovedStaffIds(config.removedStaffIds);
  saveCustomPositionDefinitions(config.customPositions);
  saveCustomStoreNames(config.customStores);
  saveSiteBranding(normalizeSiteBranding(config.siteBranding));
}

export function patchRemoteStaffConfigIfSynced(
  config: StaffConfigSnapshot,
): void {
  if (!isRemoteSyncEnabled() || !getCachedSnapshot()) return;
  patchSnapshotCache({ staffConfig: config });
}

export function isCustomStaffId(
  staffId: string,
  customStaff: StaffRecord[],
): boolean {
  return customStaff.some((s) => s.id === staffId);
}
