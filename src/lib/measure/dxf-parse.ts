/** 轻量 DXF 线段解析（LINE / LWPOLYLINE / POLYLINE），用于图纸矢量测距 */

import type { WorldSegment } from "./drawing-geometry";

export interface DxfPoint {
  x: number;
  y: number;
}

export interface DxfSegment extends WorldSegment {}

export interface DxfParseResult {
  segments: DxfSegment[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  /** $INSUNITS → 图面 1 单位对应毫米；未知则为 null */
  mmPerUnit: number | null;
  insunits: number | null;
}

/** AutoCAD $INSUNITS → mm */
export function insunitsToMm(insunits: number): number | null {
  switch (insunits) {
    case 1:
      return 25.4; // inches
    case 2:
      return 304.8; // feet
    case 4:
      return 1; // mm
    case 5:
      return 10; // cm
    case 6:
      return 1000; // m
    case 10:
      return 25.4 * 36; // yards
    default:
      return null;
  }
}

function parseGroupPairs(text: string): Array<{ code: number; value: string }> {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const pairs: Array<{ code: number; value: string }> = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = Number(lines[i].trim());
    if (!Number.isFinite(code)) continue;
    pairs.push({ code, value: lines[i + 1] ?? "" });
  }
  return pairs;
}

function updateBounds(
  bounds: DxfParseResult["bounds"],
  x: number,
  y: number,
): void {
  bounds.minX = Math.min(bounds.minX, x);
  bounds.minY = Math.min(bounds.minY, y);
  bounds.maxX = Math.max(bounds.maxX, x);
  bounds.maxY = Math.max(bounds.maxY, y);
}

function readInsunits(pairs: Array<{ code: number; value: string }>): number | null {
  for (let i = 0; i < pairs.length - 1; i += 1) {
    if (
      pairs[i].code === 9 &&
      pairs[i].value.trim().toUpperCase() === "$INSUNITS"
    ) {
      const next = pairs[i + 1];
      if (next?.code === 70) {
        const n = Number(next.value);
        return Number.isFinite(n) ? n : null;
      }
    }
  }
  return null;
}

/**
 * 解析 DXF 文本中的直线实体。
 * 覆盖常见 ASCII DXF：LINE、LWPOLYLINE、POLYLINE+VERTEX。
 */
