import type { SessionUser } from "./permissions";
import { staffToAuthUser } from "./auth-users";
import type { StaffRecord } from "./staff-roster";

/** 按人员管理名册实时合并登录会话（门店/权限变更后立即生效） */
export function resolveLiveSessionUser(
  session: SessionUser | null,
  staffRecords: StaffRecord[],
): SessionUser | null {
  if (!session) return null;
  const staff = staffRecords.find((row) => row.name === session.username);
  if (!staff) return null;

  const auth = staffToAuthUser(staff, session.companyId);
  return {
    username: auth.username,
    displayName: auth.displayName,
    role: auth.role,
    accessLevel: auth.accessLevel,
    position: staff.position,
    homeStore: auth.homeStore,
    assignedStores: auth.assignedStores,
    companyId: session.companyId,
  };
}

/** 仅账号/权限/角色变化时重置看板（不受云端名册门店覆盖影响） */
export function getSessionResetKey(user: SessionUser | null): string {
  if (!user) return "";
  return `${user.username}|${user.accessLevel}|${user.role}|${user.position ?? ""}|${user.companyId ?? ""}`;
}

export function sessionUsersEqual(
  a: SessionUser | null,
  b: SessionUser | null,
): boolean {
  if (!a || !b) return a === b;
  return (
    a.username === b.username &&
    a.role === b.role &&
    a.accessLevel === b.accessLevel &&
    a.position === b.position &&
    a.homeStore === b.homeStore &&
    (a.companyId ?? "") === (b.companyId ?? "") &&
    JSON.stringify(a.assignedStores ?? []) ===
      JSON.stringify(b.assignedStores ?? [])
  );
}
