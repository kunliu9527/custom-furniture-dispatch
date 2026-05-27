export type StaffPasswordOverrides = Record<string, string>;

export const STAFF_PASSWORD_STORAGE_KEY =
  "custom-furniture-dispatch-staff-passwords-v1";

export function loadStaffPasswordOverrides(): StaffPasswordOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STAFF_PASSWORD_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StaffPasswordOverrides;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveStaffPasswordOverrides(
  overrides: StaffPasswordOverrides,
): void {
  localStorage.setItem(STAFF_PASSWORD_STORAGE_KEY, JSON.stringify(overrides));
}
