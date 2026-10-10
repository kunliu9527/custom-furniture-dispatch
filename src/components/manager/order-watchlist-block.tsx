"use client";

import { useState } from "react";
import {
  WATCHLIST_KIND_LABELS,
  type OrderWatchlist,
  type WatchlistRow,
} from "@/lib/report-order-watchlist";

const COLLAPSED_LIMIT = 8;

function ReasonTags({ row }: { row: WatchlistRow }) {
  return (
    <span className="flex flex-wrap gap-1">
      {row.unmanaged ? (
        <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 ring-1 ring-rose-100">
          无管控
        </span>
      ) : null}
      {row.carriedOver ? (
        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-100">
          跨期遗留
        </span>
      ) : null}
      <span className="text-[11px] text-slate-500">
        {row.reasons.join(" / ")}
      </span>
    </span>
  );
}

/** 月报「关注订单」：逐单盯住动向，防止订单无管控 */
export function OrderWatchlistBlock({
  watchlist,
}: {
  watchlist: OrderWatchlist;
}) {
  const [expanded, setExpanded] = useState(false);

  if (watchlist.totalCount === 0) {
    return (
      <p className="mt-2 text-xs text-slate-500">
        当前无需逐单跟进的订单，各环节均在管控内。
      </p>
    );
  }

  const visible = expanded
    ? watchlist.rows
    : watchlist.rows.slice(0, COLLAPSED_LIMIT);

  return (
    <div className="mt-2 space-y-2">
      <p className="text-xs text-slate-600">
        共 {watchlist.totalCount} 单待逐单跟进 · 无管控{" "}
        <span className="font-medium text-rose-700">
          {watchlist.unmanagedCount}
        </span>{" "}
        · 跨期遗留{" "}
        <span className="font-medium text-amber-700">
          {watchlist.carriedOverCount}
        </span>
        {watchlist.summaryParts.length > 0
          ? ` · ${watchlist.summaryParts.slice(0, 4).join(" · ")}`
          : ""}
      </p>
      <div className="overflow-x-auto rounded-lg border border-[var(--vi-border-strong)] bg-white">
        <table className="w-full min-w-[720px] text-xs tabular-nums">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-medium text-slate-500">
              <th className="px-3 py-2 font-medium">客户</th>
              <th className="px-3 py-2 font-medium">设计师</th>
              <th className="px-3 py-2 font-medium">门店</th>
              <th className="px-3 py-2 font-medium">当前环节</th>
              <th className="px-3 py-2 text-right font-medium">停留天数</th>
              <th className="px-3 py-2 font-medium">关注原因</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((row) => (
              <tr key={row.orderId} className="text-slate-700">
                <td className="px-3 py-2 font-medium text-slate-900">
                  {row.customerName}
                </td>
                <td className="px-3 py-2">
                  {row.designer}
                  <span className="ml-1 text-[10px] text-slate-400">
                    ({WATCHLIST_KIND_LABELS[row.kind]})
                  </span>
                </td>
                <td className="px-3 py-2">{row.dispatchStore}</td>
                <td className="px-3 py-2">{row.status}</td>
                <td className="px-3 py-2 text-right">{row.daysStuck}</td>
                <td className="px-3 py-2">
                  <ReasonTags row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {watchlist.totalCount > COLLAPSED_LIMIT ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-medium text-rose-700 underline-offset-2 hover:underline"
        >
          {expanded
            ? "收起"
            : `展开其余 ${watchlist.totalCount - COLLAPSED_LIMIT} 单`}
        </button>
      ) : null}
    </div>
  );
}
