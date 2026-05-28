/**
 * 浏览器端 API 请求：一律使用相对路径（/api/...），与页面同源。
 * 避免在 HTTPS 页面请求 http://公网IP 导致混合内容被拦截（云端浏览器常见问题）。
 */
export function apiUrl(path: string): string {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }
  return path;
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  if (typeof window !== "undefined") {
    const pageHttps = window.location.protocol === "https:";
    if (pageHttps && /^http:\/\//i.test(path)) {
      throw new Error(
        "HTTPS 页面不能请求 http 地址，请使用相对路径 /api/... 或与页面相同的 https 域名",
      );
    }
  }
  return fetch(apiUrl(path), init);
}

export function isBrowserSecureContext(): boolean {
  if (typeof window === "undefined") return true;
  return window.isSecureContext === true;
}
