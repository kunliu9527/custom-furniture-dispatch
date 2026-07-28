"use client";

import { useEffect, useState } from "react";
import { isBrowserSecureContext } from "@/lib/client-api";
import { compressImage, readFileAsDataUrl } from "@/lib/measure/compress";
import type { MeasureImageStorage } from "@/lib/measure/types";
import "./measure-annotator.css";

interface MeasureImagePickerProps {
  storage: MeasureImageStorage;
  onStorageChange: (storage: MeasureImageStorage) => void;
  onPick: (dataUrl: string, fileName: string) => void;
  disabled?: boolean;
}

function isLikelyUnsupportedImage(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return (
    type.includes("heic") ||
    type.includes("heif") ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

export function MeasureImagePicker({
  storage,
  onStorageChange,
  onPick,
  disabled,
}: MeasureImagePickerProps) {
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("");

  useEffect(() => {
    // 非 HTTPS（如 http://公网IP）下默认本地，减少依赖写入权限；用户仍可选手动切云端
    if (!isBrowserSecureContext() && storage === "cloud") {
      onStorageChange("local");
      setHint("当前为非安全连接，默认改存本地；需要同步时可改选云端");
    }
    // 仅首次挂载探测
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setHint("");
    try {
      if (!file.type.startsWith("image/") && !isLikelyUnsupportedImage(file)) {
        throw new Error("请选择图片文件");
      }
      if (isLikelyUnsupportedImage(file)) {
        throw new Error(
          "当前浏览器不支持 HEIC/HEIF，请在系统相册中先转为 JPEG/PNG 再选",
        );
      }
      const raw = await readFileAsDataUrl(file);
      const dataUrl = await compressImage(raw, 1600, 0.78);
      onPick(dataUrl, file.name.replace(/\.[^.]+$/, "") || "现场照片");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "读取图片失败，请重试";
      setHint(message);
      alert(message);
    } finally {
      setBusy(false);
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
          onClick={() => {
            onStorageChange("cloud");
            setHint("");
          }}
        >
          云端
        </button>
        <button
          type="button"
          className={`chip ${storage === "local" ? "active" : ""}`}
          disabled={disabled || busy}
          onClick={() => {
            onStorageChange("local");
            setHint("");
          }}
        >
          本地
        </button>
        <span className="text-xs text-stone-400">
          {storage === "cloud"
            ? "同步到服务器，换手机也能看"
            : "仅保存在本机浏览器，不占服务器空间"}
        </span>
      </div>

      {/* 用 label 包裹 input，避免部分 WebView 拦截 button 程序化 click */}
      <div className="picker-row">
        <label
          className={`btn btn-primary relative inline-flex cursor-pointer items-center justify-center ${
            disabled || busy ? "pointer-events-none opacity-45" : ""
          }`}
        >
          {busy ? "压缩处理中…" : "拍照"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            disabled={disabled || busy}
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <label
          className={`btn btn-secondary relative inline-flex cursor-pointer items-center justify-center ${
            disabled || busy ? "pointer-events-none opacity-45" : ""
          }`}
        >
          图库选图
          <input
            type="file"
            accept="image/*,.jpg,.jpeg,.png,.webp,.gif"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            disabled={disabled || busy}
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {hint ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
