import type { AdminViewMode } from "./admin-stats";
import type { SessionUser } from "./permissions";
import {
  canAccessAdminPage,
  canAccessDeliveryPage,
  canManageStaff,
  isAcceptanceManagerAccess,
  isInstallerSession,
  isPersonalAccess,
  isPersonalManagerLookupOnly,
} from "./permissions";

/** 全部板块入口(角色可见性见 getVisibleNavLinks) */
export type NavHref =
  | "/admin"
  | "/designer"
  | "/manager"
  | "/delivery"
  | "/evaluation";

export interface NavLinkItem {
  href: NavHref;
  label: string;
}

export const NAV_LINKS: NavLinkItem[] = [
  { href: "/admin", label: "新客户开发" },
  { href: "/designer", label: "设计师工作台" },
  { href: "/manager", label: "项目进程管理" },
  { href: "/delivery", label: "验收与交付" },
  { href: "/evaluation", label: "综合系统看板" },
];

export function canAccessStoreDispatchPage(user: SessionUser | null): boolean {
  return canAccessAdminPage(user);
}

function isExecutiveNavUser(user: SessionUser): boolean {
  return (
    user.accessLevel === "design_manager" ||
    user.accessLevel === "general_manager" ||
    user.accessLevel === "admin"
  );
}

export function canAccessDesignerPage(user: SessionUser | null): boolean {
  if (!user) return false;
  if (isAcceptanceManagerAccess(user) || isInstallerSession(user)) return false;
  if (isExecutiveNavUser(user)) return true;
  return user.role === "designer";
}

/** 项目进程管理：经理/店长可编辑或只读；本人派单/设计仅本人单只读查询 */
export function canAccessManagerPage(user: SessionUser | null): boolean {
  if (!user || isAcceptanceManagerAccess(user) || isInstallerSession(user)) {
    return false;
  }
  if (isPersonalManagerLookupOnly(user)) return true;
  return (
    user.accessLevel === "design_manager" ||
    user.accessLevel === "general_manager" ||
    user.accessLevel === "admin" ||
    user.accessLevel === "store_manager"
  );
}

/** 综合系统看板：本人不可见；店长/设计经理/总经理可看 */
export function canAccessEvaluationPage(user: SessionUser | null): boolean {
  if (!user || isPersonalAccess(user) || isAcceptanceManagerAccess(user)) {
    return false;
  }
  if (user.accessLevel === "admin") return true;
  if (user.accessLevel === "store_manager") return true;
  if (user.accessLevel === "design_manager") return true;
  if (user.accessLevel === "general_manager") return true;
  return false;
}

export { canAccessDeliveryPage };

export function canViewOtherDesignersOrders(user: SessionUser | null): boolean {
  return (
    user?.accessLevel === "design_manager" ||
    user?.accessLevel === "general_manager" ||
    user?.accessLevel === "admin"
  );
}

/** 按角色过滤后的导航入口 */
export function getVisibleNavLinks(user: SessionUser | null): NavLinkItem[] {
  if (!user) return [];
  return NAV_LINKS.filter((item) => {
    if (item.href === "/admin") return canAccessStoreDispatchPage(user);
    if (item.href === "/designer") return canAccessDesignerPage(user);
    if (item.href === "/manager") return canAccessManagerPage(user);
    if (item.href === "/delivery") return canAccessDeliveryPage(user);
    if (item.href === "/evaluation") return canAccessEvaluationPage(user);
    return true;
  });
}

/** 新建派单/客户 Tab */
export function getVisibleAdminViewModes(
  user: SessionUser | null,
): AdminViewMode[] {
  if (!user) return ["dispatch"];
  const modes: AdminViewMode[] = ["dispatch", "orderLookup"];
  if (canManageStaff(user)) {
    modes.push("staff", "branding", "dataTools");
  }
  return modes;
}
