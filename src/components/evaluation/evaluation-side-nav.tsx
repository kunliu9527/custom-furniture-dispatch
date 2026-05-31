"use client";

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
