import { ResultDrillPanel } from "@/components/shared/result-drill-panel";
import {
  formatDispatchMoney,
  sumDispatchTotals,
} from "@/lib/dispatch-totals";
import type { DrillFlow, ResultDrillFilters } from "@/lib/result-drill";
import type { Order, SupplementOrder } from "@/lib/types";

interface ResultSummaryShellProps {
  title?: string;
  baseOrders: Order[];
  supplements: SupplementOrder[];
  drill: ResultDrillFilters;
  onDrillChange: (drill: ResultDrillFilters) => void;
  flow: DrillFlow;
  totalAmountClassName?: string;
}

export function ResultSummaryShell({
  title = "查找结果统计",
  baseOrders,
  supplements,
  drill,
  onDrillChange,
  flow,
  totalAmountClassName = "text-violet-700",
}: ResultSummaryShellProps) {
  const amounts = sumDispatchTotals(baseOrders, supplements);
  const afterSalesTotal = baseOrders.reduce(
    (sum, order) => sum + (order.afterSalesAmount ?? 0),
    0,
  );

  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold text-slate-900">
            共 {baseOrders.length} 笔订单
          </p>
          <p className="mt-1 text-xs text-slate-600">
            已下单金额{" "}
            <span className="font-medium text-slate-800">
              {formatDispatchMoney(amounts.orderedAmount)}
            </span>
            <span className="mx-1 text-slate-300">·</span>
            未下单金额{" "}
            <span className="font-medium text-slate-800">
              {formatDispatchMoney(amounts.notOrderedAmount)}
            </span>
          </p>
          <p className={`mt-1 text-xs font-semibold ${totalAmountClassName}`}>
            合计总派单 {formatDispatchMoney(amounts.totalDispatch)}
          </p>
          {amounts.refundAmount > 0 ? (
            <p className="mt-1 text-xs text-red-600">
              退单金额 {formatDispatchMoney(amounts.refundAmount)}
            </p>
          ) : null}
          {afterSalesTotal > 0 ? (
            <p className="mt-1 text-xs text-rose-600">
              售后金合计 {formatDispatchMoney(afterSalesTotal)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 border-t border-slate-200/80 pt-4">
        <ResultDrillPanel
          baseOrders={baseOrders}
          drill={drill}
          onDrillChange={onDrillChange}
          flow={flow}
        />
      </div>
    </div>
  );
}
