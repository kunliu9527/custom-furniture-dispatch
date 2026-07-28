"use client";

import type { ManagerMainSection } from "@/lib/manager-ui-persistence";
import {
  WorkbenchMobileChips,
  type WorkbenchMobileChipItem,
} from "@/components/workbench/workbench-mobile-chips";

interface ManagerSidebarProps {
  mainSection: ManagerMainSection;
  onMainSectionChange: (section: ManagerMainSection) => void;
  /** 本人派单/设计：无工单待办，仅本周简报与订单查询 */
  personalWeeklyOnly?: boolean;
}

export function ManagerSidebar({
  mainSection,
  onMainSectionChange,
  personalWeeklyOnly = false,
}: ManagerSidebarProps) {
  const weeklyActive = mainSection === "weekly";
  const reportsActive = mainSection === "reports";
  const lookupActive = mainSection === "lookup";

  return (
    <div className="space-y-2.5">
      <div className="space-y-1">
        <p className="vi-label-caps px-0.5">总览</p>
        <button
          type="button"
          onClick={() => onMainSectionChange("weekly")}
          className={`vi-sidebar-item vi-sidebar-item-stack ${weeklyActive ? "vi-sidebar-item-active" : ""}`}
        >
          <span className="vi-sidebar-item-title">本周简报</span>
          <span className="vi-sidebar-item-hint">本周 · 上周</span>
        </button>
        {!personalWeeklyOnly ? (
          <button
            type="button"
            onClick={() => onMainSectionChange("reports")}
            className={`vi-sidebar-item vi-sidebar-item-stack ${reportsActive ? "vi-sidebar-item-active" : ""}`}
          >
            <span className="vi-sidebar-item-title">工单待办</span>
            <span className="vi-sidebar-item-hint">按时间排序 · 最新在上</span>
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onMainSectionChange("lookup")}
          className={`vi-sidebar-item vi-sidebar-item-stack ${lookupActive ? "vi-sidebar-item-active" : ""}`}
        >
          <span className="vi-sidebar-item-title">订单查询</span>
          <span className="vi-sidebar-item-hint">
            状态 · 派单人 · 设计师 · 门店
          </span>
        </button>
      </div>
    </div>
  );
}

export function ManagerMobileNav({
  mainSection,
  onMainSectionChange,
  personalWeeklyOnly = false,
}: ManagerSidebarProps) {
  const chips: WorkbenchMobileChipItem[] = [
    { id: "weekly", label: "本周简报", hint: "本周 · 上周" },
    ...(personalWeeklyOnly
      ? []
      : [{ id: "reports", label: "工单待办", hint: "最新在上" }]),
    { id: "lookup", label: "订单查询", hint: "状态 · 派单 · 设计师" },
  ];

  return (
    <WorkbenchMobileChips
      items={chips}
      value={mainSection}
      onChange={(id) => onMainSectionChange(id as ManagerMainSection)}
      layout="wrap"
    />
  );
}
