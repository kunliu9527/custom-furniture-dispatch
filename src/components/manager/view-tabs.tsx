"use client";

import {
  WorkbenchMobileChips,
  type WorkbenchMobileChipItem,
} from "@/components/workbench/workbench-mobile-chips";
import type { ViewMode } from "@/lib/manager-stats";

const tabs: { id: ViewMode; label: string; description: string }[] = [
  {
    id: "status",
    label: "按状态查找",
    description: "按订单状态查找，结果区展示对应统计",
  },
  {
    id: "dispatcher",
    label: "按派单人查找",
    description: "按派单人姓名查找，结果区展示对应统计",
  },
  {
    id: "designer",
    label: "按设计师查找",
    description: "按设计师姓名查找，结果区展示各状态统计",
  },
  {
    id: "store",
    label: "按门店汇总",
    description: "按派单人所属门店汇总（跨店单计入派单人店）",
  },
];

interface ViewTabsProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  modes?: ViewMode[];
}

export function ViewTabs({ value, onChange, modes }: ViewTabsProps) {
  const visible = modes ?? tabs.map((t) => t.id);
  const visibleTabs = tabs.filter((tab) => visible.includes(tab.id));
  const chips: WorkbenchMobileChipItem[] = visibleTabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    hint: tab.description,
  }));

  return (
    <>
      <div className="lg:hidden">
        <WorkbenchMobileChips
          items={chips}
          value={value}
          onChange={(id) => onChange(id as ViewMode)}
        />
      </div>
      <div
        className={`hidden gap-3 lg:grid ${
          visibleTabs.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
        }`}
      >
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`vi-view-tab ${value === tab.id ? "vi-view-tab-active" : ""}`}
          >
            <p
              className={`text-sm font-semibold ${
                value === tab.id ? "" : "text-zinc-900"
              }`}
            >
              {tab.label}
            </p>
            <p
              className={`mt-1 text-xs ${
                value === tab.id ? "" : "text-zinc-500"
              }`}
            >
              {tab.description}
            </p>
          </button>
        ))}
      </div>
    </>
  );
}
