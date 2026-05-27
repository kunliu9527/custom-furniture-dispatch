/** 开启后，订单与人员配置读写服务端 JSON，多机共享（需部署到可公网访问的服务器） */
export function isRemoteSyncEnabled(): boolean {
  return process.env.NEXT_PUBLIC_REMOTE_SYNC === "true";
}

export function getSyncPollIntervalMs(): number {
  const raw = process.env.NEXT_PUBLIC_SYNC_POLL_MS;
  const n = raw ? Number(raw) : 8000;
  return Number.isFinite(n) && n >= 3000 ? n : 8000;
}

export function getClientSyncApiKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_SYNC_API_KEY?.trim();
  return key || undefined;
}
