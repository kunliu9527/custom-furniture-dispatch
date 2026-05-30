"use client";

import { StarDisplay } from "@/components/shared/star-display";
import type { CustomerRatingEntry } from "@/lib/customer-ratings";

interface CustomerRatingTableProps {
  entries: CustomerRatingEntry[];
  /** person：每人每单一条；order：每单合并一行 */
  mode?: "person" | "order";
  emptyMessage?: string;
  maxRows?: number;
}

export function CustomerRatingTable({
  entries,
  mode = "person",
  emptyMessage = "暂无评价数据",
  maxRows,
}: CustomerRatingTableProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  if (mode === "order") {
    const byOrder = new Map<
      string,
      { customerName: string; dispatchStore: string; acceptedAt: string; items: CustomerRatingEntry[] }
    >();
    for (const entry of entries) {
      const bucket = byOrder.get(entry.orderId) ?? {
        customerName: entry.customerName,
        dispatchStore: entry.dispatchStore,
        acceptedAt: entry.acceptedAt,
        items: [],
      };
      bucket.items.push(entry);
      byOrder.set(entry.orderId, bucket);
    }
    const rows = [...byOrder.values()].sort(
      (a, b) =>
        new Date(b.acceptedAt).getTime() - new Date(a.acceptedAt).getTime(),
    );
    const visible = maxRows ? rows.slice(0, maxRows) : rows;

    return (
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2">客户</th>
              <th className="px-3 py-2">门店</th>
              <th className="px-3 py-2">派单人</th>
              <th className="px-3 py-2">设计师</th>
              <th className="px-3 py-2">安装师</th>
              <th className="px-3 py-2">整体</th>
              <th className="px-3 py-2">验收时间</th>
              <th className="px-3 py-2">评语</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const pick = (role: CustomerRatingEntry["role"]) =>
                row.items.find((i) => i.role === role);
              const dispatcher = pick("dispatcher");
              const designer = pick("designer");
              const installer = pick("installer");
              const overall = pick("overall");
              return (
                <tr key={row.items[0]?.orderId} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium">{row.customerName}</td>
                  <td className="px-3 py-2 text-xs">{row.dispatchStore}</td>
                  <td className="px-3 py-2">
                    <PersonStarCell name={dispatcher?.personName} stars={dispatcher?.stars} />
                  </td>
                  <td className="px-3 py-2">
                    <PersonStarCell name={designer?.personName} stars={designer?.stars} />
                  </td>
                  <td className="px-3 py-2">
                    <PersonStarCell name={installer?.personName} stars={installer?.stars} />
                  </td>
                  <td className="px-3 py-2">
                    {overall ? <StarDisplay value={overall.stars} /> : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {new Date(row.acceptedAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="max-w-[180px] truncate px-3 py-2 text-xs text-slate-600">
                    {row.items[0]?.comment ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  const visible = maxRows ? entries.slice(0, maxRows) : entries;
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th className="px-3 py-2">客户</th>
            <th className="px-3 py-2">门店</th>
            <th className="px-3 py-2">评价项</th>
            <th className="px-3 py-2">被评价人</th>
            <th className="px-3 py-2">星级</th>
            <th className="px-3 py-2">验收时间</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((entry, index) => (
            <tr
              key={`${entry.orderId}-${entry.role}-${index}`}
              className="border-t border-slate-100"
            >
              <td className="px-3 py-2 font-medium">{entry.customerName}</td>
              <td className="px-3 py-2 text-xs">{entry.dispatchStore}</td>
              <td className="px-3 py-2 text-slate-600">{entry.roleLabel}</td>
              <td className="px-3 py-2">{entry.personName ?? "—"}</td>
              <td className="px-3 py-2">
                <StarDisplay value={entry.stars} />
              </td>
              <td className="px-3 py-2 text-xs text-slate-500">
                {new Date(entry.acceptedAt).toLocaleDateString("zh-CN")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PersonStarCell({
  name,
  stars,
}: {
  name?: string | null;
  stars?: number;
}) {
  if (!stars) return <span className="text-slate-400">—</span>;
  return (
    <div className="flex flex-col gap-0.5">
      {name ? <span className="text-xs text-slate-700">{name}</span> : null}
      <StarDisplay value={stars} />
    </div>
  );
}
