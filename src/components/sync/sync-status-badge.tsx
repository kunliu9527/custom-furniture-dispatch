"use client";

import {
  subscribeSyncStatus,
  type SyncConnectionStatus,
} from "@/lib/snapshot-cache";
import { isRemoteSyncEnabled } from "@/lib/sync-config";
import { useEffect, useState } from "react";

const labels: Record<SyncConnectionStatus, string> = {
  local: "本机存储",
  connecting: "连接云端…",
  connected: "云端同步",
  syncing: "保存中…",
  error: "同步异常",
};

const styles: Record<SyncConnectionStatus, string> = {
  local: "bg-slate-100 text-slate-600 ring-slate-200",
  connecting: "bg-amber-50 text-amber-700 ring-amber-200",
  connected: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  syncing: "bg-sky-50 text-sky-700 ring-sky-200",
  error: "bg-red-50 text-red-700 ring-red-200",
};

export function SyncStatusBadge() {
  const [status, setStatus] = useState<SyncConnectionStatus>(
    isRemoteSyncEnabled() ? "connecting" : "local",
  );
  const [detail, setDetail] = useState<string | undefined>();

  useEffect(() => {
    return subscribeSyncStatus((next, msg) => {
      setStatus(next);
      setDetail(msg);
    });
  }, []);

  return (
    <span
      className={`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${styles[status]}`}
      title={detail ?? labels[status]}
    >
      {labels[status]}
    </span>
  );
}
