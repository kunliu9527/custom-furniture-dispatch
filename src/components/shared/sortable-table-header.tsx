"use client";

import type { SortDirection } from "@/lib/table-sort";

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDirection;
}) {
  if (!active) {
    return (
      <span className="text-[10px] font-normal text-slate-300" aria-hidden>
        ↕
      </span>
    );
  }
  return (
    <span className="text-[10px] font-semibold text-blue-600" aria-hidden>
      {direction === "desc" ? "↓" : "↑"}
    </span>
  );
}

interface SortableThProps {
  label: string;
  column: string;
  activeColumn: string | null;
  direction: SortDirection;
  onSort: (column: string) => void;
  className?: string;
  align?: "left" | "center";
  title?: string;
}

export function SortableTh({
  label,
  column,
  activeColumn,
  direction,
  onSort,
  className = "",
  align = "center",
  title,
}: SortableThProps) {
  const active = activeColumn === column;
  const alignClass = align === "left" ? "text-left" : "text-center";

  return (
    <th
      className={className}
      aria-sort={
        active ? (direction === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        title={title ?? `按${label}排序`}
        className={`inline-flex items-center gap-0.5 font-bold uppercase tracking-wide text-slate-600 transition-colors hover:text-slate-900 ${alignClass} ${
          align === "center" ? "justify-center" : "justify-start"
        } ${active ? "text-blue-700" : ""}`}
      >
        <span>{label}</span>
        <SortIndicator active={active} direction={direction} />
      </button>
    </th>
  );
}
