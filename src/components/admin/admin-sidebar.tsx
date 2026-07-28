"use client";

import type { AdminViewMode } from "@/lib/admin-stats";
import {
  WorkbenchMobileChips,
  type WorkbenchMobileChipItem,
} from "@/components/workbench/workbench-mobile-chips";

const ITEMS: {
  id: AdminViewMode;
  title: string;
  hint: string;
}[] = [
  { id: "dispatch", title: "新建派单/客户", hint: "新建与未派单指派" },
  { id: "orderLookup", title: "订单状态查询", hint: "全状态检索" },
  { id: "staff", title: "人员管理", hint: "名册与岗位" },
  { id: "branding", title: "公司名修改", hint: "首页文案" },
  { id: "dataTools", title: "数据工具", hint: "备份·导出·重复检测" },
];

interface AdminSidebarProps {
  viewMode: AdminViewMode;
  onViewModeChange: (mode: AdminViewMode) => void;
  allowedModes: AdminViewMode[];
}

export function AdminSidebar({
  viewMode,
  onViewModeChange,
  allowedModes,
}: AdminSidebarProps) {
  const visible = ITEMS.filter((item) => allowedModes.includes(item.id));

  return (
    <div className="space-y-1.5">
      <p className="vi-label-caps px-0.5">新客户开发</p>
      <ul className="space-y-0.5">
        {visible.map((item) => {
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
      {allowedModes.includes("dispatch") ? (
        <p className="mt-2 rounded-lg border border-amber-200/80 bg-amber-50/90 px-2.5 py-2 text-[10px] leading-snug text-amber-900">
          汇总统计见「项目进程管理」与「综合系统看板」
        </p>
      ) : null}
    </div>
  );
}

export function AdminMobileNav({
  viewMode,
  onViewModeChange,
  allowedModes,
}: AdminSidebarProps) {
  const visible = ITEMS.filter((item) => allowedModes.includes(item.id));
  const chips: WorkbenchMobileChipItem[] = visible.map((item) => ({
    id: item.id,
    label: item.title,
    hint: item.hint,
  }));

  return (
    <WorkbenchMobileChips
      items={chips}
      value={viewMode}
      onChange={(id) => onViewModeChange(id as AdminViewMode)}
      layout="wrap"
    />
  );
}
