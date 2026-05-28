import type { StaffAccessLevel } from "./staff-access";
import { isAdminAccess, type SessionUser } from "./permissions";
import { ADMIN_STAFF_RECORD, type StaffRecord } from "./staff-roster";

export function isSystemAdminStaffRecord(row: Pick<StaffRecord, "id">): boolean {
  return row.id === ADMIN_STAFF_RECORD.id;
}

export function isReservedAdminUsername(name: string): boolean {
  return name.trim() === ADMIN_STAFF_RECORD.name;
}

/** 名册展示：系统 admin 仅管理员本人登录时可见 */
export function filterStaffRecordsForViewer(
  records: StaffRecord[],
  viewer: SessionUser | null,
): StaffRecord[] {
  if (isAdminAccess(viewer)) return records;
  return records.filter((row) => !isSystemAdminStaffRecord(row));
}

export function validateNewStaffName(
  name: string,
): { ok: true } | { ok: false; error: string } {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "请填写姓名" };
  if (isReservedAdminUsername(trimmed)) {
    return { ok: false, error: "不能使用 admin 作为姓名" };
  }
  return { ok: true };
}

export function validateStaffAccessLevelChange(
  staffId: string,
  accessLevel: StaffAccessLevel,
): { ok: true } | { ok: false; error: string } {
  if (staffId === ADMIN_STAFF_RECORD.id && accessLevel !== "admin") {
    return { ok: false, error: "系统管理员须保持管理员权限" };
  }
  if (accessLevel === "admin" && staffId !== ADMIN_STAFF_RECORD.id) {
    return {
      ok: false,
      error: "管理员权限仅保留系统内置 admin 账号",
    };
  }
  return { ok: true };
}

export function validateNewStaffAccessLevel(
  accessLevel: StaffAccessLevel,
): { ok: true } | { ok: false; error: string } {
  if (accessLevel === "admin") {
    return { ok: false, error: "管理员账号为系统内置，不可新增" };
  }
  return { ok: true };
}
