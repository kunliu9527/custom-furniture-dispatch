import { NextResponse } from "next/server";
import {
  checkDigestCronAuth,
  isWecomConfigured,
  sendWecomText,
} from "@/lib/server/wecom-push";
import { generateDailyTodosTextFromSnapshot } from "@/lib/server/daily-todos-server";

/**
 * 定时任务：每日待办推送企微。
 * POST /api/daily-todos/cron
 */
export async function POST(request: Request) {
  if (!checkDigestCronAuth(request)) {
    return NextResponse.json({ error: "无推送权限" }, { status: 401 });
  }

  try {
    const { text, dateId, dateLabel } =
      await generateDailyTodosTextFromSnapshot();

    if (!isWecomConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          error: "未配置 WECOM_WEBHOOK_URL",
          dateId,
          dateLabel,
          textPreview: text.slice(0, 300),
          hint: "已生成待办正文，但未推送",
        },
        { status: 503 },
      );
    }

    const result = await sendWecomText(text);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, dateId, dateLabel },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      channel: "wecom",
      dateId,
      dateLabel,
      pushedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[api/daily-todos/cron] failed", err);
    return NextResponse.json({ error: "待办生成或推送失败" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  if (!checkDigestCronAuth(request)) {
    return NextResponse.json({ error: "无权限" }, { status: 401 });
  }

  try {
    const { text, dateId, dateLabel } =
      await generateDailyTodosTextFromSnapshot();
    return NextResponse.json({
      dateId,
      dateLabel,
      wecomConfigured: isWecomConfigured(),
      text,
    });
  } catch (err) {
    console.error("[api/daily-todos/cron] GET failed", err);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}
