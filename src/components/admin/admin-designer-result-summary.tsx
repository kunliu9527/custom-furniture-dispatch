"use client";

import { ResultSummaryShell } from "@/components/shared/result-summary-shell";
import { getAdminDrillFlow } from "@/lib/drill-flow";
import type { ResultDrillFilters } from "@/lib/result-drill";
import type { DesignerName, Order, SupplementOrder } from "@/lib/types";

interface AdminDesignerResultSummaryProps {
  orders: Order[];
  supplements: SupplementOrder[];
  designerFilter: DesignerName | "全部";
  isKeywordSearch?: boolean;
  drill: ResultDrillFilters;
  onDrillChange: (drill: ResultDrillFilters) => void;
}

export function AdminDesignerResultSummary({
  orders,
  supplements,
  designerFilter,
  isKeywordSearch = false,
  drill,
  onDrillChange,
}: AdminDesignerResultSummaryProps) {
  return (
    <ResultSummaryShell
      title="查找结果统计"
      baseOrders={orders}
      supplements={supplements}
      drill={drill}
      onDrillChange={onDrillChange}
      flow={getAdminDrillFlow("designer", designerFilter)}
      totalAmountClassName="text-emerald-700"
    />
  );
}
