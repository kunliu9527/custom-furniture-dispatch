"use client";

import type { ReactNode } from "react";

interface DesignerOrderHintLineProps {
  pendingCount: number;
  acceptPendingCount: number;
  crossStoreCount: number;
  supplementCount: number;
}

function HintChip({
  tone,
  children,
}: {
  tone: "default" | "warn" | "danger" | "info";
  children: ReactNode;
}) {
  const tones = {
    default: "bg-zinc-100/80 text-zinc-600",
    warn: "bg-amber-50 text-amber-800 ring-amber-200/60",
    danger: "bg-rose-50 text-rose-700 ring-rose-200/60",
    info: "bg-blue-50 text-blue-700 ring-blue-200/60",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** 派单列表标题下方：待办提示（不含笔数，与标题后缀去重） */
export function DesignerOrderHintLine({
  pendingCount,
  acceptPendingCount,
  crossStoreCount,
  supplementCount,
}: DesignerOrderHintLineProps) {
  const hasAny =
    pendingCount > 0 ||
    acceptPendingCount > 0 ||
    crossStoreCount > 0 ||
    supplementCount > 0;

  if (!hasAny) {
    return (
      <p className="text-xs text-zinc-400">暂无待办提醒 · 订单状态正常</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {pendingCount > 0 ? (
        <HintChip tone="info">{pendingCount} 笔待量尺</HintChip>
      ) : null}
      {acceptPendingCount > 0 ? (
        <HintChip tone="warn">{acceptPendingCount} 笔待确认接单</HintChip>
      ) : null}
      {crossStoreCount > 0 ? (
        <HintChip tone="danger">{crossStoreCount} 笔跨店派单</HintChip>
      ) : null}
      {supplementCount > 0 ? (
        <HintChip tone="default">{supplementCount} 笔增补单</HintChip>
      ) : null}
    </div>
  );
}
