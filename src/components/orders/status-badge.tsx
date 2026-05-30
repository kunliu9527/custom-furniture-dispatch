import type { OrderStatus } from "@/lib/types";

const styles: Record<OrderStatus, string> = {
  未派单: "bg-zinc-100/90 text-zinc-600 ring-zinc-300/40",
  待量尺: "bg-amber-50 text-amber-800 ring-amber-300/35",
  已量尺: "bg-sky-50 text-sky-800 ring-sky-300/35",
  已出图: "bg-violet-50 text-violet-800 ring-violet-300/35",
  待签约: "bg-indigo-50 text-indigo-800 ring-indigo-300/35",
  已签约: "bg-emerald-50 text-emerald-800 ring-emerald-300/35",
  已下单: "bg-orange-50 text-orange-800 ring-orange-300/35",
  已安装: "bg-zinc-100 text-zinc-700 ring-zinc-300/35",
  已验收: "bg-teal-50 text-teal-800 ring-teal-300/35",
  待退单: "bg-rose-50 text-rose-800 ring-rose-300/35",
  已退单: "bg-red-50 text-red-800 ring-red-300/35",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`vi-status-badge ring-1 ring-inset ${styles[status]}`}
    >
      {status}
    </span>
  );
}
