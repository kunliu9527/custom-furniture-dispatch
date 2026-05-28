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
}

export function EvaluationExportButton({
  mode,
  data,
  periodLabel,
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
      className="shrink-0 rounded-md border border-slate-200/60 bg-white/60 px-2 py-0.5 text-[11px] font-normal text-slate-400 transition hover:border-slate-300 hover:bg-white hover:text-slate-600"
    >
      导出
    </button>
  );
}
