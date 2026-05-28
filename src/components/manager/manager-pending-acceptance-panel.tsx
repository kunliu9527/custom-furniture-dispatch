"use client";

import {
  DESIGNER_ACCEPTANCE_HOURS,
  isAcceptanceOverdue,
} from "@/lib/designer-load";
import type { Order } from "@/lib/types";

interface ManagerPendingAcceptancePanelProps {
  orders: Order[];
  onSelectDesigner?: (designer: string) => void;
}

export function ManagerPendingAcceptancePanel({
  orders,
  onSelectDesigner,
}: ManagerPendingAcceptancePanelProps) {
  const pending = orders.filter(
    (o) => o.status === "待量尺" && !o.designerAcceptedAt,
  );
  if (pending.length === 0) return null;

  const overdue = pending.filter((o) => isAcceptanceOverdue(o));

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-4">
      <h2 className="text-sm font-semibold text-amber-900">
        待接单确认（{pending.length}）
        {overdue.length > 0 ? (
          <span className="ml-2 font-normal text-amber-700">
            · 超 {DESIGNER_ACCEPTANCE_HOURS}h 未确认 {overdue.length} 笔
          </span>
        ) : null}
      </h2>
      <ul className="mt-3 max-h-36 space-y-2 overflow-y-auto">
        {pending.slice(0, 10).map((order) => (
          <li
            key={order.id}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-100 bg-white/90 px-3 py-2 text-xs"
          >
            {isAcceptanceOverdue(order) ? (
              <span className="rounded bg-amber-600 px-1.5 py-0.5 font-medium text-white">
                超时
              </span>
            ) : (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">
                待确认
              </span>
            )}
            <span className="font-medium text-slate-900">{order.customerName}</span>
            {onSelectDesigner ? (
              <button
                type="button"
                onClick={() => onSelectDesigner(order.designer)}
                className="font-medium text-violet-700 hover:underline"
              >
                {order.designer}
              </button>
            ) : (
              <span className="text-violet-700">{order.designer}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
