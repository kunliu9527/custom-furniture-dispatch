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
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
            selected === item.key
              ? "border-emerald-300 bg-emerald-600 text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          }`}
        >
          <span className="font-medium">{item.label}</span>
          <span
            className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${
              selected === item.key
                ? "bg-emerald-500 text-white"
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
