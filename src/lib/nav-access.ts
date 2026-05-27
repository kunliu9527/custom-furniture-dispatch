import type { AdminViewMode } from "./admin-stats";
import type { SessionUser } from "./permissions";
import {
  canAccessAdminPage,
  canManageStaff,
  isPersonalAccess,
} from "./permissions";

export const NAV_LINKS = [
  { href: "/admin", label: "门店派单" },
  { href: "/designer", label: "设计师工作台" },
  { href: "/manager", label: "设计经理看板" },
  { href: "/evaluation", label: "评价看板" },
] as const;

export type NavHref = (typeof NAV_LINKS)[number]["href"];

export function canAccessStoreDispatchPage(user: SessionUser | null): boolean {
  return canAccessAdminPage(user);
}

export function canAccessDesignerPage(user: SessionUser | null): boolean {
  if (!user) return true;
  if (user.accessLevel === "design_manager" || user.accessLevel === "admin") {
    return true;
  }
  return user.role === "designer";
}

/** 设计经理看板：设计经理/管理员可编辑；店长仅本店数据只读 */
export function canAccessManagerPage(user: SessionUser | null): boolean {
  if (!user) return false;
  return (
    user.accessLevel === "design_manager" ||
    user.accessLevel === "admin" ||
    user.accessLevel === "store_manager"
  );
}

/** 评价看板：本人不可见；店长/设计经理可看（数据按门店过滤）；管理员无限制 */
export function canAccessEvaluationPage(user: SessionUser | null): boolean {
  if (!user || isPersonalAccess(user)) return false;
  if (user.accessLevel === "admin") return true;
  if (user.accessLevel === "store_manager") return true;
  if (user.accessLevel === "design_manager") return true;
  return false;
}

export function canViewOtherDesignersOrders(user: SessionUser | null): boolean {
  return (
    user?.accessLevel === "design_manager" || user?.accessLevel === "admin"
  );
}

export function getVisibleNavLinks(user: SessionUser | null) {
  if (!user) return [...NAV_LINKS];
  return NAV_LINKS.filter((item) => {
    if (item.href === "/admin") return canAccessStoreDispatchPage(user);
    if (item.href === "/designer") return canAccessDesignerPage(user);
    if (item.href === "/manager") return canAccessManagerPage(user);
    if (item.href === "/evaluation") return canAccessEvaluationPage(user);
    return true;
  });
}

/** 门店派单看板：登录后仅保留派单录入（管理员另含人员管理） */
export function getVisibleAdminViewModes(
  user: SessionUser | null,
): AdminViewMode[] {
  if (!user) return ["dispatch"];
  if (canManageStaff(user)) return ["dispatch", "staff"];
  return ["dispatch"];
}

export function getSessionBadgeLabel(user: SessionUser | null): string | undefined {
  if (!user) return undefined;
  switch (user.accessLevel) {
    case "admin":
      return "管理员";
    case "design_manager":
      return "设计经理";
    case "store_manager":
      return "店长";
    case "personal":
      if (user.role === "dispatcher") return "派单人";
      if (user.role === "designer") return "设计师";
      return undefined;
    default:
      return undefined;
  }
}
