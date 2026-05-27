import type { OrderStatus } from "@/lib/types";

const styles: Record<OrderStatus, string> = {
  待量尺: "bg-amber-50 text-amber-700 ring-amber-600/20",
  已量尺: "bg-sky-50 text-sky-700 ring-sky-600/20",
  已出图: "bg-violet-50 text-violet-700 ring-violet-600/20",
  已签约: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  已下单: "bg-orange-50 text-orange-700 ring-orange-600/20",
  已安装: "bg-slate-100 text-slate-700 ring-slate-600/20",
  待退单: "bg-rose-50 text-rose-700 ring-rose-600/20",
  已退单: "bg-red-50 text-red-800 ring-red-300/30",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      {status}
    </span>
  );
}
