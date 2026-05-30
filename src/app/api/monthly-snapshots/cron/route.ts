import { ensureLastMonthSnapshotFromAppStore } from "@/lib/server/monthly-snapshot-server";
import { checkDigestCronAuth } from "@/lib/server/wecom-push";
import { NextResponse } from "next/server";

/**
 * 定时任务：归档上月综合看板快照（含驾驶舱 KPI 与漏斗）。
 * POST /api/monthly-snapshots/cron
 * Header: x-digest-key 或 x-sync-key
 */
export async function POST(request: Request) {
  if (!checkDigestCronAuth(request)) {
    return NextResponse.json({ error: "无权限" }, { status: 401 });
  }

  try {
    const { yearMonth, result } = await ensureLastMonthSnapshotFromAppStore();
    if (result === "failed") {
      return NextResponse.json(
        { ok: false, error: "归档失败", yearMonth },
        { status: 500 },
      );
    }
    return NextResponse.json({
      ok: true,
      yearMonth,
      result,
      archivedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[api/monthly-snapshots/cron] failed", err);
    return NextResponse.json({ error: "归档失败" }, { status: 500 });
  }
}

/** 预览上月归档状态（不写入） */
export async function GET(request: Request) {
  if (!checkDigestCronAuth(request)) {
    return NextResponse.json({ error: "无权限" }, { status: 401 });
  }

  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  return NextResponse.json({
    yearMonth,
    endpoint: "/api/monthly-snapshots/cron",
    hint: "POST 触发上月快照归档；已存在则跳过",
  });
}
