import { NextResponse } from "next/server";
import {
  checkDigestCronAuth,
  isWecomConfigured,
  sendWecomText,
} from "@/lib/server/wecom-push";

export async function POST(request: Request) {
  if (!checkDigestCronAuth(request)) {
    return NextResponse.json({ error: "无推送权限" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { text?: string };
    const text = body.text?.trim();
    if (!text) {
      return NextResponse.json({ error: "缺少 text" }, { status: 400 });
    }

    const result = await sendWecomText(text);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          hint: "系统内周报仍可用；配置 WECOM_WEBHOOK_URL 后可推送到企微群",
        },
        { status: result.error?.includes("未配置") ? 503 : 502 },
      );
    }

    return NextResponse.json({ ok: true, channel: "wecom" });
  } catch (err) {
    console.error("[api/weekly-digest/push] failed", err);
    return NextResponse.json({ error: "推送失败" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    wecomConfigured: isWecomConfigured(),
    channels: isWecomConfigured() ? ["in_app", "wecom"] : ["in_app"],
    cronEndpoint: "/api/weekly-digest/cron",
  });
}
