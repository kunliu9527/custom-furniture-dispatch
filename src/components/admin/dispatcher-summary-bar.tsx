import type { DispatcherOrderStats } from "@/lib/admin-stats";

interface DispatcherSummaryBarProps {
  stats: DispatcherOrderStats[];
  total: number;
  selected: string | "全部";
  onSelect: (dispatcher: string | "全部") => void;
  /** 个人派单人权限为 false，不展示「全部」 */
  showAllOption?: boolean;
}

export function DispatcherSummaryBar({
  stats,
  total,
  selected,
  onSelect,
  showAllOption = true,
}: DispatcherSummaryBarProps) {
  const items: { key: string | "全部"; label: string; count: number }[] = [
    ...(showAllOption
      ? [{ key: "全部" as const, label: "全部", count: total }]
      : []),
    ...stats.map((item) => ({
      key: item.dispatcher,
      label: item.dispatcher,
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
