import type { StaffAccessLevel } from "./staff-access";

export const STAFF_ACCESS_STORAGE_KEY =
  "custom-furniture-dispatch-staff-access-v1";

export type StaffAccessOverrides = Record<string, StaffAccessLevel>;

export function loadStaffAccessOverrides(): StaffAccessOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STAFF_ACCESS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StaffAccessOverrides;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveStaffAccessOverrides(
  overrides: StaffAccessOverrides,
): void {
  localStorage.setItem(STAFF_ACCESS_STORAGE_KEY, JSON.stringify(overrides));
}
