"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MeasureAnnotator } from "@/components/measure/measure-annotator";
import { MeasureImagePicker } from "@/components/measure/measure-image-picker";
import { DrawingMeasurePanel } from "@/components/measure/drawing-measure-panel";
import { apiFetch } from "@/lib/client-api";
import { getClientSyncApiKey } from "@/lib/sync-config";
import {
  deleteLocalMeasureImage,
  loadLocalMeasureImage,
  saveLocalMeasureImage,
} from "@/lib/measure/local-image-store";
import type {
  MeasureAnnotation,
  MeasureImageStorage,
  MeasurePhotoView,
  OrderMeasurement,
  OrderMeasurePhoto,
} from "@/lib/measure/types";
import { measureUid, normalizeMeasureAnnotation } from "@/lib/measure/types";
import {
  exportMeasurePhotosBatch,
  type MeasureBatchExportMode,
} from "@/lib/measure/batch-export";
import type { Order } from "@/lib/types";
import "./measure-annotator.css";

interface MeasureWorkspaceProps {
  order: Order;
  open: boolean;
  onClose: () => void;
  onSaveMeasurement: (orderId: string, measurement: OrderMeasurement) => void;
  /** 测量完成：推进到已量尺 */
  onCompleteMeasure?: () => void;
}

async function resolveImageDataUrl(
  orderId: string,
  photo: OrderMeasurePhoto,
): Promise<string | null> {
  if (photo.storage === "local") {
    return loadLocalMeasureImage(orderId, photo.id);
  }
  if (photo.imageUrl) {
    try {
      const res = await fetch(photo.imageUrl);
      if (!res.ok) return null;
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }
  return null;
}

async function uploadCloudImage(
  orderId: string,
  photoId: string,
  dataUrl: string,
): Promise<string> {
  const key = getClientSyncApiKey();
  const res = await apiFetch("/api/measure-images", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(key ? { "x-sync-key": key } : {}),
    },
    body: JSON.stringify({ orderId, photoId, dataUrl }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error || "云端上传失败");
  }
  const data = (await res.json()) as { imageUrl: string };
  return data.imageUrl;
}

