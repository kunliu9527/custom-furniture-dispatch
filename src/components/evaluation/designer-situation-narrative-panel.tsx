"use client";

import type { PerformanceSituationNarrative } from "@/lib/performance-narrative-core";

interface DesignerSituationNarrativePanelProps {
  narrative: PerformanceSituationNarrative;
}

export function DesignerSituationNarrativePanel({
  narrative,
}: DesignerSituationNarrativePanelProps) {
  let index = 1;

  return (
    <section className="rounded-xl border border-indigo-100/80 bg-indigo-50/40 px-4 py-4">
      <header>
        <h3 className="text-sm font-semibold text-indigo-950">
          {narrative.title}
        </h3>
        <p className="mt-0.5 text-xs text-indigo-700/80">
          统计周期：{narrative.periodHint}
          {narrative.scopeHint ? ` · 所属：${narrative.scopeHint}` : null}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
          {narrative.intro}
        </p>
      </header>

      <div className="mt-3 space-y-4">
        {narrative.sections.map((section) => (
          <div key={section.heading}>
            <p className="text-xs font-semibold text-indigo-900">
              {section.heading}
            </p>
            <ol className="mt-1.5 list-none space-y-2 pl-0">
              {section.items.map((item) => {
                const n = index;
                index += 1;
                return (
                  <li
                    key={`${section.heading}-${n}`}
                    className="text-sm leading-relaxed text-slate-800"
                  >
                    <span className="mr-1.5 font-semibold tabular-nums text-indigo-800">
                      {n}.
                    </span>
                    {item}
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>

      <p className="mt-3 border-t border-indigo-100/80 pt-2 text-[11px] leading-relaxed text-indigo-700/75">
        数据口径说明：{narrative.footnote}
      </p>
    </section>
  );
}
