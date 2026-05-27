import { ORDER_STATUSES } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";

interface StatusSummaryBarProps {
  counts: Record<OrderStatus, number>;
  total: number;
  selected: OrderStatus | "全部";
  onSelect: (status: OrderStatus | "全部") => void;
}

export function StatusSummaryBar({
  counts,
  total,
  selected,
  onSelect,
}: StatusSummaryBarProps) {
  const items: { key: OrderStatus | "全部"; label: string; count: number }[] = [
    { key: "全部", label: "全部", count: total },
    ...ORDER_STATUSES.map((status) => ({
      key: status,
      label: status,
      count: counts[status],
    })),
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelect(item.key)}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
            selected === item.key
              ? "border-indigo-300 bg-indigo-600 text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          }`}
        >
          <span className="font-medium">{item.label}</span>
          <span
            className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${
              selected === item.key
                ? "bg-indigo-500 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {item.count}
          </span>
        </button>
      ))}
    </div>
  );
}
