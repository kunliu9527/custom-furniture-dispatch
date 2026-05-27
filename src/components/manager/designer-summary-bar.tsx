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
  accent?: "indigo" | "emerald";
}

export function DesignerSummaryBar({
  stats,
  total,
  selected,
  onSelect,
  showAllOption = true,
  accent = "indigo",
}: DesignerSummaryBarProps) {
  const active =
    accent === "emerald"
      ? "border-emerald-300 bg-emerald-600 text-white shadow-sm"
      : "border-indigo-300 bg-indigo-600 text-white shadow-sm";
  const activeBadge =
    accent === "emerald"
      ? "bg-emerald-500 text-white"
      : "bg-indigo-500 text-white";

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
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
            selected === item.key
              ? active
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          }`}
        >
          <span className="font-medium">{item.label}</span>
          <span
            className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${
              selected === item.key
                ? activeBadge
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
