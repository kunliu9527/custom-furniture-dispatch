import type { UserRole } from "./staff-roster";
import type { StoreName } from "./types";
import type { SessionUser } from "./permissions";
import { getDispatcherHomeStore, getEffectiveDispatcherRoster } from "./dispatchers";
import type { StaffRecord } from "./staff-roster";
import {
  hasFullOrderScope,
  hasGlobalDispatcherLookup,
  hasStoreDispatcherLookup,
  hasStoreLevelLookupScope,
  isInstallerSession,
  isPersonalDispatcherLookup,
  resolveAssignedStoresForUser,
  resolveManagedStoreForLookup,
  resolveUserHomeStore,
} from "./permissions";
import { getDesignerHomeStore } from "./designers";
import type { DesignerName } from "./types";

/** 登录后默认进入的板块 */
export function getDefaultPathForSession(user: SessionUser): string {
  if (user.accessLevel === "acceptance_manager") {
    return "/delivery";
  }
  if (user.accessLevel === "personal" && isInstallerSession(user)) {
    return "/delivery";
  }
  if (
    user.accessLevel === "admin" ||
    user.accessLevel === "design_manager" ||
    user.accessLevel === "general_manager"
  ) {
    return "/manager";
  }
  switch (user.role) {
    case "admin":
    case "design_manager":
      return "/manager";
    case "dispatcher":
      return "/admin";
    case "designer":
      return "/designer";
    default:
      return "/";
  }
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
