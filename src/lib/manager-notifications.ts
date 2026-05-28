import { getManagerAlerts } from "./manager-alerts";
import {
  getPendingAcceptanceOrders,
  isAcceptanceOverdue,
} from "./designer-load";
import { getWeekId } from "./week-filter";
import { isDigestUnread } from "./weekly-digest-persistence";
import type { Order } from "./types";

export type NotificationKind =
  | "timeout"
  | "accept_overdue"
  | "weekly_digest";

export interface ManagerNotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  href: string;
  priority: number;
}

export function buildManagerNotifications(
  orders: Order[],
  username: string | undefined,
  now = new Date(),
): ManagerNotificationItem[] {
  const items: ManagerNotificationItem[] = [];
  const weekId = getWeekId(now);

  if (isDigestUnread(username, weekId)) {
    items.push({
      id: "weekly-digest",
      kind: "weekly_digest",
      title: "本周管理简报待查看",
      detail: "含下单、超时、贡献与建议动作",
      href: "/manager",
      priority: 10,
    });
  }

  const alerts = getManagerAlerts(orders, now);
  if (alerts.length > 0) {
    items.push({
      id: "timeouts",
      kind: "timeout",
      title: `${alerts.length} 笔流程超时`,
      detail: alerts
        .slice(0, 2)
        .map((a) => `${a.customerName}（${a.designer}）`)
        .join(" · "),
      href: "/manager",
      priority: 30,
    });
  }

  const overdue = getPendingAcceptanceOrders(orders).filter((o) =>
    isAcceptanceOverdue(o, now),
  );
  if (overdue.length > 0) {
    items.push({
      id: "accept-overdue",
      kind: "accept_overdue",
      title: `${overdue.length} 笔接单确认超时`,
      detail: overdue
        .slice(0, 2)
        .map((o) => `${o.customerName} → ${o.designer}`)
        .join(" · "),
      href: "/manager",
      priority: 25,
    });
  }

  return items.sort((a, b) => b.priority - a.priority);
}

export function notificationBadgeCount(items: ManagerNotificationItem[]): number {
  return items.length;
}
