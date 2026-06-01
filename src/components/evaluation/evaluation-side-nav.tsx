"use client";

import {
  WorkbenchMobileChips,
  type WorkbenchMobileChipItem,
} from "@/components/workbench/workbench-mobile-chips";
import type { EvaluationSubView } from "@/lib/evaluation-ui-persistence";
import type { ReactNode } from "react";

export interface SideNavItem {
  id: EvaluationSubView;
  title: string;
  suffix?: ReactNode;
}

export interface SideNavGroup {
  label: string;
  items: SideNavItem[];
}

interface EvaluationSideNavProps {
  groups: SideNavGroup[];
  active: EvaluationSubView;
  onSelect: (id: EvaluationSubView) => void;
}

export function EvaluationSideNav({
  groups,
  active,
  onSelect,
}: EvaluationSideNavProps) {
  return (
    <nav className="space-y-2 border-t border-[var(--vi-border-strong)] pt-2">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = active === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className={`vi-sidebar-item vi-sidebar-item-stack w-full text-left ${
                      isActive ? "vi-sidebar-item-active" : ""
                    }`}
                  >
                    <span className="vi-sidebar-item-title">{item.title}</span>
                    {item.suffix ? (
                      <span className="vi-sidebar-item-hint">{item.suffix}</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** 移动端：子视图横向 chip（排名 / 归总 / 绩效等） */
export function EvaluationSideNavMobile({
  groups,
  active,
  onSelect,
}: EvaluationSideNavProps) {
  const chips: WorkbenchMobileChipItem[] = groups.flatMap((group) =>
    group.items.map((item) => ({
      id: item.id,
      label: item.title,
      hint:
        typeof item.suffix === "string"
          ? item.suffix
          : item.suffix != null
            ? String(item.suffix)
            : undefined,
    })),
  );

  if (chips.length === 0) return null;

  return (
    <WorkbenchMobileChips
      items={chips}
      value={active}
      onChange={(id) => onSelect(id as EvaluationSubView)}
    />
  );
}
