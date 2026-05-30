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
    <nav className="space-y-2 border-t border-slate-100 pt-2">
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
                    className={`w-full rounded-lg border px-2.5 py-1.5 text-left transition ${
                      isActive
                        ? "border-rose-300 bg-rose-50 ring-1 ring-rose-200"
                        : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`block text-xs font-medium leading-snug ${
                        isActive ? "text-rose-900" : "text-slate-900"
                      }`}
                    >
                      {item.title}
                    </span>
                    {item.suffix ? (
                      <span className="mt-0.5 block text-[10px] font-normal leading-snug text-slate-500">
                        {item.suffix}
                      </span>
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
