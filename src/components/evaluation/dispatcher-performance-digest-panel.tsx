"use client";

import { Button } from "@/components/ui/button";
import {
  formatDispatcherPerformanceDigest,
  type DispatcherPerformanceRow,
} from "@/lib/dispatcher-performance";
import { DISPATCHER_TOP5_RULE } from "@/lib/performance-algorithm-copy";

interface DispatcherPerformanceDigestPanelProps {
  periodLabel: string;
  rows: DispatcherPerformanceRow[];
}

export function DispatcherPerformanceDigestPanel({
  periodLabel,
  rows,
}: DispatcherPerformanceDigestPanelProps) {
  const text = formatDispatcherPerformanceDigest(rows, periodLabel);
  const top = rows.filter((r) => r.contributionScore > 0).slice(0, 5);

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            派单人绩效报告
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {periodLabel} · {DISPATCHER_TOP5_RULE}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="text-xs"
          onClick={() => void navigator.clipboard.writeText(text)}
        >
          复制报告
        </Button>
      </div>
      {top.length === 0 ? (
        <p className="text-sm text-slate-500">该周期暂无派单人贡献数据</p>
      ) : (
        <ol className="space-y-2">
          {top.map((row, i) => (
            <li
              key={row.key}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
            >
              <span>
                <span className="font-semibold text-slate-900">
                  {i + 1}. {row.label}
                </span>
                {row.subtitle ? (
                  <span className="ml-2 text-xs text-slate-500">
                    {row.subtitle}
                  </span>
                ) : null}
              </span>
              <span className="font-semibold text-rose-700">
                贡献 {row.contributionScore}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
