import { Redis } from "@upstash/redis";
import { isDefaultCompany } from "@/lib/company";
import { resolveUpstashRestCredentials } from "./redis-credentials";
import {
  createEmptyCompanySnapshot,
  createInitialSnapshot,
  normalizeSnapshot,
} from "./snapshot-normalize";
import type { AppSnapshot } from "./snapshot-types";
import type { StorageBackend } from "./storage-backend";

/** 默认公司沿用历史 key；其它公司加公司后缀，保证公司间数据独立 */
function snapshotKeyFor(companyId: string): string {
  if (isDefaultCompany(companyId)) {
    return "custom-furniture-dispatch:snapshot";
  }
  return `custom-furniture-dispatch:snapshot:${companyId}`;
}

function createRedisClient(): Redis {
  const creds = resolveUpstashRestCredentials();
  if (!creds) {
    throw new Error(
      "未配置 Redis（需要 UPSTASH_REDIS_REST_* 或 Vercel 注入的 REDIS_URL）",
    );
  }
  return new Redis({ url: creds.url, token: creds.token });
}

export const kvStorageBackend: StorageBackend = {
  id: "kv",
  async readSnapshot(companyId) {
    const redis = createRedisClient();
    const raw = await redis.get<AppSnapshot>(snapshotKeyFor(companyId));
    if (!raw) {
      const initial = isDefaultCompany(companyId)
        ? createInitialSnapshot()
        : createEmptyCompanySnapshot();
      await redis.set(snapshotKeyFor(companyId), initial);
      return initial;
    }
    return normalizeSnapshot(raw);
  },
  async writeSnapshot(companyId, next) {
    const redis = createRedisClient();
    await redis.set(snapshotKeyFor(companyId), next);
  },
};
