import type { MeasureUnit } from "./types";

/** 图纸比例：图面 1 单位对应多少毫米 */
export interface DrawingScale {
  /** 图面长度 1（DXF 单位或像素）= mmPerUnit 毫米 */
  mmPerUnit: number;
  /** 来源说明 */
  source: "manual" | "calibrate";
}

export function formatMeasuredLength(
  drawingDistance: number,
  scale: DrawingScale,
  unit: MeasureUnit = "mm",
): { value: string; unit: MeasureUnit; mm: number } {
  const mm = drawingDistance * scale.mmPerUnit;
  if (unit === "m") {
    return { value: (mm / 1000).toFixed(3).replace(/\.?0+$/, ""), unit: "m", mm };
  }
  if (unit === "cm") {
    return { value: (mm / 10).toFixed(1).replace(/\.0$/, ""), unit: "cm", mm };
  }
  return { value: String(Math.round(mm)), unit: "mm", mm };
}

export function distance2d(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

/** 用已知实际长度标定：图面距离 → mmPerUnit */
export function scaleFromCalibration(
  drawingDistance: number,
  realMm: number,
): DrawingScale | null {
  if (drawingDistance <= 0 || realMm <= 0) return null;
  return {
    mmPerUnit: realMm / drawingDistance,
    source: "calibrate",
  };
}
