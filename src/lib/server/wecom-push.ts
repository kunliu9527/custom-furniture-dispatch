/** 企业微信群机器人 webhook */
export async function sendWecomText(
  content: string,
): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.WECOM_WEBHOOK_URL?.trim();
  if (!url) {
    return { ok: false, error: "未配置 WECOM_WEBHOOK_URL" };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      msgtype: "text",
      text: { content: content.slice(0, 4000) },
    }),
  });

  if (!res.ok) {
    return { ok: false, error: `企微 HTTP ${res.status}` };
  }

  const data = (await res.json()) as { errcode?: number; errmsg?: string };
  if (data.errcode !== 0) {
    return { ok: false, error: data.errmsg ?? "企微返回错误" };
  }
  return { ok: true };
}

export function isWecomConfigured(): boolean {
  return Boolean(process.env.WECOM_WEBHOOK_URL?.trim());
}

export function checkDigestCronAuth(request: Request): boolean {
  const required =
    process.env.DIGEST_PUSH_KEY?.trim() || process.env.SYNC_API_KEY?.trim();
  if (!required) return true;
  const provided =
    request.headers.get("x-digest-key")?.trim() ||
    request.headers.get("x-sync-key")?.trim();
  return provided === required;
}
