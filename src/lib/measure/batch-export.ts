import { dataUrlToBlob, downloadDataUrl } from "./compress";
import { renderAnnotatedImage } from "./canvas-draw";
import type { OrderMeasurePhoto } from "./types";

export type MeasureBatchExportMode = "annotated" | "original";

function safeFilePart(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, "_").trim() || "照片";
}

export interface MeasureBatchExportItem {
  photo: OrderMeasurePhoto;
  imageDataUrl: string;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function dataUrlToBytes(dataUrl: string): Promise<Uint8Array> {
  const blob = dataUrlToBlob(dataUrl);
  const buf = await blob.arrayBuffer();
  return new Uint8Array(buf);
}

/** CRC32 for ZIP (store method) */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function encodeUtf8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function u16(n: number): Uint8Array {
  const b = new Uint8Array(2);
  b[0] = n & 0xff;
  b[1] = (n >>> 8) & 0xff;
  return b;
}

function u32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  b[0] = n & 0xff;
  b[1] = (n >>> 8) & 0xff;
  b[2] = (n >>> 16) & 0xff;
  b[3] = (n >>> 24) & 0xff;
  return b;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

/**
 * 无依赖 ZIP（Store 不压缩）。JPEG 本身已压缩，适合批量打包下载。
 */
function buildZipStore(
  files: { name: string; data: Uint8Array }[],
): Blob {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encodeUtf8(file.name);
    const crc = crc32(file.data);
    const size = file.data.length;

    const localHeader = concatBytes([
      u32(0x04034b50),
      u16(20),
      u16(0x0800), // UTF-8
      u16(0), // store
      u16(0),
      u16(0),
      u32(crc),
      u32(size),
      u32(size),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
    ]);

    localParts.push(localHeader, file.data);

    const centralHeader = concatBytes([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0x0800),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(size),
      u32(size),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes,
    ]);
    centralParts.push(centralHeader);
    offset += localHeader.length + file.data.length;
  }

  const central = concatBytes(centralParts);
  const end = concatBytes([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(central.length),
    u32(offset),
    u16(0),
  ]);

  const bytes = concatBytes([...localParts, central, end]);
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return new Blob([copy], { type: "application/zip" });
}

/**
 * 批量导出量尺照片。
 * - 1 张：直接下载单图
 * - 2 张及以上：自动打成 ZIP 包下载
 * - annotated：带尺寸/标注图层
 * - original：去掉量尺图层，仅原图
 */
export async function exportMeasurePhotosBatch(
  items: MeasureBatchExportItem[],
  mode: MeasureBatchExportMode,
  options?: { orderLabel?: string },
): Promise<{ ok: number; failed: number; zipped: boolean }> {
  const prefix = safeFilePart(options?.orderLabel || "量尺");
  const modeTag = mode === "annotated" ? "带尺寸" : "原图";
  let ok = 0;
  let failed = 0;
  const zipFiles: { name: string; data: Uint8Array }[] = [];

  for (let i = 0; i < items.length; i += 1) {
    const { photo, imageDataUrl } = items[i];
    const index = String(i + 1).padStart(2, "0");
    const room = safeFilePart(photo.room || "未分房间");
    const name = safeFilePart(photo.name || `照片${index}`);
    const filename = `${index}-${room}-${name}.jpg`;

    try {
      const dataUrl =
        mode === "annotated"
          ? await renderAnnotatedImage(imageDataUrl, photo.annotations || [])
          : imageDataUrl;

      if (items.length === 1) {
        downloadDataUrl(dataUrl, `${prefix}-${modeTag}-${filename}`);
      } else {
        zipFiles.push({
          name: filename,
          data: await dataUrlToBytes(dataUrl),
        });
      }
      ok += 1;
    } catch {
      failed += 1;
    }
  }

  if (items.length > 1 && zipFiles.length > 0) {
    const zip = buildZipStore(zipFiles);
    downloadBlob(zip, `${prefix}-${modeTag}.zip`);
  }

  return { ok, failed, zipped: items.length > 1 && zipFiles.length > 0 };
}
