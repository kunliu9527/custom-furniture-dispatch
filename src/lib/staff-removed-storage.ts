const STORAGE_KEY = "custom-furniture-dispatch-staff-removed-v1";

export type RemovedStaffIds = string[];

export function loadRemovedStaffIds(): RemovedStaffIds {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function saveRemovedStaffIds(ids: RemovedStaffIds): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids)]));
}
