/** CAD 风格测距：吸附、选线、视图变换（参考 dxf-kit / cad-viewer 交互） */

export interface WorldPoint {
  x: number;
  y: number;
}

export interface WorldSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type SnapKind = "endpoint" | "midpoint";

export interface SnapHit {
  x: number;
  y: number;
  kind: SnapKind;
}

export interface SegmentHit {
  segment: WorldSegment;
  index: number;
  dist: number;
  /** 垂足（世界坐标） */
  closest: WorldPoint;
}

/** 屏幕/画布像素 ↔ 世界坐标（DXF 或图像像素） */
export interface ViewTransform {
  /** 世界原点在画布上的像素位置 */
  offsetX: number;
  offsetY: number;
  /** 世界 1 单位 = scale 像素；DXF 时 Y 轴向上则 flipY=true */
  scale: number;
  flipY: boolean;
}

export function worldToScreen(
  p: WorldPoint,
  view: ViewTransform,
): WorldPoint {
  return {
    x: view.offsetX + p.x * view.scale,
    y: view.flipY
      ? view.offsetY - p.y * view.scale
      : view.offsetY + p.y * view.scale,
  };
}

export function screenToWorld(
  p: WorldPoint,
  view: ViewTransform,
): WorldPoint {
  return {
    x: (p.x - view.offsetX) / view.scale,
    y: view.flipY
      ? (view.offsetY - p.y) / view.scale
      : (p.y - view.offsetY) / view.scale,
  };
}

export function segmentLength(s: WorldSegment): number {
  return Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
}

export function collectSnapPoints(segments: WorldSegment[]): SnapHit[] {
  const map = new Map<string, SnapHit>();
  const key = (x: number, y: number) =>
    `${x.toFixed(4)},${y.toFixed(4)}`;
  for (const s of segments) {
    map.set(key(s.x1, s.y1), { x: s.x1, y: s.y1, kind: "endpoint" });
    map.set(key(s.x2, s.y2), { x: s.x2, y: s.y2, kind: "endpoint" });
    const mx = (s.x1 + s.x2) / 2;
    const my = (s.y1 + s.y2) / 2;
    const mk = key(mx, my);
    if (!map.has(mk)) {
      map.set(mk, { x: mx, y: my, kind: "midpoint" });
    }
  }
  return [...map.values()];
}

/** 在屏幕像素半径内找最近吸附点 */
export function findSnapPoint(
  screenX: number,
  screenY: number,
  snaps: SnapHit[],
  view: ViewTransform,
  pixelRadius = 14,
): SnapHit | null {
  let best: SnapHit | null = null;
  let bestD = pixelRadius;
  for (const s of snaps) {
    const sp = worldToScreen(s, view);
    const d = Math.hypot(sp.x - screenX, sp.y - screenY);
    if (d <= bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

function distPointToSegment(
  px: number,
  py: number,
  s: WorldSegment,
): { dist: number; closest: WorldPoint } {
  const dx = s.x2 - s.x1;
  const dy = s.y2 - s.y1;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-12) {
    return { dist: Math.hypot(px - s.x1, py - s.y1), closest: { x: s.x1, y: s.y1 } };
  }
  let t = ((px - s.x1) * dx + (py - s.y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const closest = { x: s.x1 + t * dx, y: s.y1 + t * dy };
  return {
    dist: Math.hypot(px - closest.x, py - closest.y),
    closest,
  };
}

/** 屏幕点击附近最近线段（按屏幕像素距离） */
export function findNearestSegment(
  screenX: number,
  screenY: number,
  segments: WorldSegment[],
  view: ViewTransform,
  pixelRadius = 12,
): SegmentHit | null {
  const world = screenToWorld({ x: screenX, y: screenY }, view);
  const worldRadius = pixelRadius / Math.max(view.scale, 1e-9);
  let best: SegmentHit | null = null;
  for (let i = 0; i < segments.length; i += 1) {
    const s = segments[i];
    const { dist, closest } = distPointToSegment(world.x, world.y, s);
    if (dist > worldRadius) continue;
    const screenDist = dist * view.scale;
    if (!best || screenDist < best.dist) {
      best = { segment: s, index: i, dist: screenDist, closest };
    }
  }
  return best;
}

/** 适配 bounds 到画布 */
export function fitViewToBounds(
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  canvasW: number,
  canvasH: number,
  flipY: boolean,
  padding = 40,
): ViewTransform {
  const w = Math.max(1e-6, bounds.maxX - bounds.minX);
  const h = Math.max(1e-6, bounds.maxY - bounds.minY);
  const scale = Math.min(
    (canvasW - padding * 2) / w,
    (canvasH - padding * 2) / h,
  );
  const contentW = w * scale;
  const contentH = h * scale;
  const offsetX = (canvasW - contentW) / 2 - bounds.minX * scale;
  const offsetY = flipY
    ? (canvasH - contentH) / 2 + bounds.maxY * scale
    : (canvasH - contentH) / 2 - bounds.minY * scale;
  return { offsetX, offsetY, scale, flipY };
}

/**
 * 画布尺寸变化时保持缩放与中心世界坐标不变
 * （避免 ResizeObserver 触发「适应窗口」把备注尺寸线冲掉）
 */
export function resizeViewPreserveCenter(
  prev: ViewTransform,
  oldW: number,
  oldH: number,
  newW: number,
  newH: number,
): ViewTransform {
  if (oldW <= 0 || oldH <= 0) return prev;
  const center = screenToWorld({ x: oldW / 2, y: oldH / 2 }, prev);
  return {
    ...prev,
    offsetX: newW / 2 - center.x * prev.scale,
    offsetY: prev.flipY
      ? newH / 2 + center.y * prev.scale
      : newH / 2 - center.y * prev.scale,
  };
}
