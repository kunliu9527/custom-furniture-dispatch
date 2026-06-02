import {
  formatDispatchMoney,
  type DispatchAmountTotals,
} from "@/lib/dispatch-totals";
import { AGGREGATE_KPI_LABEL } from "@/lib/metric-display-labels";

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
        {AGGREGATE_KPI_LABEL.effectiveDispatch}：
        <span className="ml-1 font-semibold">
          {formatDispatchMoney(totals.totalDispatch)}
        </span>
      </p>
      <p className="mt-0.5 text-slate-500">
        {AGGREGATE_KPI_LABEL.ordered}{" "}
        {formatDispatchMoney(totals.orderedAmount)}
        <span className="mx-1">+</span>
            {AGGREGATE_KPI_LABEL.notOrdered}{" "}
            {formatDispatchMoney(totals.notOrderedAmount)}
        {totals.pendingRefundAmount > 0 ? (
          <>
            <span className="mx-1">·</span>
            {AGGREGATE_KPI_LABEL.pendingRefund}{" "}
            {formatDispatchMoney(totals.pendingRefundAmount)}
          </>
        ) : null}
        {totals.confirmedRefundAmount > 0 ? (
          <>
            <span className="mx-1">·</span>
            {AGGREGATE_KPI_LABEL.confirmedRefund}{" "}
            {formatDispatchMoney(totals.confirmedRefundAmount)}
          </>
        ) : null}
        {totals.refundAmount > 0 ? (
          <>
            <span className="mx-1">·</span>
            {AGGREGATE_KPI_LABEL.refundTotal}{" "}
            {formatDispatchMoney(totals.refundAmount)}
          </>
        ) : null}
      </p>
    </div>
  );
}
