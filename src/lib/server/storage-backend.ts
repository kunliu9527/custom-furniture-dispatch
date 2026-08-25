import { isRedisConfigured } from "./redis-credentials";
import type { AppSnapshot } from "./snapshot-types";

export type StorageBackendId = "kv" | "file";

export interface StorageBackend {
  id: StorageBackendId;
  /** 读取指定公司的快照；文件不存在时按公司初始化空快照 */
  readSnapshot(companyId: string): Promise<AppSnapshot>;
  writeSnapshot(companyId: string, snapshot: AppSnapshot): Promise<void>;
}

/** Vercel 部署：配置 KV 后自动使用；本地仍可用文件存储 */
export function resolveStorageBackendId(): StorageBackendId {
  const forced = process.env.SYNC_STORAGE?.trim().toLowerCase();
  if (forced === "file") return "file";
  if (forced === "kv") return "kv";
  if (isRedisConfigured()) {
    return "kv";
  }
  return "file";
}

export function isKvStorageConfigured(): boolean {
  return resolveStorageBackendId() === "kv";
}
