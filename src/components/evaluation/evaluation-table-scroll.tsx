"use client";

import type { ReactNode } from "react";

interface EvaluationTableScrollProps {
  children: ReactNode;
  footer?: ReactNode;
  /**
   * 可选：限制表格区域高度并在内部滚动。
   * 默认不限制，由外层固定容器统一纵向滚动。
   */
  maxHeightClass?: string;
}

/** 明细表：宽表横向滚动；表头在滚动容器内 sticky；移动端避免被底栏遮挡 */
export function EvaluationTableScroll({
  children,
  footer,
  maxHeightClass,
}: EvaluationTableScrollProps) {
  const scrollClass = maxHeightClass
    ? `${maxHeightClass} overflow-auto overscroll-contain [-webkit-overflow-scrolling:touch]`
    : "overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] scroll-px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]";

  return (
    <div className="vi-panel overflow-hidden">
      <div className={scrollClass}>{children}</div>
      {footer}
    </div>
  );
}

export const TABLE_HEAD_STICKY_CLASS =
  "sticky top-0 z-10 vi-table-head-row backdrop-blur-sm";

/** 各板块明细表表头单元格 */
export const TABLE_TH_CLASS =
  "px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-600 whitespace-nowrap";
