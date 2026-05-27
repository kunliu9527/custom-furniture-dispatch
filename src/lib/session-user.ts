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
  if (!staff) return session;

  const auth = staffToAuthUser(staff);
  return {
    username: auth.username,
    displayName: auth.displayName,
    role: auth.role,
    accessLevel: auth.accessLevel,
    homeStore: auth.homeStore,
    assignedStores: auth.assignedStores,
  };
}

/** 用于看板筛选重置：人员配置变更时触发 */
export function getSessionScopeKey(user: SessionUser | null): string {
  if (!user) return "";
  return JSON.stringify({
    username: user.username,
    accessLevel: user.accessLevel,
    homeStore: user.homeStore,
    assignedStores: user.assignedStores ?? [],
  });
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
    a.homeStore === b.homeStore &&
    JSON.stringify(a.assignedStores ?? []) ===
      JSON.stringify(b.assignedStores ?? [])
  );
}
