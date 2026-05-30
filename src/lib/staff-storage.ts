import type { StaffAccessLevel } from "./staff-access";
import {
  defaultAccessLevelForPosition,
  permissionsTextForAccessLevel,
} from "./staff-access";
import type { StaffAccessOverrides } from "./staff-access-storage";
import type { StaffExtraStoresOverrides } from "./staff-extra-stores-storage";
import type { StaffHomeStoreOverrides } from "./staff-home-store-storage";
import type { StaffPhoneOverrides } from "./staff-phone-storage";
import type { StaffPasswordOverrides } from "./staff-password-storage";
import type { StaffRecord } from "./staff-roster";
import type { StoreName } from "./types";

export const CUSTOM_STAFF_STORAGE_KEY = "custom-furniture-dispatch-staff-v1";

export function loadCustomStaff(): StaffRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_STAFF_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StaffRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomStaff(records: StaffRecord[]): void {
  localStorage.setItem(CUSTOM_STAFF_STORAGE_KEY, JSON.stringify(records));
}

function withAccessLevel(
  record: StaffRecord,
  overrides: StaffAccessOverrides,
): StaffRecord {
  const accessLevel =
    overrides[record.id] ??
    record.accessLevel ??
    defaultAccessLevelForPosition(record.position);
  return {
    ...record,
    accessLevel,
    permissions: permissionsTextForAccessLevel(accessLevel),
  };
}

function withPassword(
  record: StaffRecord,
  passwordOverrides: StaffPasswordOverrides,
): StaffRecord {
  const password = passwordOverrides[record.id];
  return password ? { ...record, password } : record;
}

function withExtraStores(
  record: StaffRecord,
  extraStoreOverrides: StaffExtraStoresOverrides,
): StaffRecord {
  const extra = record.extraStores ?? extraStoreOverrides[record.id];
  if (!extra?.length) {
    const { extraStores: _removed, ...rest } = record;
    return rest as StaffRecord;
  }
  return { ...record, extraStores: extra };
}

function withHomeStore(
  record: StaffRecord,
  homeStoreOverrides: StaffHomeStoreOverrides,
): StaffRecord {
  const homeStore = homeStoreOverrides[record.id];
  return homeStore ? { ...record, homeStore } : record;
}

function withPhone(
  record: StaffRecord,
  phoneOverrides: StaffPhoneOverrides,
): StaffRecord {
  if (Object.prototype.hasOwnProperty.call(phoneOverrides, record.id)) {
    const phone = phoneOverrides[record.id]?.trim() ?? "";
    if (!phone) {
      const { phone: _removed, ...rest } = record;
      return rest as StaffRecord;
    }
    return { ...record, phone };
  }
  const phone = record.phone?.trim();
  if (!phone) {
    const { phone: _removed, ...rest } = record;
    return rest as StaffRecord;
  }
  return { ...record, phone };
}

export function mergeStaffRecords(
  builtin: StaffRecord[],
  custom: StaffRecord[],
  accessOverrides: StaffAccessOverrides = {},
  passwordOverrides: StaffPasswordOverrides = {},
  homeStoreOverrides: StaffHomeStoreOverrides = {},
  extraStoreOverrides: StaffExtraStoresOverrides = {},
  phoneOverrides: StaffPhoneOverrides = {},
): StaffRecord[] {
  const names = new Set(builtin.map((s) => s.name));
  const merged: StaffRecord[] = builtin.map((s) =>
    withPhone(
      withExtraStores(
        withHomeStore(
          withPassword(withAccessLevel(s, accessOverrides), passwordOverrides),
          homeStoreOverrides,
        ),
        extraStoreOverrides,
      ),
      phoneOverrides,
    ),
  );
  for (const row of custom) {
    if (names.has(row.name)) continue;
    merged.push(
      withPhone(
        withExtraStores(
          withHomeStore(
            withPassword(withAccessLevel(row, accessOverrides), passwordOverrides),
            homeStoreOverrides,
          ),
          extraStoreOverrides,
        ),
        phoneOverrides,
      ),
    );
    names.add(row.name);
  }
  return merged;
}

export function normalizeCustomStaffRecord(record: StaffRecord): StaffRecord {
  const accessLevel =
    record.accessLevel ?? defaultAccessLevelForPosition(record.position);
  return {
    ...record,
    accessLevel,
    permissions: permissionsTextForAccessLevel(accessLevel),
  };
}
