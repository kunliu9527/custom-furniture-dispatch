import { ResultSummaryShell } from "@/components/shared/result-summary-shell";
import { getManagerDrillFlow } from "@/lib/drill-flow";
import type { ViewMode } from "@/lib/manager-stats";
import type { DrillFlow, ResultDrillFilters } from "@/lib/result-drill";
import type { DesignerName, Order, OrderStatus, SupplementOrder } from "@/lib/types";

interface ManagerResultSummaryProps {
  viewMode: ViewMode;
  orders: Order[];
  supplements: SupplementOrder[];
  statusFilter: OrderStatus | "全部";
  designerFilter: DesignerName | "全部";
  isKeywordSearch?: boolean;
  drill: ResultDrillFilters;
  onDrillChange: (drill: ResultDrillFilters) => void;
}

export function ManagerResultSummary({
  viewMode,
  orders,
  supplements,
  statusFilter,
  designerFilter,
  isKeywordSearch = false,
  drill,
  onDrillChange,
}: ManagerResultSummaryProps) {
  const flow: DrillFlow = getManagerDrillFlow(
    viewMode,
    statusFilter,
    designerFilter,
  );

  return (
    <ResultSummaryShell
      baseOrders={orders}
      supplements={supplements}
      drill={drill}
      onDrillChange={onDrillChange}
      flow={flow}
    />
  );
}
