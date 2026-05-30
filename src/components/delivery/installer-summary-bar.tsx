import type { InstallerDeliveryStats } from "@/lib/delivery-stats";
import { formatPersonRatingAvg } from "@/lib/customer-ratings";

interface InstallerSummaryBarProps {
  stats: InstallerDeliveryStats[];
  total: number;
  selected: string | "全部";
  onSelect: (installer: string | "全部") => void;
  showAllOption?: boolean;
}

export function InstallerSummaryBar({
  stats,
  total,
  selected,
  onSelect,
  showAllOption = true,
}: InstallerSummaryBarProps) {
  const items: { key: string | "全部"; label: string; count: number; hint?: string }[] = [
    ...(showAllOption ? [{ key: "全部" as const, label: "全部", count: total }] : []),
    ...stats.map((item) => ({
      key: item.installerName,
      label: item.installerName,
      count: item.total,
      hint: formatPersonRatingAvg(item.avgInstallRating),
    })),
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelect(item.key)}
          title={item.hint ? `安装师评价均分 ${item.hint}` : undefined}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
            selected === item.key
              ? "border-teal-300 bg-teal-600 text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          }`}
        >
          <span className="font-medium">{item.label}</span>
          {item.hint ? (
            <span
              className={`text-xs ${
                selected === item.key ? "text-teal-100" : "text-amber-700"
              }`}
            >
              {item.hint}
            </span>
          ) : null}
          <span
            className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${
              selected === item.key
                ? "bg-teal-500 text-white"
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
