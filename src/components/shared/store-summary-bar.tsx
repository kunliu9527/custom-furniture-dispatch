import type { StoreOrderStats } from "@/lib/store-stats";
import type { StoreName } from "@/lib/types";

type Accent = "emerald" | "indigo";

interface StoreSummaryBarProps {
  stats: StoreOrderStats[];
  total: number;
  selected: StoreName | "全部";
  onSelect: (store: StoreName | "全部") => void;
  accent?: Accent;
  /** 门店层级权限为 false，不展示「全部门店」 */
  showAllOption?: boolean;
}

const accentClasses: Record<
  Accent,
  { active: string; badge: string }
> = {
  emerald: {
    active: "border-emerald-300 bg-emerald-600 text-white shadow-sm",
    badge: "bg-emerald-500 text-white",
  },
  indigo: {
    active: "border-indigo-300 bg-indigo-600 text-white shadow-sm",
    badge: "bg-indigo-500 text-white",
  },
};

export function StoreSummaryBar({
  stats,
  total,
  selected,
  onSelect,
  accent = "indigo",
  showAllOption = true,
}: StoreSummaryBarProps) {
  const active = accentClasses[accent];
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
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
            selected === item.key
              ? active.active
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          }`}
        >
          <span className="font-medium">{item.label}</span>
          <span
            className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${
              selected === item.key
                ? active.badge
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
