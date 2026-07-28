import type { StoreName } from "./types";
import type { SessionUser } from "./permissions";
import { getEffectiveDispatcherRoster } from "./dispatchers";
import type { StaffRecord } from "./staff-roster";
import {
  hasFullOrderScope,
  hasGlobalDispatcherLookup,
  hasStoreDispatcherLookup,
  hasStoreLevelLookupScope,
  isAcceptanceManagerAccess,
  isInstallerSession,
  isPersonalDispatcherLookup,
  resolveAssignedStoresForUser,
  resolveManagedStoreForLookup,
  resolveUserHomeStore,
} from "./permissions";
import { getDesignerHomeStore } from "./designers";
import type { DesignerName } from "./types";

/**
 * 登录后默认入口：一线角色直达主战场，管理岗仍进今日工作台总览。
 */
export function getDefaultPathForSession(user: SessionUser): string {
  if (isAcceptanceManagerAccess(user) || isInstallerSession(user)) {
    return "/delivery";
  }
  if (user.role === "designer" && user.accessLevel === "personal") {
    return "/designer";
  }
  if (user.role === "dispatcher" && user.accessLevel === "personal") {
    return "/admin";
  }
  if (user.accessLevel === "store_manager") {
    return "/admin";
  }
  return "/";
}

/** 按派单人查找默认选中：店长权限优先本人（名册内），否则全部；个人派单人仅本人 */
export function getDefaultDispatcherFilter(
  user: SessionUser | null,
  staffRecords: StaffRecord[] = [],
): string | "全部" {
  if (!user) return "全部";
  if (isPersonalDispatcherLookup(user)) return user.displayName;
  if (hasGlobalDispatcherLookup(user) || hasStoreDispatcherLookup(user)) {
    const inRoster = getEffectiveDispatcherRoster(staffRecords).some(
      (d) => d.name === user.displayName,
    );
    return inRoster ? user.displayName : "全部";
  }
  return "全部";
}

export function getDefaultDesignerFilter(
  user: SessionUser | null,
): DesignerName | "全部" {
  if (!user) return "全部";
  if (user.role === "designer" && user.accessLevel === "personal") {
    return user.displayName as DesignerName;
  }
  return "全部";
}

export function getDesignerDefaultName(
  user: SessionUser | null,
): DesignerName | null {
  if (!user || user.role !== "designer") return null;
  return user.displayName as DesignerName;
}

export function getManagerRoleDefaults(
  user: SessionUser | null,
  staffRecords: StaffRecord[] = [],
): {
  designerFilter: DesignerName | "全部";
  storeFilter: StoreName | "全部";
  dispatcherFilter: string | "全部";
} {
  if (!user || hasFullOrderScope(user)) {
    return {
      designerFilter: "全部",
      storeFilter: "全部",
      dispatcherFilter: getDefaultDispatcherFilter(user, staffRecords),
    };
  }

  if (hasStoreLevelLookupScope(user)) {
    const assigned = resolveAssignedStoresForUser(user);
    const store =
      assigned.length === 1
        ? assigned[0]
        : assigned.length > 1
          ? ("全部" as const)
          : (resolveManagedStoreForLookup(user) ?? resolveUserHomeStore(user));
    return {
      designerFilter: "全部",
      storeFilter: store,
      dispatcherFilter: getDefaultDispatcherFilter(user, staffRecords),
    };
  }

  if (user.role === "designer") {
    const store =
      user.homeStore ??
      getDesignerHomeStore(user.displayName as DesignerName);
    return {
      designerFilter: user.displayName as DesignerName,
      storeFilter: store,
      dispatcherFilter: getDefaultDispatcherFilter(user, staffRecords),
    };
  }

  if (user.role === "dispatcher" && user.homeStore) {
    return {
      designerFilter: "全部",
      storeFilter: user.homeStore,
      dispatcherFilter: getDefaultDispatcherFilter(user, staffRecords),
    };
  }

  return {
    designerFilter: "全部",
    storeFilter: "全部",
    dispatcherFilter: getDefaultDispatcherFilter(user, staffRecords),
  };
}
