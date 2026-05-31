"use client";

import {
  refreshRemoteSnapshot,
  subscribeSyncStatus,
  type SyncConnectionStatus,
} from "@/lib/snapshot-cache";
import { isRemoteSyncEnabled } from "@/lib/sync-config";
import { useEffect, useState } from "react";

const labels: Record<SyncConnectionStatus, string> = {
  local: "本机存储，未连云端",
  connecting: "连接云端…",
  connected: "云端同步",
  syncing: "保存中…",
  error: "同步异常",
};

export function SyncFooterStatus() {
  const remote = isRemoteSyncEnabled();
  const [status, setStatus] = useState<SyncConnectionStatus>(
    remote ? "connecting" : "local",
  );
  const [detail, setDetail] = useState<string | undefined>();
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    return subscribeSyncStatus((next, msg) => {
      setStatus(next);
      setDetail(msg);
    });
  }, []);

  async function handleRetry() {
    if (retrying) return;
    setRetrying(true);
    try {
      await refreshRemoteSnapshot();
    } catch {
      /* status listener updates UI */
    } finally {
      setRetrying(false);
    }
  }

  const muted =
    status === "connected" || status === "syncing" || status === "connecting";
  const textClass = muted
    ? "text-[10px] text-slate-400"
    : status === "error"
      ? "text-[10px] text-rose-600"
      : "text-[10px] text-slate-500";

  return (
    <footer className="border-t border-slate-100/80 py-2">
      <div
        className={`mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 sm:px-6 ${textClass}`}
      >
        <span title={detail ?? labels[status]}>
          {labels[status]}
          {detail && status !== "connected" ? ` · ${detail}` : null}
        </span>
        {remote && status === "error" ? (
          <button
            type="button"
            onClick={() => void handleRetry()}
            disabled={retrying}
            className="text-[10px] font-medium text-rose-700 underline-offset-2 hover:underline disabled:opacity-60"
          >
            {retrying ? "重试中…" : "重试同步"}
          </button>
        ) : null}
      </div>
    </footer>
  );
}
