/** 生成短 ID（兼容 http 公网 IP 等非安全上下文，避免 randomUUID 报错） */
export function createShortId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return `${prefix}${crypto.randomUUID().slice(0, 8)}`;
    } catch {
      /* 非 HTTPS 等环境可能不可用 */
    }
  }
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
