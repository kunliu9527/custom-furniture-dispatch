import type { OrderMeasurement, OrderMeasurePhoto } from "./types";
import { normalizeMeasureAnnotation } from "./types";

export function normalizeMeasurement(raw: unknown): OrderMeasurement | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const photosRaw = Array.isArray(obj.photos) ? obj.photos : [];
  const photos: OrderMeasurePhoto[] = photosRaw
    .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
    .map((p) => ({
      id: String(p.id ?? ""),
      name: String(p.name ?? "现场照片"),
      room: String(p.room ?? "其他"),
      storage: (p.storage === "local" ? "local" : "cloud") as OrderMeasurePhoto["storage"],
      imageUrl: typeof p.imageUrl === "string" ? p.imageUrl : undefined,
      annotations: Array.isArray(p.annotations)
        ? p.annotations.map((a) =>
            normalizeMeasureAnnotation(a as Parameters<typeof normalizeMeasureAnnotation>[0]),
          )
        : [],
      createdAt: String(p.createdAt ?? new Date().toISOString()),
      updatedAt: String(p.updatedAt ?? new Date().toISOString()),
    }))
    .filter((p) => p.id);

  if (photos.length === 0 && !obj.updatedAt) return null;

  return {
    photos,
    updatedAt: String(obj.updatedAt ?? new Date().toISOString()),
    completedAt:
      typeof obj.completedAt === "string" && obj.completedAt.trim()
        ? obj.completedAt
        : null,
  };
}
