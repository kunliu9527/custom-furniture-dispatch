"use client";

import type { DeliveryViewMode } from "@/lib/delivery-stats";
import { getVisibleDeliveryViewModes } from "@/lib/lookup-scope";
import type { SessionUser } from "@/lib/permissions";

const ITEMS: { id: DeliveryViewMode; title: string; hint: string }[] = [
  { id: "status", title: "按状态查找", hint: "已下单、已安装、已验收" },
  { id: "installer", title: "按安装师查找", hint: "安装师汇总与均分" },
  { id: "store", title: "按门店查找", hint: "门店交付与验收" },
  { id: "acceptance", title: "客户验收", hint: "扫码评价明细" },
];

interface DeliverySidebarProps {
  viewMode: DeliveryViewMode;
  onViewModeChange: (mode: DeliveryViewMode) => void;
  user?: SessionUser | null;
}

export function DeliverySidebar({
  viewMode,
  onViewModeChange,
  user = null,
}: DeliverySidebarProps) {
  const visibleIds = getVisibleDeliveryViewModes(user);
  const visibleItems = ITEMS.filter((item) => visibleIds.includes(item.id));

  return (
    <div className="space-y-1.5">
      <p className="vi-label-caps px-0.5">交付查询</p>
      <ul className="space-y-0.5">
        {visibleItems.map((item) => {
          const active = viewMode === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onViewModeChange(item.id)}
                className={`vi-sidebar-item vi-sidebar-item-stack ${active ? "vi-sidebar-item-active" : ""}`}
              >
                <span className="vi-sidebar-item-title">{item.title}</span>
                <span className="vi-sidebar-item-hint">{item.hint}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
