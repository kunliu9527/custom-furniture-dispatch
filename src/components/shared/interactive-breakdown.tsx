interface BreakdownItem {
  key: string;
  label: string;
  count: number;
}

interface InteractiveBreakdownProps {
  title: string;
  items: BreakdownItem[];
  total?: number;
  selected: string | "全部";
  onSelect: (key: string | "全部") => void;
  showAllPill?: boolean;
  hint?: string;
}

export function InteractiveBreakdown({
  title,
  items,
  total,
  selected,
  onSelect,
  showAllPill = true,
  hint = "点击标签筛选",
}: InteractiveBreakdownProps) {
  if (items.length === 0 && !showAllPill) {
    return <p className="text-sm text-slate-500">暂无数据</p>;
  }

  return (
    <div>
      <p className="text-xs font-medium text-slate-600">
        {title}
        <span className="ml-1 font-normal text-slate-400">· {hint}</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {showAllPill && total !== undefined ? (
          <button
            type="button"
            onClick={() => onSelect("全部")}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition ${
              selected === "全部"
                ? "border-blue-300 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            全部
            <span
              className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                selected === "全部"
                  ? "bg-blue-500 text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {total}
            </span>
          </button>
        ) : null}
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() =>
              onSelect(selected === item.key ? "全部" : item.key)
            }
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition ${
              selected === item.key
                ? "border-blue-300 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            {item.label}
            <span
              className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                selected === item.key
                  ? "bg-blue-500 text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
