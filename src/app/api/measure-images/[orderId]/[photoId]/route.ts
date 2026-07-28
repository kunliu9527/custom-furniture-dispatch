import { NextResponse } from "next/server";
import { readMeasureImageFile } from "@/lib/server/measure-image-storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string; photoId: string }> },
) {
  const { orderId, photoId } = await context.params;
  const bytes = await readMeasureImageFile(
    decodeURIComponent(orderId),
    decodeURIComponent(photoId),
  );
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
