import { NextResponse } from "next/server";
import {
  readMonthlySnapshot,
  readMonthlySnapshotIndex,
  writeMonthlySnapshot,
} from "@/lib/server/monthly-snapshot-storage";
import type { MonthlyMetricsSnapshot } from "@/lib/monthly-snapshot-types";

function checkWriteAuth(request: Request): boolean {
  const required = process.env.SYNC_API_KEY?.trim();
  if (!required) return true;
  const provided = request.headers.get("x-sync-key")?.trim();
  return provided === required;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month")?.trim();
    if (month) {
      const snapshot = await readMonthlySnapshot(month);
      if (!snapshot) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }
      return NextResponse.json(snapshot);
    }
    const index = await readMonthlySnapshotIndex();
    return NextResponse.json(index);
  } catch (err) {
    console.error("[api/monthly-snapshots] GET failed", err);
    return NextResponse.json({ error: "读取失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!checkWriteAuth(request)) {
    return NextResponse.json({ error: "无写入权限" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as MonthlyMetricsSnapshot;
    if (!body?.yearMonth || !/^\d{4}-\d{2}$/.test(body.yearMonth)) {
      return NextResponse.json({ error: "无效的 yearMonth" }, { status: 400 });
    }
    if (!body.overview || !Array.isArray(body.designers)) {
      return NextResponse.json({ error: "无效的快照数据" }, { status: 400 });
    }

    const snapshot: MonthlyMetricsSnapshot = {
      ...body,
      savedAt: new Date().toISOString(),
    };
    await writeMonthlySnapshot(snapshot);
    return NextResponse.json(snapshot);
  } catch (err) {
    console.error("[api/monthly-snapshots] POST failed", err);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
