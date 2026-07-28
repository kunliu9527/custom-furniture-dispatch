import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

function measureRoot(): string {
  const dataDir =
    process.env.SYNC_DATA_DIR?.trim() || path.join(process.cwd(), "data");
  return path.join(dataDir, "measure-images");
}

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
}

export function measureImageFilePath(orderId: string, photoId: string): string {
  return path.join(
    measureRoot(),
    safeSegment(orderId),
    `${safeSegment(photoId)}.jpg`,
  );
}

export function measureImagePublicPath(orderId: string, photoId: string): string {
  return `/api/measure-images/${encodeURIComponent(orderId)}/${encodeURIComponent(photoId)}`;
}

export async function writeMeasureImageFile(
  orderId: string,
  photoId: string,
  bytes: Buffer,
): Promise<string> {
  const filePath = measureImageFilePath(orderId, photoId);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, bytes);
  return measureImagePublicPath(orderId, photoId);
}

export async function readMeasureImageFile(
  orderId: string,
  photoId: string,
): Promise<Buffer | null> {
  try {
    return await readFile(measureImageFilePath(orderId, photoId));
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return null;
    throw err;
  }
}

export async function deleteMeasureImageFile(
  orderId: string,
  photoId: string,
): Promise<void> {
  try {
    await unlink(measureImageFilePath(orderId, photoId));
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return;
    throw err;
  }
}
