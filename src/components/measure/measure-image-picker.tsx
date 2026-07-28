"use client";

import { useRef, useState } from "react";
import { compressImage, readFileAsDataUrl } from "@/lib/measure/compress";
import type { MeasureImageStorage } from "@/lib/measure/types";
import "./measure-annotator.css";

interface MeasureImagePickerProps {
  storage: MeasureImageStorage;
  onStorageChange: (storage: MeasureImageStorage) => void;
  onPick: (dataUrl: string, fileName: string) => void;
  disabled?: boolean;
}

export function MeasureImagePicker({
  storage,
  onStorageChange,
  onPick,
  disabled,
}: MeasureImagePickerProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const raw = await readFileAsDataUrl(file);
      const dataUrl = await compressImage(raw, 1600, 0.78);
      onPick(dataUrl, file.name.replace(/\.[^.]+$/, "") || "现场照片");
    } catch {
      alert("读取图片失败，请重试");
    } finally {
      setBusy(false);
      if (cameraRef.current) cameraRef.current.value = "";
      if (albumRef.current) albumRef.current.value = "";
    }
  }

  return (
    <div className="measure-root space-y-3 rounded-xl border border-stone-200 bg-[#fffdfb] p-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-stone-500">图片保存位置</span>
        <button
          type="button"
          className={`chip ${storage === "cloud" ? "active" : ""}`}
          disabled={disabled || busy}
          onClick={() => onStorageChange("cloud")}
        >
          云端
        </button>
        <button
          type="button"
          className={`chip ${storage === "local" ? "active" : ""}`}
          disabled={disabled || busy}
          onClick={() => onStorageChange("local")}
        >
          本地
        </button>
        <span className="text-xs text-stone-400">
          {storage === "cloud"
            ? "同步到服务器，换手机也能看"
            : "仅保存在本机浏览器，不占服务器空间"}
        </span>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <input
        ref={albumRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      <div className="picker-row">
        <button
          type="button"
          className="btn btn-primary"
          disabled={disabled || busy}
          onClick={() => cameraRef.current?.click()}
        >
          {busy ? "压缩处理中…" : "拍照"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={disabled || busy}
          onClick={() => albumRef.current?.click()}
        >
          图库选图
        </button>
      </div>
    </div>
  );
}
