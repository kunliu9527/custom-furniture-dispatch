import {
  formatDispatchMoney,
  type DispatchAmountTotals,
} from "@/lib/dispatch-totals";

interface DispatchTotalsSummaryProps {
  totals: DispatchAmountTotals;
  className?: string;
  accentClassName?: string;
}

export function DispatchTotalsSummary({
  totals,
  className = "",
  accentClassName = "text-emerald-700",
}: DispatchTotalsSummaryProps) {
  return (
    <div className={`text-xs ${className}`}>
      <p className={accentClassName}>
        有效总派单：
        <span className="ml-1 font-semibold">
          {formatDispatchMoney(totals.totalDispatch)}
        </span>
      </p>
      <p className="mt-0.5 text-slate-500">
        已下单 {formatDispatchMoney(totals.orderedAmount)}
        <span className="mx-1">+</span>
        未下单 {formatDispatchMoney(totals.netNotOrderedAmount)}
        {totals.pendingRefundAmount > 0 ? (
          <>
            <span className="mx-1">·</span>
            待退单 {formatDispatchMoney(totals.pendingRefundAmount)}
          </>
        ) : null}
        {totals.confirmedRefundAmount > 0 ? (
          <>
            <span className="mx-1">·</span>
            已退单 {formatDispatchMoney(totals.confirmedRefundAmount)}
          </>
        ) : null}
      </p>
    </div>
  );
}
