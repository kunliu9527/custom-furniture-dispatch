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
          className={`vi-filter-chip ${
            selected === item.key ? "vi-filter-chip-active" : ""
          }`}
        >
          <span className="font-medium">{item.label}</span>
          {item.hint ? (
            <span
              className={`text-xs ${
                selected === item.key ? "text-white/85" : "text-amber-700"
              }`}
            >
              {item.hint}
            </span>
          ) : null}
          <span className="vi-filter-chip-badge">{item.count}</span>
        </button>
      ))}
    </div>
  );
}
