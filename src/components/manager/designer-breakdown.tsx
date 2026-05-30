import type { Order } from "@/lib/types";

interface DesignerBreakdownProps {
  orders: Order[];
  title?: string;
}

export function DesignerBreakdown({
  orders,
  title = "设计师分布",
}: DesignerBreakdownProps) {
  const map = new Map<string, number>();
  for (const order of orders) {
    const key = order.designer ?? "未指派";
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  if (orders.length === 0) {
    return (
      <p className="text-sm text-slate-500">暂无订单，无设计师统计</p>
    );
  }

  const items = [...map.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <p className="text-xs font-medium text-slate-600">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map(([designer, count]) => (
          <span
            key={designer}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700"
          >
            {designer}
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-800">
              {count}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
