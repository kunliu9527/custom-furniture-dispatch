"use client";

import { useAuth } from "@/context/auth-context";
import { useOrders } from "@/context/orders-context";
import {
  buildManagerNotifications,
  notificationBadgeCount,
} from "@/lib/manager-notifications";
import { scopeOrdersForUser } from "@/lib/permissions";
import { canReceiveManagerNotifications } from "@/lib/weekly-digest-persistence";
import Link from "next/link";
import { useMemo, useState } from "react";

export function ManagerNotificationBell() {
  const { user } = useAuth();
  const { orders } = useOrders();
  const [open, setOpen] = useState(false);

  const scopedOrders = useMemo(
    () => scopeOrdersForUser(orders, user),
    [orders, user],
  );

  const items = useMemo(
    () =>
      canReceiveManagerNotifications(user)
        ? buildManagerNotifications(scopedOrders, user?.username)
        : [],
    [scopedOrders, user],
  );

  const count = notificationBadgeCount(items);

  if (!canReceiveManagerNotifications(user)) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg px-2.5 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        aria-label="管理通知"
      >
        <span className="text-xs font-medium">通知</span>
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="关闭"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-1 w-72 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
            <p className="px-3 py-1 text-xs font-semibold text-slate-500">
              管理提醒
            </p>
            {items.length === 0 ? (
              <p className="px-3 py-4 text-xs text-slate-400">暂无待处理提醒</p>
            ) : (
              <ul className="max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block px-3 py-2 hover:bg-slate-50"
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.detail}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
