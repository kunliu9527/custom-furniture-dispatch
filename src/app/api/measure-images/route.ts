import { NextResponse } from "next/server";
import {
  deleteMeasureImageFile,
  readMeasureImageFile,
  writeMeasureImageFile,
} from "@/lib/server/measure-image-storage";

function checkWriteAuth(request: Request): boolean {
  const required = process.env.SYNC_API_KEY?.trim();
  if (!required) return true;
  const provided = request.headers.get("x-sync-key")?.trim();
  return provided === required;
}

/** GET /api/measure-images?orderId=&photoId=  或路径参数见 [[...path]] */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId")?.trim();
  const photoId = url.searchParams.get("photoId")?.trim();
  if (!orderId || !photoId) {
    return NextResponse.json({ error: "缺少 orderId/photoId" }, { status: 400 });
  }
  const bytes = await readMeasureImageFile(orderId, photoId);
  if (!bytes) {
    return NextResponse.json({ error: "图片不存在" }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

/** POST JSON: { orderId, photoId, dataUrl } */
export async function POST(request: Request) {
  if (!checkWriteAuth(request)) {
    return NextResponse.json({ error: "无写入权限" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as {
      orderId?: string;
      photoId?: string;
      dataUrl?: string;
    };
    const orderId = body.orderId?.trim();
    const photoId = body.photoId?.trim();
    const dataUrl = body.dataUrl?.trim();
    if (!orderId || !photoId || !dataUrl?.startsWith("data:image/")) {
      return NextResponse.json({ error: "参数无效" }, { status: 400 });
    }
    const base64 = dataUrl.split(",")[1];
    if (!base64) {
      return NextResponse.json({ error: "图片数据无效" }, { status: 400 });
    }
    const bytes = Buffer.from(base64, "base64");
    if (bytes.length > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "图片过大（压缩后仍超 4MB）" }, { status: 413 });
    }
    const imageUrl = await writeMeasureImageFile(orderId, photoId, bytes);
    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error("[api/measure-images] POST failed", err);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!checkWriteAuth(request)) {
    return NextResponse.json({ error: "无写入权限" }, { status: 401 });
  }
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId")?.trim();
  const photoId = url.searchParams.get("photoId")?.trim();
  if (!orderId || !photoId) {
    return NextResponse.json({ error: "缺少 orderId/photoId" }, { status: 400 });
  }
  await deleteMeasureImageFile(orderId, photoId);
  return NextResponse.json({ ok: true });
}
