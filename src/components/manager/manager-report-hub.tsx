"use client";

import { ReportHub, pickUrgentReportTab } from "@/components/shared/report-hub";
import type { ManagerReportTab } from "@/lib/manager-ui-persistence";

interface ManagerReportHubProps {
  orders: Parameters<typeof ReportHub>[0]["orders"];
  supplements: Parameters<typeof ReportHub>[0]["supplements"];
  period: Parameters<typeof ReportHub>[0]["period"];
  activeTab: ManagerReportTab;
  onTabChange: (tab: ManagerReportTab) => void;
  onPeriodChange?: Parameters<typeof ReportHub>[0]["onPeriodChange"];
  onSelectDesigner?: (designer: string) => void;
  onOpenPendingOrder?: Parameters<typeof ReportHub>[0]["onOpenPendingOrder"];
  storeScopeLabel?: string | null;
}

export function ManagerReportHub({
  activeTab,
  onTabChange,
  storeScopeLabel = null,
  ...rest
}: ManagerReportHubProps) {
  return (
    <ReportHub
      scope="manager"
      {...rest}
      storeScopeLabel={storeScopeLabel}
      activeTab={activeTab}
      onTabChange={(tab) => {
        if (tab === "pending" || tab === "alerts") {
          onTabChange(tab);
        }
      }}
    />
  );
}

export { pickUrgentReportTab };
export type { ManagerReportTab };
