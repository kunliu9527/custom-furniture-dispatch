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
          className={`vi-filter-chip ${
            selected === key ? "vi-filter-chip-active" : ""
          }`}
        >
          <span className="font-medium">{key}</span>
          <span className="vi-filter-chip-badge">{counts[key]}</span>
        </button>
      ))}
    </div>
  );
}
