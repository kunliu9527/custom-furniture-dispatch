"use client";

import { useAuth } from "@/context/auth-context";
import { useOrders } from "@/context/orders-context";
import { notificationBadgeCount } from "@/lib/manager-notifications";
import { managerAnomalyTodosHref } from "@/lib/manager-deep-link";
import { scopeOrdersForUser } from "@/lib/permissions";
import {
  canReceiveManagerNotifications,
  isDigestUnread,
} from "@/lib/weekly-digest-persistence";
import { getWeekId } from "@/lib/week-filter";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

function BadgeCount({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function ManagerNotificationBell() {
  const { user } = useAuth();
  const { orders } = useOrders();
  const router = useRouter();
  const pathname = usePathname();

  const anomalyHref = managerAnomalyTodosHref();

  const scopedOrders = useMemo(
    () => scopeOrdersForUser(orders, user),
    [orders, user],
  );

  const anomalyCount = useMemo(
    () => notificationBadgeCount(scopedOrders, user?.username),
    [scopedOrders, user?.username],
  );

  const digestUnread = useMemo(
    () =>
      canReceiveManagerNotifications(user) &&
      isDigestUnread(user?.username, getWeekId()),
    [user],
  );

  const digestCount = digestUnread ? 1 : 0;

  if (!canReceiveManagerNotifications(user)) return null;

  function goAnomalyTodos() {
    router.push(anomalyHref);
  }

  return (
    <div className="flex items-center gap-1">
      <span
        className="relative rounded-lg px-2.5 py-2 text-slate-500"
        aria-label={
          digestCount > 0 ? "本周简报未读" : "本周简报已读"
        }
        title={digestCount > 0 ? "本周简报未读" : "本周简报"}
      >
        <span className="text-xs font-medium">简报</span>
        <BadgeCount count={digestCount} />
      </span>
      <Link
        href={anomalyHref}
        onClick={(event) => {
          event.preventDefault();
          goAnomalyTodos();
        }}
        className="relative rounded-lg px-2.5 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        aria-label={
          anomalyCount > 0
            ? `异常待办 ${anomalyCount} 项，前往处理`
            : "前往异常待办"
        }
        title={
          anomalyCount > 0
            ? `${anomalyCount} 项异常待办`
            : pathname === "/manager"
              ? "异常待办（暂无待处理项）"
              : "异常待办"
        }
      >
        <span className="text-xs font-medium">通知</span>
        <BadgeCount count={anomalyCount} />
      </Link>
    </div>
  );
}
