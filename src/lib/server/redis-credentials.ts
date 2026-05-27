/** 从 Vercel / Upstash 环境变量解析 REST 连接（兼容 REDIS_URL） */
export function resolveUpstashRestCredentials(): {
  url: string;
  token: string;
} | null {
  const restUrl =
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    process.env.KV_REST_API_URL?.trim();
  const restToken =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.KV_REST_API_TOKEN?.trim();
  if (restUrl && restToken) {
    return { url: restUrl, token: restToken };
  }

  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) return null;

  return parseRedisUrlToRest(redisUrl);
}

function parseRedisUrlToRest(redisUrl: string): { url: string; token: string } | null {
  try {
    const parsed = new URL(redisUrl);
    const token = decodeURIComponent(parsed.password || parsed.username || "");
    if (!token || !parsed.hostname) return null;
    return {
      url: `https://${parsed.hostname}`,
      token,
    };
  } catch {
    return null;
  }
}

export function isRedisConfigured(): boolean {
  return resolveUpstashRestCredentials() !== null;
}
