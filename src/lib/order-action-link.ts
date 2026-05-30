import { needsDesignerAcceptance } from "./designer-load";
import type { FollowUpKind } from "./follow-up";
import type { PendingConfirmKind } from "./pending-confirm";
import {
  canAccessAdminPage,
  canAssignDesigner,
  canEditOrderOnDesignerPage,
  canModifyOrderInUserScope,
  canOverrideDispatchLimit,
  isAdminAccess,
  isDesignManagerAccess,
  type SessionUser,
} from "./permissions";
import { canAccessDesignerPage, canAccessManagerPage } from "./nav-access";
import type { Order } from "./types";

export interface OrderNavigateTarget {
  href: string;
  actionLabel: string;
  canAct: boolean;
}

function adminOrderHref(orderId: string): string {
  return `/admin?view=orderLookup&orderId=${encodeURIComponent(orderId)}`;
}

function designerOrderHref(orderId: string): string {
  return `/designer?orderId=${encodeURIComponent(orderId)}`;
}

export function managerLookupHref(
  orderId: string,
  options?: { status?: string; designer?: string },
): string {
  const params = new URLSearchParams({
    section: "lookup",
    orderId,
  });
  if (options?.status) params.set("status", options.status);
  if (options?.designer) params.set("designer", options.designer);
  return `/manager?${params.toString()}`;
}

export function managerDesignerHref(designer: string): string {
  const params = new URLSearchParams({
    section: "lookup",
    view: "designer",
    designer,
  });
  return `/manager?${params.toString()}`;
}

export function adminDispatchDesignerHref(designer: string): string {
  const params = new URLSearchParams({
    view: "dispatch",
    designer,
    focus: "undispatched",
  });
  return `/admin?${params.toString()}`;
}

/** 待确认项：有权限时可跳转并操作 */
export function resolvePendingConfirmNavigate(
  user: SessionUser | null,
  order: Order,
  kind: PendingConfirmKind,
): OrderNavigateTarget | null {
  if (!user || !canModifyOrderInUserScope(user, order)) return null;

  switch (kind) {
    case "designer-accept": {
      if (
        needsDesignerAcceptance(order) &&
        canEditOrderOnDesignerPage(user, order) &&
        canAccessDesignerPage(user)
      ) {
        return {
          href: designerOrderHref(order.id),
          actionLabel: "确认接单",
          canAct: true,
        };
      }
      if (
        needsDesignerAcceptance(order) &&
        canEditOrderOnDesignerPage(user, order) &&
        canAccessAdminPage(user)
      ) {
        return {
          href: adminOrderHref(order.id),
          actionLabel: "确认接单",
          canAct: true,
        };
      }
      if (canAccessManagerPage(user)) {
        return {
          href: managerLookupHref(order.id, { status: "待量尺" }),
          actionLabel: "查看",
          canAct: false,
        };
      }
      return null;
    }
    case "undispatched": {
      if (canAssignDesigner(user, order)) {
        return {
          href: adminOrderHref(order.id),
          actionLabel: "去指派",
          canAct: true,
        };
      }
      if (canAccessManagerPage(user)) {
        return {
          href: managerLookupHref(order.id, { status: "未派单" }),
          actionLabel: "查看",
          canAct: false,
        };
      }
      return null;
    }
    case "pending-refund": {
      const canActRefund =
        (isDesignManagerAccess(user) || isAdminAccess(user)) &&
        canModifyOrderInUserScope(user, order);
      if (canActRefund) {
        return {
          href: adminOrderHref(order.id),
          actionLabel: "确认已退单",
          canAct: true,
        };
      }
      if (canAccessAdminPage(user)) {
        return {
          href: adminOrderHref(order.id),
          actionLabel: "查看",
          canAct: false,
        };
      }
      if (canAccessManagerPage(user)) {
        return {
          href: managerLookupHref(order.id, { status: "待退单" }),
          actionLabel: "查看",
          canAct: false,
        };
      }
      return null;
    }
    default:
      return null;
  }
}

export function resolveDesignerCapacityNavigate(
  user: SessionUser | null,
  designer: string,
): OrderNavigateTarget | null {
  if (!user) return null;
  if (canOverrideDispatchLimit(user) && canAccessAdminPage(user)) {
    return {
      href: adminDispatchDesignerHref(designer),
      actionLabel: "去派单确认",
      canAct: true,
    };
  }
  if (canAccessManagerPage(user)) {
    return {
      href: managerDesignerHref(designer),
      actionLabel: "查看负荷",
      canAct: false,
    };
  }
  return null;
}

function managerLookupForOrder(
  user: SessionUser | null,
  order: Order,
  actionLabel = "处理",
): OrderNavigateTarget | null {
  if (!canAccessManagerPage(user)) return null;
  return {
    href: managerLookupHref(order.id, { status: order.status }),
    actionLabel,
    canAct: true,
  };
}

/** 需跟进项：点击异常状态定位订单 */
export function resolveFollowUpNavigate(
  user: SessionUser | null,
  order: Order,
  kind: FollowUpKind,
): OrderNavigateTarget | null {
  if (!user) return null;

  switch (kind) {
    case "undispatched-stale":
      if (canAssignDesigner(user, order)) {
        return {
          href: adminOrderHref(order.id),
          actionLabel: "去指派",
          canAct: true,
        };
      }
      return managerLookupForOrder(user, order, "去指派");
    case "accept-overdue": {
      const pending = resolvePendingConfirmNavigate(
        user,
        order,
        "designer-accept",
      );
      if (pending) return pending;
      return managerLookupForOrder(user, order, "催接单");
    }
    case "refund-stale": {
      const refund = resolvePendingConfirmNavigate(
        user,
        order,
        "pending-refund",
      );
      if (refund) return refund;
      return managerLookupForOrder(user, order, "处理退单");
    }
    case "stage-timeout":
    case "install-lag":
    case "acceptance-lag":
    case "bad-acceptance":
    case "low-dimension":
      if (canModifyOrderInUserScope(user, order)) {
        if (
          (kind === "stage-timeout" && order.status === "待签约") ||
          kind === "install-lag" ||
          kind === "acceptance-lag"
        ) {
          if (canAccessAdminPage(user)) {
            return {
              href: adminOrderHref(order.id),
              actionLabel: "处理",
              canAct: true,
            };
          }
        }
        return managerLookupForOrder(user, order);
      }
      return managerLookupForOrder(user, order, "查看");
    default:
      return managerLookupForOrder(user, order, "查看");
  }
}
