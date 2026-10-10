import { companyQualifiedKey } from "./active-company";

const STORAGE_KEY = "custom-furniture-dispatch-staff-resigned-v1";

/** 已打「离职」标签的人员 id（保留在名册中，仅用于报表排除与登录拦截） */
export type ResignedStaffIds = string[];

export function loadResignedStaffIds(): ResignedStaffIds {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(companyQualifiedKey(STORAGE_KEY));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function saveResignedStaffIds(ids: ResignedStaffIds): void {
  localStorage.setItem(companyQualifiedKey(STORAGE_KEY), JSON.stringify([...new Set(ids)]));
}
