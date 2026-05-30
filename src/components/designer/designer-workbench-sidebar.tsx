"use client";

import { DesignerSidebar } from "@/components/designer/designer-sidebar";
import { DesignerSwitcher } from "@/components/orders/designer-switcher";
import type { DesignerSidebarFilter } from "@/lib/designer-sidebar-filter";
import type { DesignerName, StoreName } from "@/lib/types";

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
          <p className="vi-label-caps text-indigo-700/80">
            {showSwitcher ? "当前查看设计师" : "当前登录设计师"}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-zinc-500">
            所在门店
            <span className="ml-1 font-semibold text-indigo-600">{homeStore}</span>
          </p>
        </div>
        {showSwitcher ? (
          <DesignerSwitcher
            value={effectiveDesigner}
            onChange={onDesignerChange}
            stores={designerLookupStores}
          />
        ) : (
          <p className="truncate rounded-lg bg-gradient-to-r from-indigo-50/80 to-violet-50/60 px-2.5 py-2 text-sm font-semibold tracking-tight text-indigo-950 ring-1 ring-indigo-100">
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
