"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import type { BoardSnapshotConfig } from "@/lib/board-snapshot-types";
import { captureAndDownloadBoardSnapshot } from "@/lib/board-snapshot-client";

interface BoardSnapshotToolbarProps {
  config: BoardSnapshotConfig;
  captureRootRef: RefObject<HTMLElement | null>;
}

export function BoardSnapshotToolbar({
  config,
  captureRootRef,
}: BoardSnapshotToolbarProps) {
  const [status, setStatus] = useState<"idle" | "capturing" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const busyRef = useRef(false);

  const handleCapture = useCallback(async () => {
    const root = captureRootRef.current;
    if (!root || busyRef.current) return;
    busyRef.current = true;
    setStatus("capturing");
    setMessage(null);

    try {
      await captureAndDownloadBoardSnapshot(root, config.label);
      setStatus("done");
      setMessage("已保存至本机下载目录");
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "快照失败，请稍后重试",
      );
    } finally {
      busyRef.current = false;
    }
  }, [captureRootRef, config.label]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-2.5 py-1">
      <p className="text-xs text-slate-500">
        宽表可横向滑动 · 快照将截取完整版面（含脚注）并下载 PNG
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {message ? (
          <span
            className={`max-w-[min(100%,20rem)] text-xs ${
              status === "error" ? "text-rose-600" : "text-emerald-700"
            }`}
          >
            {message}
          </span>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={status === "capturing"}
          onClick={() => void handleCapture()}
        >
          {status === "capturing" ? "截取中…" : "版面快照"}
        </Button>
      </div>
    </div>
  );
}
