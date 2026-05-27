import { resolveStaffAssignedStores } from "./assigned-stores";
import type { StaffAccessLevel } from "./staff-access";
import {
  loadStaffAccessOverrides,
  type StaffAccessOverrides,
} from "./staff-access-storage";
import {
  loadStaffExtraStoresOverrides,
  type StaffExtraStoresOverrides,
} from "./staff-extra-stores-storage";
import {
  loadStaffHomeStoreOverrides,
  type StaffHomeStoreOverrides,
} from "./staff-home-store-storage";
import {
  loadStaffPasswordOverrides,
  type StaffPasswordOverrides,
} from "./staff-password-storage";
import type { StaffRecord, UserRole } from "./staff-roster";
import {
  ADMIN_STAFF_RECORD,
  BUILTIN_STAFF_RECORDS,
} from "./staff-roster";
import { mergeStaffRecords } from "./staff-storage";
import type { StoreName } from "./types";

export type { UserRole };

export interface AuthUser {
  username: string;
  displayName: string;
  role: UserRole;
  accessLevel: StaffAccessLevel;
  password: string;
  homeStore?: StoreName;
  assignedStores?: StoreName[];
  permissions?: string;
}

export function staffToAuthUser(staff: StaffRecord): AuthUser {
  const assignedStores = resolveStaffAssignedStores(staff);
  return {
    username: staff.name,
    displayName: staff.position === "管理员" ? "管理员" : staff.name,
    role: staff.role,
    accessLevel: staff.accessLevel,
    password: staff.password,
    homeStore: staff.homeStore,
    assignedStores,
    permissions: staff.permissions,
  };
}

export function buildAuthUsers(
  customStaff: StaffRecord[] = [],
  accessOverrides?: StaffAccessOverrides,
  passwordOverrides?: StaffPasswordOverrides,
  homeStoreOverrides?: StaffHomeStoreOverrides,
  extraStoreOverrides?: StaffExtraStoresOverrides,
): AuthUser[] {
  const overrides = accessOverrides ?? loadStaffAccessOverrides();
  const passwords = passwordOverrides ?? loadStaffPasswordOverrides();
  const homeStores = homeStoreOverrides ?? loadStaffHomeStoreOverrides();
  const extraStores = extraStoreOverrides ?? loadStaffExtraStoresOverrides();
  const allStaff = mergeStaffRecords(
    [ADMIN_STAFF_RECORD, ...BUILTIN_STAFF_RECORDS],
    customStaff.filter(
      (s) =>
        s.name !== "admin" &&
        !BUILTIN_STAFF_RECORDS.some((b) => b.name === s.name),
    ),
    overrides,
    passwords,
    homeStores,
    extraStores,
  );
  return allStaff.map(staffToAuthUser);
}

export function findAuthUser(
  users: AuthUser[],
  username: string,
): AuthUser | undefined {
  const key = username.trim();
  return users.find((u) => u.username === key);
}

export function authenticate(
  users: AuthUser[],
  username: string,
  password: string,
): AuthUser | null {
  const user = findAuthUser(users, username);
  if (!user || user.password !== password) return null;
  return user;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "管理员",
  design_manager: "设计经理",
  dispatcher: "派单人（店长）",
  designer: "设计师",
};
