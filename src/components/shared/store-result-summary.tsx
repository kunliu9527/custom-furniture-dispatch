import { ResultSummaryShell } from "@/components/shared/result-summary-shell";
import { getManagerDrillFlow } from "@/lib/drill-flow";
import type { ViewMode } from "@/lib/manager-stats";
import type { ResultDrillFilters } from "@/lib/result-drill";
import type { DesignerName, Order, OrderStatus, StoreName, SupplementOrder } from "@/lib/types";

interface StoreResultSummaryProps {
  orders: Order[];
  supplements: SupplementOrder[];
  storeFilter: StoreName | "全部";
  isKeywordSearch?: boolean;
  drill: ResultDrillFilters;
  onDrillChange: (drill: ResultDrillFilters) => void;
  managerViewMode?: ViewMode;
  statusFilter?: OrderStatus | "全部";
  designerFilter?: DesignerName | "全部";
}

export function StoreResultSummary({
  orders,
  supplements,
  storeFilter,
  isKeywordSearch = false,
  drill,
  onDrillChange,
  managerViewMode = "store",
  statusFilter = "全部",
  designerFilter = "全部",
}: StoreResultSummaryProps) {
  const flow = getManagerDrillFlow(
    managerViewMode,
    statusFilter,
    designerFilter,
  );

  return (
    <ResultSummaryShell
      title="门店汇总统计"
      baseOrders={orders}
      supplements={supplements}
      drill={drill}
      onDrillChange={onDrillChange}
      flow={flow}
      totalAmountClassName="text-violet-700"
    />
  );
}
