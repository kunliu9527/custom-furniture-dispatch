"use client";

import {
  DESIGNER_ACCEPTANCE_HOURS,
  isAcceptanceOverdue,
} from "@/lib/designer-load";
import { OrderAnomalyName } from "@/components/orders/order-anomaly-badges";
import { displayOrderNameColumn } from "@/lib/order-remark";
import type { Order } from "@/lib/types";

interface ManagerPendingAcceptancePanelProps {
  orders: Order[];
  onSelectDesigner?: (designer: string) => void;
  embedded?: boolean;
}

export function ManagerPendingAcceptancePanel({
  orders,
  onSelectDesigner,
  embedded = false,
}: ManagerPendingAcceptancePanelProps) {
  const pending = orders.filter(
    (o) => o.status === "待量尺" && !o.designerAcceptedAt,
  );
  if (pending.length === 0 && !embedded) return null;

  const overdue = pending.filter((o) => isAcceptanceOverdue(o));

  const wrapperClass = embedded
    ? ""
    : "rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-4";

  return (
    <div className={wrapperClass}>
      {!embedded ? (
        <h2 className="text-sm font-semibold text-amber-900">
          待接单确认（{pending.length}）
          {overdue.length > 0 ? (
            <span className="ml-2 font-normal text-amber-700">
              · 超 {DESIGNER_ACCEPTANCE_HOURS}h 未确认 {overdue.length} 笔
            </span>
          ) : null}
        </h2>
      ) : (
        <p className="mb-2 text-xs text-slate-500">
          实时待办
          {overdue.length > 0
            ? ` · 超 ${DESIGNER_ACCEPTANCE_HOURS}h 未确认 ${overdue.length} 笔`
            : ""}
        </p>
      )}

      {pending.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">暂无待接单确认</p>
      ) : (
        <ul className="mt-1 max-h-64 space-y-2 overflow-y-auto">
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
              <OrderAnomalyName
                order={order}
                defaultClassName="font-medium text-slate-900"
                includeOperationalHints={false}
              >
                {displayOrderNameColumn(order)}
              </OrderAnomalyName>
              {onSelectDesigner && order.designer ? (
                <button
                  type="button"
                  onClick={() => onSelectDesigner(order.designer!)}
                  className="font-medium text-violet-700 hover:underline"
                >
                  {order.designer}
                </button>
              ) : (
                <span className="text-violet-700">{order.designer ?? "—"}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
