import { ResultSummaryShell } from "@/components/shared/result-summary-shell";
import { getManagerDrillFlow } from "@/lib/drill-flow";
import type { OrderAnomalyOptions } from "@/lib/order-anomaly";
import type { ResultDrillFilters } from "@/lib/result-drill";
import type { Order, SupplementOrder } from "@/lib/types";

interface DispatcherResultSummaryProps {
  orders: Order[];
  supplements: SupplementOrder[];
  dispatcherFilter: string | "全部";
  isKeywordSearch?: boolean;
  drill: ResultDrillFilters;
  onDrillChange: (drill: ResultDrillFilters) => void;
  anomalyOptions?: OrderAnomalyOptions;
}

export function DispatcherResultSummary({
  orders,
  supplements,
  dispatcherFilter,
  isKeywordSearch = false,
  drill,
  onDrillChange,
  anomalyOptions,
}: DispatcherResultSummaryProps) {
  return (
    <ResultSummaryShell
      title="查找结果统计"
      baseOrders={orders}
      supplements={supplements}
      drill={drill}
      onDrillChange={onDrillChange}
      flow={getManagerDrillFlow("dispatcher", "全部", "全部")}
      totalAmountClassName="text-emerald-700"
      anomalyOptions={anomalyOptions}
    />
  );
}
