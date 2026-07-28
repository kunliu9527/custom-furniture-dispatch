export type MeasureUnit = "mm" | "cm" | "m";

export type MeasureToolMode =
  | "select"
  | "dimension"
  | "arrow"
  | "text"
  | "pen";

export type MeasureImageStorage = "local" | "cloud";

export interface MeasurePoint {
  x: number;
  y: number;
}

interface AnnotationBase {
  id: string;
  color: string;
}

export interface DimensionAnnotation extends AnnotationBase {
  kind: "dimension";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  value: string;
  unit: MeasureUnit;
  note?: string;
}

export interface ArrowAnnotation extends AnnotationBase {
  kind: "arrow";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  note?: string;
}

export interface TextAnnotation extends AnnotationBase {
  kind: "text";
  x: number;
  y: number;
  text: string;
}

export interface PenAnnotation extends AnnotationBase {
  kind: "pen";
  points: MeasurePoint[];
  width: number;
}

export type MeasureAnnotation =
  | DimensionAnnotation
  | ArrowAnnotation
  | TextAnnotation
  | PenAnnotation;

export interface OrderMeasurePhoto {
  id: string;
  name: string;
  room: string;
  storage: MeasureImageStorage;
  /** 云端相对路径，如 /api/measure-images/xxx.jpg；本地为空 */
  imageUrl?: string;
  annotations: MeasureAnnotation[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderMeasurement {
  photos: OrderMeasurePhoto[];
  updatedAt: string;
  /** 设计师点击「测量完成」的时间 */
  completedAt?: string | null;
}

/** 编辑器内完整照片（含可显示的 data URL） */
export interface MeasurePhotoView extends OrderMeasurePhoto {
  imageDataUrl: string;
}

export const MEASURE_ROOMS = [
  "客厅",
  "主卧",
  "次卧",
  "厨房",
  "卫生间",
  "阳台",
  "书房",
  "其他",
] as const;

export function measureUid(): string {
  return crypto.randomUUID();
}

export function annotationLabel(a: MeasureAnnotation): string {
  switch (a.kind) {
    case "dimension":
      return `${a.value}${a.unit}${a.note ? `（${a.note}）` : ""}`;
    case "arrow":
      return a.note ? `箭头：${a.note}` : "箭头标注";
    case "text":
      return `文字：${a.text}`;
    case "pen":
      return "手绘涂鸦";
  }
}

export function normalizeMeasureAnnotation(raw: MeasureAnnotation | Record<string, unknown>): MeasureAnnotation {
  if (raw && typeof raw === "object" && "kind" in raw && raw.kind) {
    return raw as MeasureAnnotation;
  }
  const legacy = raw as {
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    value: string;
    unit: MeasureUnit;
    note?: string;
    color: string;
  };
  return {
    kind: "dimension",
    id: legacy.id,
    x1: legacy.x1,
    y1: legacy.y1,
    x2: legacy.x2,
    y2: legacy.y2,
    value: legacy.value,
    unit: legacy.unit,
    note: legacy.note,
    color: legacy.color,
  };
}
