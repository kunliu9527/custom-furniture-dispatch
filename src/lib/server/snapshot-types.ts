import type { AppPersistedData } from "@/lib/types";
import type { StaffAccessOverrides } from "@/lib/staff-access-storage";
import type { StaffExtraStoresOverrides } from "@/lib/staff-extra-stores-storage";
import type { StaffHomeStoreOverrides } from "@/lib/staff-home-store-storage";
import type { StaffPasswordOverrides } from "@/lib/staff-password-storage";
import type { CustomPositionDefinition } from "@/lib/staff-config-storage";
import type { StaffRecord } from "@/lib/staff-roster";

export interface StaffConfigSnapshot {
  customStaff: StaffRecord[];
  accessOverrides: StaffAccessOverrides;
  passwordOverrides: StaffPasswordOverrides;
  homeStoreOverrides: StaffHomeStoreOverrides;
  extraStoreOverrides: StaffExtraStoresOverrides;
  customPositions: CustomPositionDefinition[];
  customStores: string[];
}

export interface AppSnapshot extends AppPersistedData {
  version: number;
  updatedAt: string;
  staffConfig: StaffConfigSnapshot;
}

export const EMPTY_STAFF_CONFIG: StaffConfigSnapshot = {
  customStaff: [],
  accessOverrides: {},
  passwordOverrides: {},
  homeStoreOverrides: {},
  extraStoreOverrides: {},
  customPositions: [],
  customStores: [],
};
