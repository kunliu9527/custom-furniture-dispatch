"use client";

import { DesignerSidebar } from "@/components/designer/designer-sidebar";
import { DesignerSwitcher } from "@/components/orders/designer-switcher";
import {
  WorkbenchMobileChips,
  type WorkbenchMobileChipItem,
} from "@/components/workbench/workbench-mobile-chips";
import { FLOW_ORDER_STATUSES, REFUND_ORDER_STATUSES } from "@/lib/constants";
import type { DesignerSidebarFilter } from "@/lib/designer-sidebar-filter";
import type { DesignerName, OrderStatus, StoreName } from "@/lib/types";

const DESIGNER_FLOW_STATUSES = FLOW_ORDER_STATUSES.filter(
  (status) => status !== "未派单",
);

const STATUS_ITEMS: { id: DesignerSidebarFilter; title: string }[] = [
  { id: "全部", title: "全部" },
  ...DESIGNER_FLOW_STATUSES.map((status) => ({ id: status, title: status })),
  ...REFUND_ORDER_STATUSES.map((status) => ({ id: status, title: status })),
  { id: "增补单", title: "增补单" },
];

interface DesignerWorkbenchSidebarProps {
  showSwitcher: boolean;
  effectiveDesigner: DesignerName;
  onDesignerChange: (designer: DesignerName) => void;
  designerLookupStores?: StoreName[] | null;
  homeStore: string;
  myOrderCount: number;
  statusFilter: DesignerSidebarFilter;
  onStatusFilterChange: (status: DesignerSidebarFilter) => void;
  counts: Record<string, number>;
}

export function DesignerWorkbenchSidebar({
  showSwitcher,
  effectiveDesigner,
  onDesignerChange,
  designerLookupStores,
  homeStore,
  myOrderCount,
  statusFilter,
  onStatusFilterChange,
  counts,
}: DesignerWorkbenchSidebarProps) {
  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="shrink-0 space-y-2 border-b border-[var(--vi-border)] pb-3">
        <div>
          <p className="vi-label-caps text-blue-700/80">
            {showSwitcher ? "当前查看设计师" : "当前登录设计师"}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-zinc-500">
            所在门店
            <span className="ml-1 font-semibold text-blue-600">{homeStore}</span>
          </p>
        </div>
        {showSwitcher ? (
          <DesignerSwitcher
            value={effectiveDesigner}
            onChange={onDesignerChange}
            stores={designerLookupStores}
          />
        ) : (
          <p className="truncate rounded-lg bg-blue-50 px-2.5 py-2 text-sm font-semibold tracking-tight text-slate-900 ring-1 ring-blue-100">
            {effectiveDesigner}
          </p>
        )}
      </div>

      <DesignerSidebar
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        counts={counts}
        total={myOrderCount}
      />
    </div>
  );
}

export function DesignerMobileNav({
  showSwitcher,
  effectiveDesigner,
  onDesignerChange,
  designerLookupStores,
  homeStore,
  myOrderCount,
  statusFilter,
  onStatusFilterChange,
  counts,
}: DesignerWorkbenchSidebarProps) {
  const chips: WorkbenchMobileChipItem[] = STATUS_ITEMS.map((item) => ({
    id: item.id,
    label: item.title,
    badge:
      item.id === "全部"
        ? myOrderCount
        : item.id === "增补单"
          ? undefined
          : (counts[item.id] ?? 0),
  }));

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-[var(--vi-border)] bg-white px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700/80">
          {showSwitcher ? "当前查看设计师" : "当前登录设计师"}
        </p>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          所在门店
          <span className="ml-1 font-semibold text-blue-600">{homeStore}</span>
        </p>
        {showSwitcher ? (
          <div className="mt-2">
            <DesignerSwitcher
              value={effectiveDesigner}
              onChange={onDesignerChange}
              stores={designerLookupStores}
            />
          </div>
        ) : (
          <p className="mt-1 truncate text-sm font-semibold text-slate-900">
            {effectiveDesigner}
          </p>
        )}
      </div>
      <WorkbenchMobileChips
        items={chips}
        value={statusFilter}
        onChange={(id) => onStatusFilterChange(id as DesignerSidebarFilter)}
      />
    </div>
  );
}
