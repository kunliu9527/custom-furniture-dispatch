import type { AcceptanceLookupFilter } from "@/lib/customer-ratings";

interface AcceptanceSummaryBarProps {
  counts: Record<AcceptanceLookupFilter, number>;
  selected: AcceptanceLookupFilter;
  onSelect: (filter: AcceptanceLookupFilter) => void;
}

const labels: AcceptanceLookupFilter[] = [
  "全部",
  "待扫码",
  "已评价",
  "无电子验收",
];

export function AcceptanceSummaryBar({
  counts,
  selected,
  onSelect,
}: AcceptanceSummaryBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key)}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
            selected === key
              ? "border-teal-300 bg-teal-600 text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          }`}
        >
          <span className="font-medium">{key}</span>
          <span
            className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${
              selected === key
                ? "bg-teal-500 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {counts[key]}
          </span>
        </button>
      ))}
    </div>
  );
}
