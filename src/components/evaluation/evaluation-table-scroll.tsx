"use client";

import { useRef, type ReactNode } from "react";
import { BoardSnapshotToolbar } from "@/components/evaluation/board-snapshot-toolbar";
import type { BoardSnapshotConfig } from "@/lib/board-snapshot-types";

interface EvaluationTableScrollProps {
  children: ReactNode;
  footer?: ReactNode;
  /**
   * 可选：限制表格区域高度并在内部滚动。
   * 默认不限制，由外层固定容器统一纵向滚动。
   */
  maxHeightClass?: string;
  /** 启用「版面快照」：截取完整宽表并下载 PNG 至本机 */
  snapshot?: BoardSnapshotConfig;
}

/** 明细表：宽表横向滚动；表头在滚动容器内 sticky；移动端避免被底栏遮挡 */
export function EvaluationTableScroll({
  children,
  footer,
  maxHeightClass,
  snapshot,
}: EvaluationTableScrollProps) {
  const captureRootRef = useRef<HTMLDivElement>(null);

  const scrollClass = maxHeightClass
    ? `${maxHeightClass} overflow-auto overscroll-contain [-webkit-overflow-scrolling:touch]`
    : "overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] scroll-px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]";

  return (
    <div className="vi-panel overflow-hidden">
      {snapshot ? (
        <BoardSnapshotToolbar
          config={snapshot}
          captureRootRef={captureRootRef}
        />
      ) : null}
      <div ref={captureRootRef} data-board-snapshot-root className="bg-white">
        <div className={scrollClass} data-board-snapshot-scroll>
          {children}
        </div>
        {footer}
      </div>
    </div>
  );
}

export const TABLE_HEAD_STICKY_CLASS =
  "sticky top-0 z-10 vi-table-head-row backdrop-blur-sm";

/** 各板块明细表表头单元格 */
export const TABLE_TH_CLASS =
  "px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600 whitespace-nowrap leading-tight";

/** 各板块明细表数据单元格（紧凑，便于一屏多看行） */
export const TABLE_TD_CLASS =
  "px-2.5 py-1 text-xs text-slate-700 whitespace-nowrap leading-tight";

export const TABLE_FOOTER_CLASS =
  "border-t border-slate-100 px-2.5 py-1 text-[11px] leading-snug text-slate-400";
