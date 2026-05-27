"use client";

import type { AppSnapshot, StaffConfigSnapshot } from "@/lib/server/snapshot-types";
import { EMPTY_STAFF_CONFIG } from "@/lib/server/snapshot-types";
import {
  getClientSyncApiKey,
  getSyncPollIntervalMs,
  isRemoteSyncEnabled,
} from "@/lib/sync-config";
import type { Order, SupplementOrder } from "@/lib/types";

export type SyncConnectionStatus =
  | "local"
  | "connecting"
  | "connected"
  | "error"
  | "syncing";

type SnapshotListener = (snapshot: AppSnapshot) => void;
type StatusListener = (status: SyncConnectionStatus, detail?: string) => void;

let cache: AppSnapshot | null = null;
let readyPromise: Promise<AppSnapshot | null> | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let pushing = false;
let dirty = false;

const snapshotListeners = new Set<SnapshotListener>();
const statusListeners = new Set<StatusListener>();

function notifySnapshot(snap: AppSnapshot) {
  for (const fn of snapshotListeners) fn(snap);
}

function notifyStatus(status: SyncConnectionStatus, detail?: string) {
  for (const fn of statusListeners) fn(status, detail);
}

function syncHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const key = getClientSyncApiKey();
  if (key) headers["x-sync-key"] = key;
  return headers;
}

export async function fetchRemoteSnapshot(): Promise<AppSnapshot> {
  const res = await fetch("/api/sync", { cache: "no-store" });
  if (!res.ok) throw new Error(`拉取失败 (${res.status})`);
  return (await res.json()) as AppSnapshot;
}

async function putRemoteSnapshot(body: {
  version: number;
  orders: Order[];
  supplements: SupplementOrder[];
  staffConfig: StaffConfigSnapshot;
}): Promise<AppSnapshot> {
  const res = await fetch("/api/sync", {
    method: "PUT",
    headers: syncHeaders(),
    body: JSON.stringify(body),
  });
  if (res.status === 409) {
    const payload = (await res.json()) as { current?: AppSnapshot };
    if (payload.current) {
      cache = payload.current;
      notifySnapshot(payload.current);
    }
    throw new Error("version_conflict");
  }
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? `保存失败 (${res.status})`);
  }
  return (await res.json()) as AppSnapshot;
}

export function subscribeSnapshot(listener: SnapshotListener): () => void {
  snapshotListeners.add(listener);
  return () => snapshotListeners.delete(listener);
}

export function subscribeSyncStatus(listener: StatusListener): () => void {
  statusListeners.add(listener);
  if (!isRemoteSyncEnabled()) {
    listener("local");
  } else if (cache) {
    listener("connected");
  }
  return () => statusListeners.delete(listener);
}

export function getCachedSnapshot(): AppSnapshot | null {
  return cache;
}

export function getCachedStaffConfig(): StaffConfigSnapshot {
  return cache?.staffConfig ?? { ...EMPTY_STAFF_CONFIG };
}

export function markSnapshotDirty(): void {
  if (!isRemoteSyncEnabled() || !cache) return;
  dirty = true;
  scheduleRemotePush();
}

function scheduleRemotePush() {
  if (!isRemoteSyncEnabled() || !cache) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void flushRemotePush();
  }, 500);
}

async function flushRemotePush() {
  if (!cache || !dirty || pushing) return;
  pushing = true;
  dirty = false;
  notifyStatus("syncing");
  try {
    const next = await putRemoteSnapshot({
      version: cache.version,
      orders: cache.orders,
      supplements: cache.supplements,
      staffConfig: cache.staffConfig,
    });
    cache = next;
    notifySnapshot(next);
    notifyStatus("connected");
  } catch (err) {
    const message = err instanceof Error ? err.message : "同步失败";
    if (message === "version_conflict") {
      dirty = false;
      notifyStatus("connected", "已合并服务器最新数据");
    } else {
      dirty = true;
      notifyStatus("error", message);
      scheduleRemotePush();
    }
  } finally {
    pushing = false;
  }
}

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    void pullRemoteIfNewer();
  }, getSyncPollIntervalMs());
}

async function pullRemoteIfNewer() {
  if (!isRemoteSyncEnabled() || !cache || dirty || pushing) return;
  try {
    const remote = await fetchRemoteSnapshot();
    if (remote.version > cache.version) {
      cache = remote;
      notifySnapshot(remote);
      notifyStatus("connected");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "拉取失败";
    notifyStatus("error", message);
  }
}

export function patchSnapshotCache(
  partial: Partial<Pick<AppSnapshot, "orders" | "supplements" | "staffConfig">>,
): void {
  if (!cache) return;
  cache = {
    ...cache,
    ...partial,
    staffConfig: partial.staffConfig ?? cache.staffConfig,
  };
  markSnapshotDirty();
}

export function ensureSnapshotCacheReady(): Promise<AppSnapshot | null> {
  if (!isRemoteSyncEnabled()) {
    notifyStatus("local");
    return Promise.resolve(null);
  }
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    notifyStatus("connecting");
    try {
      const snap = await fetchRemoteSnapshot();
      cache = snap;
      notifySnapshot(snap);
      notifyStatus("connected");
      startPolling();
      return snap;
    } catch (err) {
      const message = err instanceof Error ? err.message : "无法连接服务器";
      notifyStatus("error", message);
      throw err;
    }
  })();

  return readyPromise;
}

export function stopSnapshotPollingForTests() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}
