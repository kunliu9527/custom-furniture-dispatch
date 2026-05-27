import type { ReactNode } from "react";

interface EvaluationSectionToggleProps {
  title: string;
  active: boolean;
  onSelect: () => void;
  suffix?: ReactNode;
}

/** 评价看板门店子分区：同级切换，仅展示当前选中项明细 */
export function EvaluationSectionToggle({
  title,
  active,
  onSelect,
  suffix,
}: EvaluationSectionToggleProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`inline-flex flex-col items-start rounded-lg border px-4 py-2.5 text-left transition ${
        active
          ? "border-rose-300 bg-rose-50 ring-1 ring-rose-200"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <span
        className={`text-sm font-semibold ${
          active ? "text-rose-900" : "text-slate-900"
        }`}
      >
        {title}
      </span>
      {suffix ? (
        <span className="mt-1 text-xs font-normal text-slate-500">{suffix}</span>
      ) : null}
    </button>
  );
}
