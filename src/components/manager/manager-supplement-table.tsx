import { formatCurrency } from "@/lib/order-format";
import { formatOrderDateDay } from "@/lib/order-utils";
import type { SupplementOrder } from "@/lib/types";

interface ManagerSupplementTableProps {
  supplements: SupplementOrder[];
}

export function ManagerSupplementTable({
  supplements,
}: ManagerSupplementTableProps) {
  if (supplements.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">
        暂无增补单记录
      </div>
    );
  }

  const total = supplements.reduce((sum, s) => sum + s.supplementAmount, 0);

  return (
    <div className="overflow-hidden rounded-xl border border-teal-200/60 bg-teal-50/20 shadow-sm">
      <div className="overflow-x-auto">
        <table className="vi-data-table w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="vi-table-head-row text-xs uppercase tracking-wide">
              <th className="px-4 py-3">客户地址</th>
              <th className="px-4 py-3">关联订单</th>
              <th className="px-4 py-3">设计师</th>
              <th className="px-4 py-3">补单金额</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">创建时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-teal-100/80 bg-white/60">
            {supplements.map((s) => (
              <tr key={s.id} className="hover:bg-teal-50/30">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {s.customerName}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">
                  {s.parentOrderId}
                </td>
                <td className="px-4 py-3 text-slate-700">{s.designer}</td>
                <td className="px-4 py-3 font-semibold text-teal-700">
                  {formatCurrency(s.supplementAmount)}
                </td>
                <td className="px-4 py-3 text-orange-700">{s.status}</td>
                <td className="px-4 py-3 text-slate-500">
                  {formatOrderDateDay(s.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-teal-100 px-4 py-2 text-xs text-teal-800/70">
        共 {supplements.length} 笔增补单 · 增补合计 {formatCurrency(total)}
      </p>
    </div>
  );
}
