import { ORDER_STATUSES } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";

interface StatusSummaryBarProps {
  counts: Record<string, number>;
  total: number;
  selected: OrderStatus | "全部";
  onSelect: (status: OrderStatus | "全部") => void;
  /** 限定展示的状态（默认全部 ORDER_STATUSES） */
  statuses?: OrderStatus[];
}

export function StatusSummaryBar({
  counts,
  total,
  selected,
  onSelect,
  statuses,
}: StatusSummaryBarProps) {
  const statusList = statuses ?? ORDER_STATUSES;
  const items: { key: OrderStatus | "全部"; label: string; count: number }[] = [
    { key: "全部", label: "全部", count: total },
    ...statusList.map((status) => ({
      key: status,
      label: status,
      count: counts[status] ?? 0,
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
