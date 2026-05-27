import { ORDER_STATUSES } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";

interface StatusBreakdownProps {
  counts: Record<OrderStatus, number>;
  total: number;
  title?: string;
  /** 可点击筛选结果内订单 */
  interactive?: boolean;
  selected?: OrderStatus | "全部";
  onSelect?: (status: OrderStatus | "全部") => void;
}

export function StatusBreakdown({
  counts,
  total,
  title = "状态分布",
  interactive = false,
  selected = "全部",
  onSelect,
}: StatusBreakdownProps) {
  const items = ORDER_STATUSES.filter((status) => counts[status] > 0);

  if (total === 0) {
    return (
      <p className="text-sm text-slate-500">暂无订单，无状态统计</p>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium text-slate-600">
        {title}
        {interactive ? (
          <span className="ml-1 font-normal text-slate-400">· 点击标签筛选</span>
        ) : null}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {interactive && onSelect ? (
          <button
            type="button"
            onClick={() => onSelect("全部")}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition ${
              selected === "全部"
                ? "border-indigo-300 bg-indigo-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            全部
            <span
              className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                selected === "全部" ? "bg-indigo-500 text-white" : "bg-slate-100"
              }`}
            >
              {total}
            </span>
          </button>
        ) : null}
        {items.map((status) =>
          interactive && onSelect ? (
            <button
              key={status}
              type="button"
              onClick={() => onSelect(selected === status ? "全部" : status)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition ${
                selected === status
                  ? "border-indigo-300 bg-indigo-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              {status}
              <span
                className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                  selected === status
                    ? "bg-indigo-500 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {counts[status]}
              </span>
            </button>
          ) : (
            <span
              key={status}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700"
            >
              {status}
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-800">
                {counts[status]}
              </span>
            </span>
          ),
        )}
      </div>
    </div>
  );
}
