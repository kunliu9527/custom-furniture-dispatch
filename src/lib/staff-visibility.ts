import { isAdminAccess, type SessionUser } from "./permissions";
import { ADMIN_STAFF_RECORD, type StaffRecord } from "./staff-roster";

export function isSystemAdminStaffRecord(row: Pick<StaffRecord, "id">): boolean {
  return row.id === ADMIN_STAFF_RECORD.id;
}

export function isSystemAdminUsername(username: string): boolean {
  return username.trim() === ADMIN_STAFF_RECORD.name;
}

/** 名册展示：系统 admin 仅管理员本人登录时可见 */
export function filterStaffRecordsForViewer(
  records: StaffRecord[],
  viewer: SessionUser | null,
): StaffRecord[] {
  if (isAdminAccess(viewer)) return records;
  return records.filter((row) => !isSystemAdminStaffRecord(row));
}
