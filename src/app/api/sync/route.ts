import { NextResponse } from "next/server";
import { normalizeCompanyId } from "@/lib/company";
import {
  mergeAppSnapshot,
  normalizeStaffConfig,
  readAppSnapshot,
} from "@/lib/server/app-store";
import type { SnapshotMergeInput } from "@/lib/server/app-store";

function checkWriteAuth(request: Request): boolean {
  const required = process.env.SYNC_API_KEY?.trim();
  if (!required) return true;
  const provided = request.headers.get("x-sync-key")?.trim();
  return provided === required;
}

function resolveCompanyId(request: Request): string {
  const url = new URL(request.url);
  return normalizeCompanyId(url.searchParams.get("company")?.trim());
}

export async function GET(request: Request) {
  try {
    const snapshot = await readAppSnapshot(resolveCompanyId(request));
    return NextResponse.json(snapshot);
  } catch (err) {
    console.error("[api/sync] GET failed", err);
    return NextResponse.json({ error: "读取数据失败" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!checkWriteAuth(request)) {
    return NextResponse.json({ error: "无写入权限" }, { status: 401 });
  }

  try {
    const companyId = resolveCompanyId(request);
    const body = (await request.json()) as SnapshotMergeInput & {
      staffConfig?: unknown;
    };
    const version = Number(body.version);
    if (!Number.isFinite(version) || version < 1) {
      return NextResponse.json({ error: "无效的 version" }, { status: 400 });
    }

    const result = await mergeAppSnapshot(companyId, {
      version,
      orders: Array.isArray(body.orders) ? body.orders : undefined,
      supplements: Array.isArray(body.supplements)
        ? body.supplements
        : undefined,
      staffConfig: body.staffConfig
        ? normalizeStaffConfig(body.staffConfig as Parameters<typeof normalizeStaffConfig>[0])
        : undefined,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: "version_conflict", current: result.current },
        { status: 409 },
      );
    }

    return NextResponse.json(result.snapshot);
  } catch (err) {
    console.error("[api/sync] PUT failed", err);
    return NextResponse.json({ error: "保存数据失败" }, { status: 500 });
  }
}
