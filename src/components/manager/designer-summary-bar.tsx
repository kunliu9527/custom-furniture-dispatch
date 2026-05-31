import type { DesignerOrderStats } from "@/lib/manager-stats";
import type { DesignerName } from "@/lib/types";

type DesignerStatItem = {
  designer: string;
  homeStore: string;
  total: number;
  byStatus: DesignerOrderStats["byStatus"];
};

interface DesignerSummaryBarProps {
  stats: DesignerStatItem[];
  total: number;
  selected: DesignerName | "全部";
  onSelect: (designer: DesignerName | "全部") => void;
  showAllOption?: boolean;
}

export function DesignerSummaryBar({
  stats,
  total,
  selected,
  onSelect,
  showAllOption = true,
}: DesignerSummaryBarProps) {
  const items: { key: DesignerName | "全部"; label: string; count: number }[] = [
    ...(showAllOption
      ? [{ key: "全部" as const, label: "全部", count: total }]
      : []),
    ...stats.map((item) => ({
      key: item.designer as DesignerName,
      label: item.designer,
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
          title={
            item.key !== "全部"
              ? stats.find((s) => s.designer === item.key)?.homeStore
              : undefined
          }
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
