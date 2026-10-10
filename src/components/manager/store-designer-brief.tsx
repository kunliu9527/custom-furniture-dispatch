"use client";

import type { StoreDesignerBrief } from "@/lib/store-designer-brief";

/** 设计简报：门店 → 逐设计师 在途/前置/下单 + 合计 */
export function StoreDesignerBriefBlock({
  briefs,
}: {
  briefs: StoreDesignerBrief[];
}) {
  if (briefs.length === 0) return null;

  return (
    <div className="mt-2 space-y-3">
      {briefs.map((store) => (
        <div
          key={store.store}
          className="rounded-lg border border-[var(--vi-border-strong)] bg-white px-3 py-2"
        >
          <p className="text-xs font-medium text-slate-800">
            {store.store}设计简报
          </p>
          <div className="mt-1.5 overflow-x-auto">
            <table className="min-w-[280px] text-xs tabular-nums">
              <thead>
                <tr className="text-slate-500">
                  <th className="w-24 py-1 pr-4 text-left font-normal">设计师</th>
                  <th className="w-12 px-2 py-1 text-right font-normal">在途</th>
                  <th className="px-2 py-1 text-right font-normal">前置</th>
                  <th className="w-12 py-1 pl-2 text-right font-normal">下单</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {store.designers.map((d) => (
                  <tr key={d.name} className="text-slate-700">
                    <td className="py-1 pr-2">{d.name}</td>
                    <td className="px-2 py-1 text-right">{d.inProgress}</td>
                    <td className="px-2 py-1 text-right">
                      {d.preOrder}
                      {d.preOrderLabels.length > 0 ? (
                        <span className="ml-1 text-[10px] text-slate-400">
                          （{d.preOrderLabels.join("，")}
                          {d.preOrder > d.preOrderLabels.length ? "…" : ""}）
                        </span>
                      ) : null}
                    </td>
                    <td className="py-1 pl-2 text-right">{d.ordered}</td>
                  </tr>
                ))}
                <tr className="font-medium text-slate-800">
                  <td className="py-1 pr-2">合计</td>
                  <td className="px-2 py-1 text-right">{store.totals.inProgress}</td>
                  <td className="px-2 py-1 text-right">{store.totals.preOrder}</td>
                  <td className="py-1 pl-2 text-right">{store.totals.ordered}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
