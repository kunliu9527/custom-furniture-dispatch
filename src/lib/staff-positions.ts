import {
  loadCustomPositionDefinitions,
  type CustomPositionDefinition,
} from "./staff-config-storage";
import type { StaffAccessLevel } from "./staff-access";
import {
  POSITION_TO_ROLE,
  type StaffPosition,
  type UserRole,
} from "./staff-types";

/** 添加人员时可选的固定岗位（不含管理员） */
export const BUILTIN_ADDABLE_POSITIONS = [
  "设计经理",
  "总经理",
  "派单人",
  "设计师",
] as const satisfies readonly StaffPosition[];

export function getAddablePositionOptions(): StaffPosition[] {
  const seen = new Set<string>();
  const result: StaffPosition[] = [];
  for (const name of [
    ...BUILTIN_ADDABLE_POSITIONS,
    ...loadCustomPositionDefinitions().map((d) => d.name),
  ]) {
    const key = name.trim();
    if (!key || seen.has(key) || key === "管理员") continue;
    seen.add(key);
    result.push(key as StaffPosition);
  }
  return result;
}

export function findCustomPositionDefinition(
  position: string,
): CustomPositionDefinition | undefined {
  return loadCustomPositionDefinitions().find((d) => d.name === position);
}

export function resolveDefaultAccessLevelForPosition(
  position: StaffPosition | string,
): StaffAccessLevel {
  switch (position) {
    case "管理员":
      return "admin";
    case "设计经理":
    case "总经理":
      return "design_manager";
    case "派单人":
    case "设计师":
      return "personal";
    default: {
      const custom = findCustomPositionDefinition(position);
      return custom?.defaultAccessLevel ?? "personal";
    }
  }
}

export function isDesignManagerDefaultPosition(position: string): boolean {
  return resolveDefaultAccessLevelForPosition(position) === "design_manager";
}

export function roleForPositionAndAccess(
  position: StaffPosition | string,
  accessLevel: StaffAccessLevel,
): UserRole {
  if (accessLevel === "admin") return "admin";
  if (accessLevel === "design_manager") return "design_manager";

  const mapped = POSITION_TO_ROLE[position];
  if (mapped) return mapped;

  if (position === "设计师") return "designer";
  return "dispatcher";
}
