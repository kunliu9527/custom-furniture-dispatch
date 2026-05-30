"use client";

import type { AppSnapshot, StaffConfigSnapshot } from "@/lib/server/snapshot-types";
import { EMPTY_STAFF_CONFIG } from "@/lib/server/snapshot-types";
import {
  getClientSyncApiKey,
  getSyncPollIntervalMs,
  isRemoteSyncEnabled,
} from "@/lib/sync-config";
import { apiFetch } from "@/lib/client-api";
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
let lastStatus: SyncConnectionStatus | null = null;
let lastStatusDetail: string | undefined;
let syncingIndicatorTimer: ReturnType<typeof setTimeout> | null = null;

const snapshotListeners = new Set<SnapshotListener>();
const statusListeners = new Set<StatusListener>();

function snapshotPayload(snap: AppSnapshot) {
  return JSON.stringify({
    orders: snap.orders,
    supplements: snap.supplements,
    staffConfig: snap.staffConfig,
  });
}

function notifySnapshot(snap: AppSnapshot) {
  for (const fn of snapshotListeners) fn(snap);
}

function notifyStatus(status: SyncConnectionStatus, detail?: string) {
  if (lastStatus === status && lastStatusDetail === detail) return;
  lastStatus = status;
  lastStatusDetail = detail;
  for (const fn of statusListeners) fn(status, detail);
}

function clearSyncingIndicatorTimer() {
  if (syncingIndicatorTimer) {
    clearTimeout(syncingIndicatorTimer);
    syncingIndicatorTimer = null;
  }
}

/** 仅长时间上传时显示「保存中」，避免徽章闪烁 */
function markSyncingSoon() {
  clearSyncingIndicatorTimer();
  syncingIndicatorTimer = setTimeout(() => {
    if (pushing) notifyStatus("syncing");
  }, 500);
}

function syncHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const key = getClientSyncApiKey();
  if (key) headers["x-sync-key"] = key;
  return headers;
}

export async function fetchRemoteSnapshot(): Promise<AppSnapshot> {
  const res = await apiFetch("/api/sync", { cache: "no-store" });
  if (!res.ok) throw new Error(`拉取失败 (${res.status})`);
  return (await res.json()) as AppSnapshot;
}

async function putRemoteSnapshot(body: {
  version: number;
  orders: Order[];
  supplements: SupplementOrder[];
  staffConfig: StaffConfigSnapshot;
}): Promise<AppSnapshot> {
  const res = await apiFetch("/api/sync", {
    method: "PUT",
    headers: syncHeaders(),
    body: JSON.stringify(body),
  });
  if (res.status === 409) {
    const payload = (await res.json()) as { current?: AppSnapshot };
    if (payload.current && cache) {
      // 保留本次要写入的业务数据，仅对齐 version，避免用旧快照覆盖刚添加的人员等
      cache = {
        ...payload.current,
        orders: body.orders,
        supplements: body.supplements,
        staffConfig: body.staffConfig,
      };
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

export function isSnapshotDirty(): boolean {
  return dirty;
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
  markSyncingSoon();
  try {
    const next = await putRemoteSnapshot({
      version: cache.version,
      orders: cache.orders,
      supplements: cache.supplements,
      staffConfig: cache.staffConfig,
    });
    cache = next;
    // 本页已是最新数据，不再 notifySnapshot，避免触发 orders/auth 回写 → 再次上传 的循环
    notifyStatus("connected");
  } catch (err) {
    const message = err instanceof Error ? err.message : "同步失败";
    if (message === "version_conflict") {
      dirty = true;
      scheduleRemotePush();
      notifyStatus("connected", "已合并服务器最新数据");
    } else {
      dirty = true;
      notifyStatus("error", message);
      scheduleRemotePush();
    }
  } finally {
    pushing = false;
    clearSyncingIndicatorTimer();
    if (lastStatus === "syncing") {
      notifyStatus("connected");
    }
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
    } else if (lastStatus === "error") {
      notifyStatus("connected");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "拉取失败";
    notifyStatus("error", message);
  }
}

/** 手动从云端拉取最新快照（覆盖本机缓存，含未上传的本地改动） */
export async function refreshRemoteSnapshot(): Promise<AppSnapshot> {
  if (!isRemoteSyncEnabled()) {
    throw new Error("未开启云端同步");
  }
  if (pushing) {
    throw new Error("正在保存到云端，请稍后再刷新");
  }

  notifyStatus("connecting", "正在拉取云端数据…");
  try {
    const remote = await fetchRemoteSnapshot();
    cache = remote;
    dirty = false;
    if (pushTimer) {
      clearTimeout(pushTimer);
      pushTimer = null;
    }
    notifySnapshot(remote);
    notifyStatus("connected", "已刷新云端数据");
    if (!pollTimer) startPolling();
    return remote;
  } catch (err) {
    const message = err instanceof Error ? err.message : "拉取失败";
    notifyStatus("error", message);
    throw err;
  }
}

export function patchSnapshotCache(
  partial: Partial<Pick<AppSnapshot, "orders" | "supplements" | "staffConfig">>,
): void {
  if (!cache) return;
  const next: AppSnapshot = {
    ...cache,
    ...partial,
    staffConfig: partial.staffConfig ?? cache.staffConfig,
  };
  if (snapshotPayload(next) === snapshotPayload(cache)) {
    return;
  }
  cache = next;
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
