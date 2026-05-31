"use client";

import { ORDER_STATUSES } from "@/lib/constants";
import { countOrdersByStatus } from "@/lib/manager-stats";
import type { Order, OrderStatus } from "@/lib/types";

const FLOW_STATUS_ORDER: OrderStatus[] = ORDER_STATUSES.filter(
  (s) => s !== "已退单",
);

interface DigestFlowStatusBarProps {
  orders: Order[];
}

export function DigestFlowStatusBar({ orders }: DigestFlowStatusBarProps) {
  const counts = countOrdersByStatus(orders);
  const total = orders.length;

  if (total === 0) {
    return (
      <p className="text-xs text-slate-500">登录范围内暂无订单</p>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--vi-border-strong)] bg-white px-3 py-2.5 shadow-[var(--vi-shadow-xs)]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        当前流程分布 · 共 {total} 笔
      </p>
      <p className="mt-0.5 text-[10px] text-slate-400">
        登录范围内 · 不受统计周期影响
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {FLOW_STATUS_ORDER.map((status) => {
          const count = counts[status];
          if (count <= 0) return null;
          return (
            <span
              key={status}
              className="vi-chip"
            >
              <span className="text-slate-600">{status}</span>
              <span className="font-semibold tabular-nums text-slate-900">
                {count}
              </span>
            </span>
          );
        })}
        {counts["已退单"] > 0 ? (
          <span className="vi-chip border-red-200 bg-red-50">
            <span className="text-red-700">已退单</span>
            <span className="font-semibold tabular-nums text-red-800">
              {counts["已退单"]}
            </span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
