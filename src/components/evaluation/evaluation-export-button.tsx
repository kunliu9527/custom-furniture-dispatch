"use client";

import {
  exportEvaluationData,
  type EvaluationExportPayload,
} from "@/lib/evaluation-export";
import type { EvaluationViewMode } from "@/lib/evaluation-stats";
import type { MouseEvent } from "react";

type EvaluationExportData = Omit<EvaluationExportPayload, "viewMode">;

interface EvaluationExportButtonProps {
  mode: EvaluationViewMode;
  data: EvaluationExportData;
  periodLabel?: string;
  className?: string;
}

export function EvaluationExportButton({
  mode,
  data,
  periodLabel,
  className = "",
}: EvaluationExportButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    event.preventDefault();
    exportEvaluationData({ ...data, viewMode: mode, periodLabel });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`shrink-0 rounded border border-[var(--vi-border-strong)] bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500 shadow-[var(--vi-shadow-xs)] transition hover:border-blue-200 hover:text-blue-700 ${className}`}
    >
      导出
    </button>
  );
}
