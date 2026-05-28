import { NextResponse } from "next/server";
import {
  checkDigestCronAuth,
  isWecomConfigured,
  sendWecomText,
} from "@/lib/server/wecom-push";
import { generateWeeklyDigestTextFromSnapshot } from "@/lib/server/weekly-digest-server";

/**
 * 定时任务入口：从 snapshot 生成周报并推送企微。
 * POST /api/weekly-digest/cron
 * Header: x-digest-key 或 x-sync-key（若配置了 DIGEST_PUSH_KEY / SYNC_API_KEY）
 */
export async function POST(request: Request) {
  if (!checkDigestCronAuth(request)) {
    return NextResponse.json({ error: "无推送权限" }, { status: 401 });
  }

  try {
    const { text, weekId, weekLabel } =
      await generateWeeklyDigestTextFromSnapshot();

    if (!isWecomConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          error: "未配置 WECOM_WEBHOOK_URL",
          weekId,
          weekLabel,
          textPreview: text.slice(0, 200),
          hint: "已生成周报正文，但未推送；请配置 WECOM_WEBHOOK_URL",
        },
        { status: 503 },
      );
    }

    const result = await sendWecomText(text);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, weekId, weekLabel },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      channel: "wecom",
      weekId,
      weekLabel,
      pushedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[api/weekly-digest/cron] failed", err);
    return NextResponse.json({ error: "周报生成或推送失败" }, { status: 500 });
  }
}

/** 仅生成预览（不推送），便于调试 cron */
export async function GET(request: Request) {
  if (!checkDigestCronAuth(request)) {
    return NextResponse.json({ error: "无权限" }, { status: 401 });
  }

  try {
    const { text, weekId, weekLabel } =
      await generateWeeklyDigestTextFromSnapshot();
    return NextResponse.json({
      weekId,
      weekLabel,
      wecomConfigured: isWecomConfigured(),
      text,
    });
  } catch (err) {
    console.error("[api/weekly-digest/cron] GET failed", err);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}
