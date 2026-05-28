import { INITIAL_DATA } from "@/lib/initial-data";
import { normalizeSiteBranding } from "@/lib/site-branding";
import {
  EMPTY_STAFF_CONFIG,
  type AppSnapshot,
  type StaffConfigSnapshot,
} from "./snapshot-types";

export function createInitialSnapshot(): AppSnapshot {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    orders: INITIAL_DATA.orders,
    supplements: INITIAL_DATA.supplements,
    staffConfig: { ...EMPTY_STAFF_CONFIG },
  };
}

export function normalizeStaffConfig(
  raw: Partial<StaffConfigSnapshot> | undefined,
): StaffConfigSnapshot {
  if (!raw) return { ...EMPTY_STAFF_CONFIG };
  return {
    customStaff: Array.isArray(raw.customStaff) ? raw.customStaff : [],
    accessOverrides:
      raw.accessOverrides && typeof raw.accessOverrides === "object"
        ? raw.accessOverrides
        : {},
    passwordOverrides:
      raw.passwordOverrides && typeof raw.passwordOverrides === "object"
        ? raw.passwordOverrides
        : {},
    homeStoreOverrides:
      raw.homeStoreOverrides && typeof raw.homeStoreOverrides === "object"
        ? raw.homeStoreOverrides
        : {},
    extraStoreOverrides:
      raw.extraStoreOverrides && typeof raw.extraStoreOverrides === "object"
        ? raw.extraStoreOverrides
        : {},
    removedStaffIds: Array.isArray(raw.removedStaffIds)
      ? raw.removedStaffIds.filter((id): id is string => typeof id === "string")
      : [],
    customPositions: Array.isArray(raw.customPositions) ? raw.customPositions : [],
    customStores: Array.isArray(raw.customStores) ? raw.customStores : [],
    siteBranding: normalizeSiteBranding(raw.siteBranding),
  };
}

export function normalizeSnapshot(raw: Partial<AppSnapshot>): AppSnapshot {
  return {
    version: typeof raw.version === "number" && raw.version > 0 ? raw.version : 1,
    updatedAt:
      typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
    orders: Array.isArray(raw.orders) ? raw.orders : INITIAL_DATA.orders,
    supplements: Array.isArray(raw.supplements) ? raw.supplements : [],
    staffConfig: normalizeStaffConfig(raw.staffConfig),
  };
}
