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

/** 明细表：宽表横向滚动；表头在滚动容器内 sticky */
export function EvaluationTableScroll({
  children,
  footer,
  maxHeightClass,
}: EvaluationTableScrollProps) {
  const scrollClass = maxHeightClass
    ? `${maxHeightClass} overflow-auto overscroll-contain`
    : "overflow-x-auto";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className={scrollClass}>{children}</div>
      {footer}
    </div>
  );
}

export const TABLE_HEAD_STICKY_CLASS =
  "sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm";
