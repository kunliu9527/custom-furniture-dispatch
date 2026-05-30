"use client";

import { FLOW_ORDER_STATUSES, REFUND_ORDER_STATUSES } from "@/lib/constants";
import type { DesignerSidebarFilter } from "@/lib/designer-sidebar-filter";
import type { OrderStatus } from "@/lib/types";

const DESIGNER_FLOW_STATUSES = FLOW_ORDER_STATUSES.filter(
  (status) => status !== "未派单",
);

const STATUS_ITEMS: { id: OrderStatus | "全部"; title: string }[] = [
  { id: "全部", title: "全部订单" },
  ...DESIGNER_FLOW_STATUSES.map((status) => ({ id: status, title: status })),
];

const AFTER_SUPPLEMENT_ITEMS: { id: OrderStatus; title: string }[] =
  REFUND_ORDER_STATUSES.map((status) => ({ id: status, title: status }));

interface DesignerSidebarProps {
  statusFilter: DesignerSidebarFilter;
  onStatusFilterChange: (status: DesignerSidebarFilter) => void;
  counts: Record<string, number>;
  total: number;
}

function SidebarButton({
  active,
  title,
  count,
  onClick,
}: {
  active: boolean;
  title: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`vi-sidebar-item ${active ? "vi-sidebar-item-active" : ""}`}
    >
      <span className="vi-sidebar-item-title">{title}</span>
      <span className="vi-sidebar-item-count">{count}</span>
    </button>
  );
}

export function DesignerSidebar({
  statusFilter,
  onStatusFilterChange,
  counts,
  total,
}: DesignerSidebarProps) {
  return (
    <div className="space-y-1.5">
      <p className="vi-label-caps px-0.5">我的订单</p>
      <ul className="space-y-0.5">
        {STATUS_ITEMS.map((item) => {
          const active = statusFilter === item.id;
          const count =
            item.id === "全部" ? total : (counts[item.id] ?? 0);
          return (
            <li key={item.id}>
              <SidebarButton
                active={active}
                title={item.title}
                count={count}
                onClick={() => onStatusFilterChange(item.id)}
              />
            </li>
          );
        })}
        {AFTER_SUPPLEMENT_ITEMS.length > 0 ? (
          <li className="pt-2">
            <p className="vi-label-caps mb-1 px-0.5">售后</p>
          </li>
        ) : null}
        {AFTER_SUPPLEMENT_ITEMS.map((item) => {
          const active = statusFilter === item.id;
          const count = counts[item.id] ?? 0;
          return (
            <li key={item.id}>
              <SidebarButton
                active={active}
                title={item.title}
                count={count}
                onClick={() => onStatusFilterChange(item.id)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
