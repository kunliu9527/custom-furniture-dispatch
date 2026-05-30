export const STAFF_PHONE_STORAGE_KEY =
  "custom-furniture-dispatch-staff-phone-v1";

export type StaffPhoneOverrides = Record<string, string>;

export function loadStaffPhoneOverrides(): StaffPhoneOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STAFF_PHONE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StaffPhoneOverrides;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveStaffPhoneOverrides(overrides: StaffPhoneOverrides): void {
  localStorage.setItem(STAFF_PHONE_STORAGE_KEY, JSON.stringify(overrides));
}
