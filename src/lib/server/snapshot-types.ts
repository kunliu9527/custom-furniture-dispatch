import type { AppPersistedData } from "@/lib/types";
import type { StaffAccessOverrides } from "@/lib/staff-access-storage";
import type { StaffExtraStoresOverrides } from "@/lib/staff-extra-stores-storage";
import type { StaffHomeStoreOverrides } from "@/lib/staff-home-store-storage";
import type { StaffPhoneOverrides } from "@/lib/staff-phone-storage";
import type { StaffPasswordOverrides } from "@/lib/staff-password-storage";
import type { CustomPositionDefinition } from "@/lib/staff-config-storage";
import type { StaffRecord } from "@/lib/staff-roster";
import type { CommissionSettings } from "@/lib/commission-settings";
import { DEFAULT_COMMISSION_SETTINGS } from "@/lib/commission-settings";
import type { SiteBranding } from "@/lib/site-branding";
import { DEFAULT_SITE_BRANDING } from "@/lib/site-branding";

export interface StaffConfigSnapshot {
  customStaff: StaffRecord[];
  accessOverrides: StaffAccessOverrides;
  passwordOverrides: StaffPasswordOverrides;
  homeStoreOverrides: StaffHomeStoreOverrides;
  extraStoreOverrides: StaffExtraStoresOverrides;
  phoneOverrides: StaffPhoneOverrides;
  /** 已删除的内置人员 id（builtin-disp-* / builtin-des-*） */
  removedStaffIds: string[];
  customPositions: CustomPositionDefinition[];
  customStores: string[];
  siteBranding: SiteBranding;
  commissionSettings: CommissionSettings;
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
  phoneOverrides: {},
  removedStaffIds: [],
  customPositions: [],
  customStores: [],
  siteBranding: { ...DEFAULT_SITE_BRANDING },
  commissionSettings: {
    rates: { ...DEFAULT_COMMISSION_SETTINGS.rates },
    visibleFor: { ...DEFAULT_COMMISSION_SETTINGS.visibleFor },
  },
};
