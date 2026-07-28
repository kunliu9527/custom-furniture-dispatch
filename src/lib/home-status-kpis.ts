import type { Order, OrderStatus } from "@/lib/types";
import {
  canAccessAdminPage,
  hasFullOrderScope,
  scopeOrdersForAdminBoard,
  scopeOrdersForUser,
  type SessionUser,
} from "@/lib/permissions";
import {
  canAccessDeliveryPage,
  canAccessDesignerPage,
  canAccessEvaluationPage,
  canAccessManagerPage,
  type NavHref,
} from "@/lib/nav-access";

export type HomeKpiTone = "neutral" | "blue" | "orange" | "green" | "red";

export interface HomeKpiItem {
  id: string;
  label: string;
  count: number;
  tone: HomeKpiTone;
  /** 仅指向当前用户可访问的路径（可带 query） */
  href: string;
  /** 卡片脚注，默认「进入处理」 */
  actionLabel?: string;
}

export type HomeOverviewSectionId = "fulfillment" | "sales";

export interface HomeOverviewSection {
  id: HomeOverviewSectionId;
  title: string;
  description: string;
  /** 有数据时渲染 KPI；空数组显示占位说明（便于后续接销售） */
  items: HomeKpiItem[];
  emptyHint?: string;
}

function scopedOrders(orders: Order[], user: SessionUser): Order[] {
  if (
    user.accessLevel === "design_manager" ||
    user.accessLevel === "general_manager" ||
    user.accessLevel === "admin" ||
    user.accessLevel === "store_manager"
  ) {
    return scopeOrdersForAdminBoard(orders, user);
  }
  return scopeOrdersForUser(orders, user);
}

function countStatus(orders: Order[], statuses: OrderStatus[]): number {
  const set = new Set(statuses);
  return orders.reduce((n, o) => (set.has(o.status) ? n + 1 : n), 0);
}

function canOpen(user: SessionUser, href: NavHref): boolean {
  switch (href) {
    case "/admin":
      return canAccessAdminPage(user);
    case "/designer":
      return canAccessDesignerPage(user);
    case "/manager":
      return canAccessManagerPage(user);
    case "/delivery":
      return canAccessDeliveryPage(user);
    case "/evaluation":
      return canAccessEvaluationPage(user);
    default:
      return false;
  }
}

/** 按优先级选第一个可访问板块；都不可访问则回首页 */
function pickAccessible(
  user: SessionUser,
  candidates: Array<NavHref | string>,
): string {
  for (const href of candidates) {
    const path = (href.split("?")[0] || href) as NavHref;
    if (
      path === "/admin" ||
      path === "/designer" ||
      path === "/manager" ||
      path === "/delivery" ||
      path === "/evaluation"
    ) {
      if (canOpen(user, path)) return href;
    }
  }
  return "/";
}

function primaryBoard(user: SessionUser): NavHref {
  if (user.accessLevel === "acceptance_manager") return "/delivery";
  if (
    user.accessLevel === "admin" ||
    user.accessLevel === "design_manager" ||
    user.accessLevel === "general_manager" ||
    hasFullOrderScope(user)
  ) {
    return "/manager";
  }
  if (user.role === "dispatcher") return "/admin";
  if (user.role === "designer") return "/designer";
  return "/delivery";
}

function buildFulfillmentItems(
  user: SessionUser,
  orders: Order[],
): HomeKpiItem[] {
  const scoped = scopedOrders(orders, user);
  const board = primaryBoard(user);

  const undispatched = countStatus(scoped, ["未派单"]);
  const designing = countStatus(scoped, [
    "待量尺",
    "已量尺",
    "已出图",
    "待签约",
  ]);
  const delivering = countStatus(scoped, ["已签约", "已下单", "已安装"]);
  const accepted = countStatus(scoped, ["已验收"]);
  const refund = countStatus(scoped, ["待退单", "已退单"]);

  const items: HomeKpiItem[] = [
    {
      id: "undispatched",
      label: "未派单",
      count: undispatched,
      tone: undispatched > 0 ? "orange" : "neutral",
      href: pickAccessible(user, [
        user.role === "dispatcher" || board === "/admin" ? "/admin" : board,
        "/admin",
        "/manager",
        "/",
      ]),
    },
    {
      id: "designing",
      label: "设计在途",
      count: designing,
      tone: designing > 0 ? "blue" : "neutral",
      href: pickAccessible(user, [
        user.role === "designer" ? "/designer" : null,
        board === "/manager" ? "/manager" : null,
        "/designer",
        "/manager",
        "/admin",
      ].filter(Boolean) as string[]),
    },
    {
      id: "delivering",
      label: "交付在途",
      count: delivering,
      tone: delivering > 0 ? "blue" : "neutral",
      href: pickAccessible(user, [
        "/delivery",
        "/manager?section=lookup",
        "/designer",
        "/admin",
      ]),
    },
    {
      id: "accepted",
      label: "已验收",
      count: accepted,
      tone: "green",
      href: pickAccessible(user, [
        "/evaluation",
        "/delivery",
        "/manager?section=lookup",
        "/designer",
        "/admin",
      ]),
    },
    {
      id: "refund",
      label: "退单",
      count: refund,
      tone: refund > 0 ? "red" : "neutral",
      href: pickAccessible(user, [
        board === "/admin" ? "/admin" : "/manager",
        "/manager",
        "/admin",
      ]),
    },
  ];

  return items;
}

/**
 * 首页概览：仅履约进程（销售指标未接入前不展示空壳分区）。
 */
export function buildHomeOverviewSections(
  user: SessionUser | null,
  orders: Order[],
): HomeOverviewSection[] {
  if (!user) return [];

  return [
    {
      id: "fulfillment",
      title: "履约进程",
      description: "按订单状态汇总，点击卡片进入你有权限的工作台",
      items: buildFulfillmentItems(user, orders),
    },
  ];
}

/** @deprecated 使用 buildHomeOverviewSections */
export function buildHomeStatusKpis(
  user: SessionUser | null,
  orders: Order[],
): HomeKpiItem[] {
  return buildHomeOverviewSections(user, orders).flatMap((s) => s.items);
}

export function kpiToneStyles(tone: HomeKpiTone): {
  value: string;
  chip: string;
  bg: string;
} {
  switch (tone) {
    case "orange":
      return {
        value: "var(--system-orange)",
        chip: "color-mix(in srgb, var(--system-orange) 14%, transparent)",
        bg: "var(--bg-primary)",
      };
    case "blue":
      return {
        value: "var(--system-blue)",
        chip: "color-mix(in srgb, var(--system-blue) 12%, transparent)",
        bg: "var(--bg-primary)",
      };
    case "green":
      return {
        value: "var(--system-green)",
        chip: "color-mix(in srgb, var(--system-green) 12%, transparent)",
        bg: "var(--bg-primary)",
      };
    case "red":
      return {
        value: "var(--system-red)",
        chip: "color-mix(in srgb, var(--system-red) 12%, transparent)",
        bg: "var(--bg-primary)",
      };
    default:
      return {
        value: "var(--label-primary)",
        chip: "var(--fill-tertiary)",
        bg: "var(--bg-primary)",
      };
  }
}
