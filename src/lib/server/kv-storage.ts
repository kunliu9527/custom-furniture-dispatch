import { Redis } from "@upstash/redis";
import { resolveUpstashRestCredentials } from "./redis-credentials";
import { createInitialSnapshot, normalizeSnapshot } from "./snapshot-normalize";
import type { AppSnapshot } from "./snapshot-types";
import type { StorageBackend } from "./storage-backend";

const SNAPSHOT_KEY = "custom-furniture-dispatch:snapshot";

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
  async readSnapshot() {
    const redis = createRedisClient();
    const raw = await redis.get<AppSnapshot>(SNAPSHOT_KEY);
    if (!raw) {
      const initial = createInitialSnapshot();
      await redis.set(SNAPSHOT_KEY, initial);
      return initial;
    }
    return normalizeSnapshot(raw);
  },
  async writeSnapshot(next) {
    const redis = createRedisClient();
    await redis.set(SNAPSHOT_KEY, next);
  },
};
