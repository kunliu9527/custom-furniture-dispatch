import { companyQualifiedKey } from "./active-company";
import type { StaffAccessLevel } from "./staff-access";

export const CUSTOM_POSITIONS_STORAGE_KEY =
  "custom-furniture-dispatch-custom-positions-v1";

export const CUSTOM_STORES_STORAGE_KEY =
  "custom-furniture-dispatch-custom-stores-v1";

export interface CustomPositionDefinition {
  name: string;
  defaultAccessLevel: StaffAccessLevel;
}

const RESERVED_POSITIONS = new Set([
  "管理员",
  "设计经理",
  "总经理",
  "派单人",
  "设计师",
]);

export function isReservedPositionName(name: string): boolean {
  return RESERVED_POSITIONS.has(name.trim());
}

export function loadCustomPositionDefinitions(): CustomPositionDefinition[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(
      companyQualifiedKey(CUSTOM_POSITIONS_STORAGE_KEY),
    );
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomPositionDefinition[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row) =>
        typeof row?.name === "string" &&
        row.name.trim().length > 0 &&
        typeof row.defaultAccessLevel === "string",
    );
  } catch {
    return [];
  }
}

export function saveCustomPositionDefinitions(
  definitions: CustomPositionDefinition[],
): void {
  localStorage.setItem(
    companyQualifiedKey(CUSTOM_POSITIONS_STORAGE_KEY),
    JSON.stringify(definitions),
  );
}

export function loadCustomStoreNames(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(companyQualifiedKey(CUSTOM_STORES_STORAGE_KEY));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is string => typeof s === "string" && s.trim().length > 0,
    );
  } catch {
    return [];
  }
}

export function saveCustomStoreNames(names: string[]): void {
  localStorage.setItem(
    companyQualifiedKey(CUSTOM_STORES_STORAGE_KEY),
    JSON.stringify(names),
  );
}

export function isReservedStoreName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed === "总部" || trimmed.length === 0;
}
