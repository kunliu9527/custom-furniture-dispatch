"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { formatDispatchMoney } from "@/lib/dispatch-totals";
import {
  buildPastDigestHistory,
  loadDigestHistory,
  mergeDigestHistoryRecords,
  type DigestHistoryKind,
  type DigestHistoryRecord,
} from "@/lib/digest-history";
import type { ReportPersonScope } from "@/lib/evaluation-scope";
import type { ReportScope } from "@/lib/report-hub-config";
import { formatGlobalReportScopeHint } from "@/lib/global-report";
import { copyTextToClipboard } from "@/lib/secure-clipboard";
import type { Order, SupplementOrder } from "@/lib/types";
import { useMemo, useState } from "react";

interface DigestHistoryPanelProps {
  orders: Order[];
  supplements: SupplementOrder[];
  embedded?: boolean;
  reportScope?: ReportScope;
  storeScopeLabel?: string | null;
  personScope?: ReportPersonScope;
}

type HistoryFilter = "all" | DigestHistoryKind;

const FILTER_OPTIONS: { id: HistoryFilter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "weekly", label: "周报" },
  { id: "monthly", label: "月报" },
];

export function DigestHistoryPanel({
  orders,
  supplements,
  embedded = false,
  reportScope = "manager",
  storeScopeLabel = null,
  personScope,
}: DigestHistoryPanelProps) {
  const { user, staffRecords } = useAuth();
  const globalScopeHint =
    reportScope === "global" ? formatGlobalReportScopeHint(storeScopeLabel) : "";
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [copyKey, setCopyKey] = useState<string | null>(null);

  const records = useMemo(() => {
    const saved = loadDigestHistory(user?.username, reportScope);
    const generated = buildPastDigestHistory(orders, supplements, staffRecords, {
      scope: reportScope,
      personScope,
    });
    return mergeDigestHistoryRecords(saved, generated);
  }, [orders, supplements, staffRecords, user?.username, reportScope, personScope]);

  const filtered = useMemo(() => {
    if (filter === "all") return records;
    return records.filter((r) => r.kind === filter);
  }, [records, filter]);

  async function handleCopy(record: DigestHistoryRecord) {
    const key = `${record.kind}:${record.id}`;
    try {
      const ok = await copyTextToClipboard(record.text);
      if (ok) {
        setCopyKey(key);
        window.setTimeout(() => setCopyKey(null), 2000);
      }
    } catch {
      setCopyKey(null);
    }
  }

  return (
    <div className={embedded ? "" : "rounded-xl border border-slate-200 bg-white px-4 py-4"}>
      {!embedded ? (
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-slate-900">历史简报</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            按订单数据回溯近 12 周 / 12 月；查看当前简报时自动归档
            {globalScopeHint}
          </p>
        </div>
      ) : (
        <p className="mb-3 text-xs text-slate-500">
          近 12 周周报与 12 月月报 · 查看当前简报时自动归档
          {globalScopeHint}
        </p>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setFilter(opt.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filter === opt.id
                ? "bg-blue-100 text-blue-800 ring-1 ring-blue-200"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">暂无历史简报记录</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((record) => (
            <HistoryRecordItem
              key={`${record.kind}:${record.id}`}
              record={record}
              expanded={expandedKey === `${record.kind}:${record.id}`}
              onToggle={() =>
                setExpandedKey((prev) =>
                  prev === `${record.kind}:${record.id}`
                    ? null
                    : `${record.kind}:${record.id}`,
                )
              }
              onCopy={() => handleCopy(record)}
              copied={copyKey === `${record.kind}:${record.id}`}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function HistoryRecordItem({
  record,
  expanded,
  onToggle,
  onCopy,
  copied,
}: {
  record: DigestHistoryRecord;
  expanded: boolean;
  onToggle: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const kindLabel = record.kind === "weekly" ? "周报" : "月报";

  return (
    <li className="rounded-lg border border-slate-200 bg-slate-50/50">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
              {kindLabel}
            </span>
            <span className="text-sm font-medium text-slate-900">{record.label}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            新派单 {record.stats.newDispatchCount} · 下单 {record.stats.orderedCount} 笔 ·{" "}
            {formatDispatchMoney(record.stats.orderedAmount)}
          </p>
        </div>
        <span className="shrink-0 text-xs text-slate-400">{expanded ? "收起" : "展开"}</span>
      </button>
      {expanded ? (
        <div className="border-t border-slate-200 px-3 py-3">
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-white p-3 text-xs leading-relaxed text-slate-700 ring-1 ring-slate-200">
            {record.text}
          </pre>
          <div className="mt-2">
            <Button type="button" variant="secondary" className="px-3 py-1.5 text-xs" onClick={onCopy}>
              {copied ? "已复制" : "复制全文"}
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  );
}
