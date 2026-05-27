import { ResultSummaryShell } from "@/components/shared/result-summary-shell";
import { getAdminDrillFlow } from "@/lib/drill-flow";
import type { ResultDrillFilters } from "@/lib/result-drill";
import type { Order, SupplementOrder } from "@/lib/types";

interface DispatcherResultSummaryProps {
  orders: Order[];
  supplements: SupplementOrder[];
  dispatcherFilter: string | "全部";
  isKeywordSearch?: boolean;
  drill: ResultDrillFilters;
  onDrillChange: (drill: ResultDrillFilters) => void;
}

export function DispatcherResultSummary({
  orders,
  supplements,
  dispatcherFilter,
  isKeywordSearch = false,
  drill,
  onDrillChange,
}: DispatcherResultSummaryProps) {
  return (
    <ResultSummaryShell
      title="查找结果统计"
      baseOrders={orders}
      supplements={supplements}
      drill={drill}
      onDrillChange={onDrillChange}
      flow={getAdminDrillFlow("dispatcher")}
      totalAmountClassName="text-emerald-700"
    />
  );
}