export function MeasureWorkspace({
  order,
  open,
  onClose,
  onSaveMeasurement,
  onCompleteMeasure,
}: MeasureWorkspaceProps) {
  const [storage, setStorage] = useState<MeasureImageStorage>("cloud");
  const [workMode, setWorkMode] = useState<"site" | "drawing">("site");
  const [photos, setPhotos] = useState<OrderMeasurePhoto[]>(
    order.measurement?.photos ?? [],
  );
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const [editing, setEditing] = useState<MeasurePhotoView | null>(null);
  const [editingIndex, setEditingIndex] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [imageCache, setImageCache] = useState<Record<string, string>>({});
  const [exportBusy, setExportBusy] = useState(false);
  const [exportMode, setExportMode] =
    useState<MeasureBatchExportMode>("annotated");

  const sessionKeyRef = useRef<string | null>(null);

  // 仅在打开工作台或切换订单时重置；勿在 persist 回写 measurement 时清空 editing
  useEffect(() => {
    if (!open) {
      sessionKeyRef.current = null;
      return;
    }
    const sessionKey = order.id;
    if (sessionKeyRef.current === sessionKey) return;
    sessionKeyRef.current = sessionKey;
    setPhotos(order.measurement?.photos ?? []);
    setEditing(null);
    setEditingIndex(0);
    setError("");
    setWorkMode("site");
  }, [open, order.id, order.measurement]);

  const persist = useCallback(
    (nextPhotos: OrderMeasurePhoto[]) => {
      photosRef.current = nextPhotos;
      setPhotos(nextPhotos);
      onSaveMeasurement(order.id, {
        photos: nextPhotos,
        updatedAt: new Date().toISOString(),
        completedAt: order.measurement?.completedAt ?? null,
      });
    },
    [onSaveMeasurement, order.id, order.measurement?.completedAt],
  );

  const title = useMemo(
    () => `易测量 · ${order.customerName || order.address}`,
    [order.address, order.customerName],
  );

  const resolveCached = useCallback(
    async (photo: OrderMeasurePhoto): Promise<string | null> => {
      if (imageCache[photo.id]) return imageCache[photo.id];
      const dataUrl = await resolveImageDataUrl(order.id, photo);
      if (dataUrl) {
        setImageCache((prev) => ({ ...prev, [photo.id]: dataUrl }));
      }
      return dataUrl;
    },
    [imageCache, order.id],
  );

  async function openPhotoAt(index: number, list: OrderMeasurePhoto[] = photos) {
    const photo = list[index];
    if (!photo) return;
    setError("");
    setBusyId(photo.id);
    try {
      const dataUrl = await resolveCached(photo);
      if (!dataUrl) {
        setError(
          photo.storage === "local"
            ? "本地图片不存在（可能已清除浏览器数据或换了设备）"
            : "云端图片加载失败",
        );
        return;
      }
      setEditingIndex(index);
      setEditing({
        ...photo,
        annotations: (photo.annotations || []).map((a) =>
          normalizeMeasureAnnotation(a),
        ),
        imageDataUrl: dataUrl,
      });

      // 预加载相邻图，滑动更顺
      const neighbors = [list[index - 1], list[index + 1]].filter(Boolean);
      for (const n of neighbors) {
        void resolveCached(n);
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handlePick(dataUrl: string, fileName: string) {
    setError("");
    let photoId = "";
    try {
      photoId = measureUid();
      setBusyId(photoId);
      let imageUrl: string | undefined;
      let usedStorage = storage;
      if (storage === "cloud") {
        try {
          imageUrl = await uploadCloudImage(order.id, photoId, dataUrl);
        } catch (cloudErr) {
          // 云端失败时自动回落本地，避免现场量尺完全中断
          await saveLocalMeasureImage(order.id, photoId, dataUrl);
          usedStorage = "local";
          setStorage("local");
          setError(
            cloudErr instanceof Error
              ? `云端上传失败，已改存本地：${cloudErr.message}`
              : "云端上传失败，已改存本地",
          );
        }
      } else {
        await saveLocalMeasureImage(order.id, photoId, dataUrl);
      }
      const now = new Date().toISOString();
      const photo: OrderMeasurePhoto = {
        id: photoId,
        name: fileName,
        room: "其他",
        storage: usedStorage,
        imageUrl,
        annotations: [],
        createdAt: now,
        updatedAt: now,
      };
      const next = [...photosRef.current, photo];
      persist(next);
      setImageCache((prev) => ({ ...prev, [photoId]: dataUrl }));
      setEditingIndex(next.length - 1);
      setEditing({ ...photo, imageDataUrl: dataUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "添加照片失败");
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveDrawingToArchive(payload: {
    imageDataUrl: string;
    name: string;
    room: string;
    annotations: MeasureAnnotation[];
  }) {
    setError("");
    let photoId = "";
    try {
      photoId = measureUid();
      setBusyId(photoId);
      let imageUrl: string | undefined;
      if (storage === "cloud") {
        imageUrl = await uploadCloudImage(order.id, photoId, payload.imageDataUrl);
      } else {
        await saveLocalMeasureImage(order.id, photoId, payload.imageDataUrl);
      }
      const now = new Date().toISOString();
      const photo: OrderMeasurePhoto = {
        id: photoId,
        name: payload.name,
        room: payload.room,
        storage,
        imageUrl,
        annotations: payload.annotations,
        createdAt: now,
        updatedAt: now,
      };
      const next = [...photosRef.current, photo];
      persist(next);
      setImageCache((prev) => ({ ...prev, [photoId]: payload.imageDataUrl }));
      setWorkMode("site");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存图纸量尺失败");
      throw err;
    } finally {
      setBusyId(null);
    }
  }

  function handleAnnotatorSave(
    annotations: MeasureAnnotation[],
    meta: { name: string; room: string },
  ) {
    if (!editing) return;
    const now = new Date().toISOString();
    const next = photosRef.current.map((p) =>
      p.id === editing.id
        ? {
            ...p,
            name: meta.name,
            room: meta.room,
            annotations,
            updatedAt: now,
          }
        : p,
    );
    persist(next);
    setEditing({
      ...editing,
      name: meta.name,
      room: meta.room,
      annotations,
      updatedAt: now,
    });
  }

  async function handleNavigate(direction: -1 | 1) {
    // 等 annotator flushSave（onSave→persist）后再读最新列表
    await Promise.resolve();
    const list = photosRef.current;
    const nextIndex = editingIndex + direction;
    if (nextIndex < 0 || nextIndex >= list.length) return;
    await openPhotoAt(nextIndex, list);
  }

  async function handleBatchExport(mode: MeasureBatchExportMode) {
    if (photos.length === 0 || exportBusy) return;
    setExportMode(mode);
    setExportBusy(true);
    setError("");
    try {
      const items = [];
      for (const photo of photos) {
        const dataUrl = await resolveCached(photo);
        if (!dataUrl) {
          throw new Error(
            `无法加载「${photo.name}」${
              photo.storage === "local" ? "（本地图片可能已丢失）" : ""
            }`,
          );
        }
        items.push({
          photo: {
            ...photo,
            annotations:
              editing?.id === photo.id
                ? editing.annotations
                : photo.annotations,
          },
          imageDataUrl: dataUrl,
        });
      }
      const result = await exportMeasurePhotosBatch(items, mode, {
        orderLabel: order.customerName || order.address || "量尺",
      });
      if (result.failed > 0) {
        setError(`导出完成：成功 ${result.ok} 张，失败 ${result.failed} 张`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "批量导出失败");
    } finally {
      setExportBusy(false);
    }
  }

  async function handleDelete(photo: OrderMeasurePhoto) {
    if (!confirm(`删除照片「${photo.name}」？`)) return;
    if (photo.storage === "local") {
      await deleteLocalMeasureImage(order.id, photo.id);
    } else if (photo.imageUrl) {
      const key = getClientSyncApiKey();
      await apiFetch(
        `/api/measure-images?orderId=${encodeURIComponent(order.id)}&photoId=${encodeURIComponent(photo.id)}`,
        {
          method: "DELETE",
          headers: key ? { "x-sync-key": key } : undefined,
        },
      ).catch(() => undefined);
    }
    const next = photos.filter((p) => p.id !== photo.id);
    persist(next);
    setImageCache((prev) => {
      const copy = { ...prev };
      delete copy[photo.id];
      return copy;
    });
    if (editing?.id === photo.id) {
      if (next.length === 0) {
        setEditing(null);
        setEditingIndex(0);
      } else {
        const newIndex = Math.min(editingIndex, next.length - 1);
        await openPhotoAt(newIndex, next);
      }
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-stone-100/95 backdrop-blur-sm pt-[env(safe-area-inset-top,0)] pb-[env(safe-area-inset-bottom,0)]">
      {editing ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-stone-200 bg-white px-3 py-2 sm:px-4">
          <p className="min-w-0 truncate text-sm font-semibold text-stone-900">{title}</p>
          <button
            type="button"
            className="shrink-0 rounded-full border border-stone-200 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
            onClick={onClose}
          >
            关闭
          </button>
        </div>
      ) : (
      <div className="flex flex-col gap-2 border-b border-stone-200 bg-white px-3 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-900">{title}</p>
          <p className="text-xs text-stone-500">
            现场拍照或图纸测距 · 多图可切换 · 超过 1 张自动 ZIP
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="flex overflow-hidden rounded-full border border-stone-200 text-xs">
              <button
                type="button"
                className={`px-3 py-1.5 ${
                  workMode === "site"
                    ? "bg-teal-700 text-white"
                    : "bg-white text-stone-600 hover:bg-stone-50"
                }`}
                onClick={() => setWorkMode("site")}
              >
                现场模式
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 ${
                  workMode === "drawing"
                    ? "bg-teal-700 text-white"
                    : "bg-white text-stone-600 hover:bg-stone-50"
                }`}
                onClick={() => setWorkMode("drawing")}
              >
                图纸模式
              </button>
            </div>
          <button
            type="button"
            className="rounded-full border border-stone-200 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
            onClick={onClose}
          >
            关闭
          </button>
        </div>
      </div>
      )}

      <div className={`min-h-0 flex-1 overflow-auto px-3 py-3 sm:px-4 ${editing ? "pt-2" : ""}`}>
        {editing ? (
          <MeasureAnnotator
            key={editing.id}
            photo={editing}
            photoIndex={editingIndex}
            photoCount={photos.length}
            onSave={handleAnnotatorSave}
            onBack={() => setEditing(null)}
            onNavigate={(dir) => void handleNavigate(dir)}
          />
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            {workMode === "drawing" ? (
              <>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-stone-500">归档保存位置</span>
                  <button
                    type="button"
                    className={`rounded-full border px-2.5 py-1 text-xs ${
                      storage === "cloud"
                        ? "border-teal-600 bg-teal-700 text-white"
                        : "border-stone-200 bg-white text-stone-600"
                    }`}
                    onClick={() => setStorage("cloud")}
                  >
                    云端
                  </button>
                  <button
                    type="button"
                    className={`rounded-full border px-2.5 py-1 text-xs ${
                      storage === "local"
                        ? "border-teal-600 bg-teal-700 text-white"
                        : "border-stone-200 bg-white text-stone-600"
                    }`}
                    onClick={() => setStorage("local")}
                  >
                    本地
                  </button>
                </div>
                <DrawingMeasurePanel
                  disabled={Boolean(busyId) || exportBusy}
                  onSaveToArchive={handleSaveDrawingToArchive}
                />
              </>
            ) : (
              <MeasureImagePicker
                storage={storage}
                onStorageChange={setStorage}
                onPick={(dataUrl, name) => void handlePick(dataUrl, name)}
                disabled={Boolean(busyId) || exportBusy}
              />
            )}
            {error ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {error}
              </p>
            ) : null}

            <section className="rounded-xl border border-teal-100 bg-white p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-teal-900">
                    测量结果归档
                    {order.measurement?.completedAt ? (
                      <span className="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-medium text-teal-800">
                        已完成
                      </span>
                    ) : null}
                  </h3>
                  <p className="mt-0.5 text-xs text-teal-700/80">
                    量尺照片（{photos.length}）
                    {order.measurement?.completedAt
                      ? ` · 完成于 ${new Date(order.measurement.completedAt).toLocaleString("zh-CN", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : null}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {photos.length > 0 ? (
                    <>
                      <button
                        type="button"
                        className="rounded-full bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-50"
                        disabled={exportBusy}
                        onClick={() => void handleBatchExport("annotated")}
                      >
                        {exportBusy && exportMode === "annotated"
                          ? "导出中…"
                          : "批量导图"}
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                        disabled={exportBusy}
                        onClick={() => void handleBatchExport("original")}
                      >
                        {exportBusy && exportMode === "original"
                          ? "导出中…"
                          : "批量原图"}
                      </button>
                    </>
                  ) : null}
                  {onCompleteMeasure &&
                  photos.length > 0 &&
                  order.status === "待量尺" &&
                  !order.measurement?.completedAt ? (
                    <button
                      type="button"
                      className="rounded-full border border-teal-300 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-800 hover:bg-teal-100"
                      onClick={() => {
                        if (
                          confirm(
                            `确认本单测量已完成？将归档 ${photos.length} 张照片，并推进状态为「已量尺」。`,
                          )
                        ) {
                          const now = new Date().toISOString();
                          onSaveMeasurement(order.id, {
                            photos: photosRef.current,
                            updatedAt: now,
                            completedAt: now,
                          });
                          onCompleteMeasure();
                        }
                      }}
                    >
                      测量完成
                    </button>
                  ) : null}
                </div>
              </div>

              {photos.length === 0 ? (
                <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
                  还没有照片。请先拍照或从图库选图开始量尺记录。
                </p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {photos.map((photo, index) => (
                    <li
                      key={photo.id}
                      className="flex items-center gap-2 rounded-xl border border-teal-100 bg-teal-50/40 p-3"
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        disabled={busyId === photo.id || exportBusy}
                        onClick={() => void openPhotoAt(index)}
                      >
                        <p className="truncate text-sm font-medium text-stone-900">
                          {index + 1}. {photo.name}
                        </p>
                        <p className="text-xs text-stone-500">
                          {photo.room} ·{" "}
                          {photo.storage === "cloud" ? "云端" : "本地"} · 标注{" "}
                          {photo.annotations?.length ?? 0}
                          {busyId === photo.id ? " · 加载中…" : ""}
                        </p>
                      </button>
                      <button
                        type="button"
                        className="shrink-0 rounded-full px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                        onClick={() => void handleDelete(photo)}
                      >
                        删除
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {photos.length > 0 ? (
                <p className="mt-2 text-[11px] text-stone-400">
                  「批量导图」带尺寸标注；「批量原图」去掉量尺图层。超过 1 张会自动打成 ZIP 下载。
                </p>
              ) : null}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
