import type { OrderStatus } from "@/lib/types";

/** 语义色：橙/蓝/绿/红/灰，不用 indigo/violet */
const styles: Record<OrderStatus, string> = {
  未派单: "bg-zinc-100 text-zinc-700 ring-zinc-300/50",
  待量尺: "bg-amber-50 text-amber-800 ring-amber-300/40",
  已量尺: "bg-sky-50 text-sky-800 ring-sky-300/40",
  已出图: "bg-blue-50 text-blue-800 ring-blue-300/40",
  待签约: "bg-orange-50 text-orange-800 ring-orange-300/40",
  已签约: "bg-emerald-50 text-emerald-800 ring-emerald-300/40",
  已下单: "bg-orange-50 text-orange-900 ring-orange-300/40",
  已安装: "bg-slate-100 text-slate-700 ring-slate-300/40",
  已验收: "bg-teal-50 text-teal-800 ring-teal-300/40",
  待退单: "bg-rose-50 text-rose-800 ring-rose-300/40",
  已退单: "bg-red-50 text-red-800 ring-red-300/40",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`vi-status-badge ring-1 ring-inset ${styles[status]}`}>
      {status}
    </span>
  );
}
