import type { StoreName } from "@/lib/types";
import type { StoreOrderStats } from "@/lib/store-stats";

interface StoreSummaryBarProps {
  stats: StoreOrderStats[];
  total: number;
  selected: StoreName | "全部";
  onSelect: (store: StoreName | "全部") => void;
  showAllOption?: boolean;
}

export function StoreSummaryBar({
  stats,
  total,
  selected,
  onSelect,
  showAllOption = true,
}: StoreSummaryBarProps) {
  const items: { key: StoreName | "全部"; label: string; count: number }[] = [
    ...(showAllOption
      ? [{ key: "全部" as const, label: "全部门店", count: total }]
      : []),
    ...stats.map((item) => ({
      key: item.store,
      label: item.store,
      count: item.total,
    })),
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelect(item.key)}
          className={`vi-filter-chip ${
            selected === item.key ? "vi-filter-chip-active" : ""
          }`}
        >
          <span className="font-medium">{item.label}</span>
          <span className="vi-filter-chip-badge">{item.count}</span>
        </button>
      ))}
    </div>
  );
}
