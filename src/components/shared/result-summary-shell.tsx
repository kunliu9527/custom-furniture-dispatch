import { ResultDrillPanel } from "@/components/shared/result-drill-panel";
import {
  formatDispatchMoney,
  sumDispatchTotals,
} from "@/lib/dispatch-totals";
import { countNonRefundOrders } from "@/lib/store-summary-metrics";
import { formatOrderAnomalySummary, type OrderAnomalyOptions } from "@/lib/order-anomaly";
import type { DrillFlow, ResultDrillFilters } from "@/lib/result-drill";
import type { Order, OrderStatus, SupplementOrder } from "@/lib/types";

interface ResultSummaryShellProps {
  title?: string;
  baseOrders: Order[];
  supplements: SupplementOrder[];
  drill: ResultDrillFilters;
  onDrillChange: (drill: ResultDrillFilters) => void;
  flow: DrillFlow;
  /** 顶部查找栏已选状态（按状态查找时传入，用于结果区标题） */
  lookupStatusFilter?: OrderStatus | "全部";
  totalAmountClassName?: string;
  anomalyOptions?: OrderAnomalyOptions;
}

export function ResultSummaryShell({
  title = "查找结果统计",
  baseOrders,
  supplements,
  drill,
  onDrillChange,
  flow,
  lookupStatusFilter,
  totalAmountClassName = "text-violet-700",
  anomalyOptions,
}: ResultSummaryShellProps) {
  const amounts = sumDispatchTotals(baseOrders, supplements);
  const effectiveCount = countNonRefundOrders(baseOrders);
  const effectiveAvg =
    effectiveCount > 0 ? amounts.totalDispatch / effectiveCount : 0;
  const anomalySummary = formatOrderAnomalySummary(baseOrders, anomalyOptions);
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
              {formatDispatchMoney(amounts.netNotOrderedAmount)}
            </span>
          </p>
          <p className={`mt-1 text-xs font-semibold ${totalAmountClassName}`}>
            有效总派单 {effectiveCount} / {formatDispatchMoney(amounts.totalDispatch)}
          </p>
          {effectiveCount > 0 ? (
            <p className="mt-1 text-xs text-slate-600">
              有效均单值{" "}
              <span className="font-medium text-slate-800">
                {formatDispatchMoney(effectiveAvg)}
              </span>
            </p>
          ) : null}
          {amounts.pendingRefundAmount > 0 ? (
            <p className="mt-1 text-xs text-amber-700">
              待退单金额 {formatDispatchMoney(amounts.pendingRefundAmount)}
            </p>
          ) : null}
          {amounts.confirmedRefundAmount > 0 ? (
            <p className="mt-1 text-xs text-red-600">
              已退单金额 {formatDispatchMoney(amounts.confirmedRefundAmount)}
            </p>
          ) : null}
          {afterSalesTotal > 0 ? (
            <p className="mt-1 text-xs text-rose-600">
              售后金合计 {formatDispatchMoney(afterSalesTotal)}
            </p>
          ) : null}
          {anomalySummary ? (
            <p className="mt-1 text-xs font-medium text-rose-600">{anomalySummary}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 border-t border-slate-200/80 pt-4">
        <ResultDrillPanel
          baseOrders={baseOrders}
          drill={drill}
          onDrillChange={onDrillChange}
          flow={flow}
          lookupStatusFilter={lookupStatusFilter}
        />
      </div>
    </div>
  );
}
