"use client";

import { refreshRemoteSnapshot } from "@/lib/snapshot-cache";
import { isRemoteSyncEnabled } from "@/lib/sync-config";
import { useState } from "react";

export function SyncRefreshButton() {
  const [loading, setLoading] = useState(false);

  if (!isRemoteSyncEnabled()) return null;

  async function handleRefresh() {
    if (loading) return;
    setLoading(true);
    try {
      await refreshRemoteSnapshot();
    } catch {
      /* 状态由 SyncStatusBadge 展示 */
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleRefresh()}
      disabled={loading}
      className="rounded-md px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
      title="刷新获取云端数据"
    >
      {loading ? "刷新中…" : "刷新云端"}
    </button>
  );
}
