"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface QrCodeDisplayProps {
  url: string;
  label?: string;
}

export function QrCodeDisplay({ url, label = "扫码打开" }: QrCodeDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(url, { width: 180, margin: 1 }).then((result) => {
      if (!cancelled) setDataUrl(result);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-2">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt={label} width={180} height={180} />
        ) : (
          <div className="flex h-[180px] w-[180px] items-center justify-center text-xs text-slate-400">
            生成二维码…
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-xs font-medium text-slate-600">{label}</p>
        <p className="break-all text-xs text-indigo-700">{url}</p>
        <button
          type="button"
          onClick={() => void navigator.clipboard.writeText(url)}
          className="text-xs text-slate-500 underline hover:text-slate-700"
        >
          复制链接
        </button>
      </div>
    </div>
  );
}