export function parseDxfSegments(text: string): DxfParseResult {
  const pairs = parseGroupPairs(text);
  const segments: DxfSegment[] = [];
  const bounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };
  const insunits = readInsunits(pairs);
  const mmPerUnit = insunits != null ? insunitsToMm(insunits) : null;

  let i = 0;
  while (i < pairs.length) {
    const p = pairs[i];
    if (p.code === 0 && p.value.trim().toUpperCase() === "LINE") {
      let x1 = NaN;
      let y1 = NaN;
      let x2 = NaN;
      let y2 = NaN;
      i += 1;
      while (i < pairs.length && pairs[i].code !== 0) {
        const g = pairs[i];
        const n = Number(g.value);
        if (g.code === 10) x1 = n;
        if (g.code === 20) y1 = n;
        if (g.code === 11) x2 = n;
        if (g.code === 21) y2 = n;
        i += 1;
      }
      if ([x1, y1, x2, y2].every(Number.isFinite)) {
        segments.push({ x1, y1, x2, y2 });
        updateBounds(bounds, x1, y1);
        updateBounds(bounds, x2, y2);
      }
      continue;
    }

    if (p.code === 0 && p.value.trim().toUpperCase() === "LWPOLYLINE") {
      const pts: DxfPoint[] = [];
      let closed = false;
      let curX = NaN;
      i += 1;
      while (i < pairs.length && pairs[i].code !== 0) {
        const g = pairs[i];
        const n = Number(g.value);
        if (g.code === 70) closed = (Math.trunc(n) & 1) === 1;
        if (g.code === 10) curX = n;
        if (g.code === 20 && Number.isFinite(curX)) {
          pts.push({ x: curX, y: n });
          updateBounds(bounds, curX, n);
          curX = NaN;
        }
        i += 1;
      }
      for (let k = 1; k < pts.length; k += 1) {
        segments.push({
          x1: pts[k - 1].x,
          y1: pts[k - 1].y,
          x2: pts[k].x,
          y2: pts[k].y,
        });
      }
      if (closed && pts.length >= 2) {
        const a = pts[pts.length - 1];
        const b = pts[0];
        segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
      }
      continue;
    }

    // 旧式 POLYLINE：随后 VERTEX…SEQEND
    if (p.code === 0 && p.value.trim().toUpperCase() === "POLYLINE") {
      const pts: DxfPoint[] = [];
      let closed = false;
      i += 1;
      while (i < pairs.length && pairs[i].code !== 0) {
        if (pairs[i].code === 70) {
          closed = (Math.trunc(Number(pairs[i].value)) & 1) === 1;
        }
        i += 1;
      }
      while (i < pairs.length) {
        if (
          pairs[i].code === 0 &&
          pairs[i].value.trim().toUpperCase() === "SEQEND"
        ) {
          i += 1;
          break;
        }
        if (
          pairs[i].code === 0 &&
          pairs[i].value.trim().toUpperCase() === "VERTEX"
        ) {
          let vx = NaN;
          let vy = NaN;
          i += 1;
          while (i < pairs.length && pairs[i].code !== 0) {
            const g = pairs[i];
            const n = Number(g.value);
            if (g.code === 10) vx = n;
            if (g.code === 20) vy = n;
            i += 1;
          }
          if (Number.isFinite(vx) && Number.isFinite(vy)) {
            pts.push({ x: vx, y: vy });
            updateBounds(bounds, vx, vy);
          }
          continue;
        }
        i += 1;
      }
      for (let k = 1; k < pts.length; k += 1) {
        segments.push({
          x1: pts[k - 1].x,
          y1: pts[k - 1].y,
          x2: pts[k].x,
          y2: pts[k].y,
        });
      }
      if (closed && pts.length >= 2) {
        const a = pts[pts.length - 1];
        const b = pts[0];
        segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
      }
      continue;
    }

    i += 1;
  }

  if (!Number.isFinite(bounds.minX)) {
    bounds.minX = 0;
    bounds.minY = 0;
    bounds.maxX = 100;
    bounds.maxY = 100;
  }

  return { segments, bounds, mmPerUnit, insunits };
}

/** 将 DXF 线段栅格化为 JPEG data URL，供归档导出 */
export function rasterizeDxfSegments(
  parsed: DxfParseResult,
  options?: { maxEdge?: number; padding?: number; quality?: number },
): string {
  const maxEdge = options?.maxEdge ?? 2000;
  const padding = options?.padding ?? 40;
  const quality = options?.quality ?? 0.92;
  const { bounds, segments } = parsed;
  const w = Math.max(1, bounds.maxX - bounds.minX);
  const h = Math.max(1, bounds.maxY - bounds.minY);
  const scale = Math.min(maxEdge / w, maxEdge / h);

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(w * scale) + padding * 2;
  canvas.height = Math.ceil(h * scale) + padding * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#f7f5f0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#1c1917";
  ctx.lineWidth = Math.max(1.2, scale * 0.02);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const s of segments) {
    const x1 = padding + (s.x1 - bounds.minX) * scale;
    const y1 = padding + (bounds.maxY - s.y1) * scale;
    const x2 = padding + (s.x2 - bounds.minX) * scale;
    const y2 = padding + (bounds.maxY - s.y2) * scale;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  return canvas.toDataURL("image/jpeg", quality);
}

/** 图面坐标（DXF）→ 栅格图像素坐标（与 rasterizeDxfSegments 一致） */
export function dxfToImagePoint(
  parsed: DxfParseResult,
  x: number,
  y: number,
  maxEdge = 2000,
  padding = 40,
): { x: number; y: number } {
  const { bounds } = parsed;
  const w = Math.max(1, bounds.maxX - bounds.minX);
  const h = Math.max(1, bounds.maxY - bounds.minY);
  const scale = Math.min(maxEdge / w, maxEdge / h);
  return {
    x: padding + (x - bounds.minX) * scale,
    y: padding + (bounds.maxY - y) * scale,
  };
}
