"use client";

import { DigestHistoryPanel } from "@/components/manager/digest-history-panel";
import { useAuth } from "@/context/auth-context";
import { resolveReportPersonScope } from "@/lib/evaluation-scope";
import { MonthlyDigestPanel } from "@/components/manager/monthly-digest-panel";
import { WeeklyDigestPanel } from "@/components/manager/weekly-digest-panel";
import type { PeriodSelection } from "@/lib/period-filter";
import {
  getReportTabs,
  type ReportScope,
  type ReportTab,
} from "@/lib/report-hub-config";
import {
  handleReportTabChange,
} from "@/lib/report-period-sync";
import type { Order, SupplementOrder } from "@/lib/types";
import { useMemo } from "react";

interface ReportHubProps {
  scope: ReportScope;
  orders: Order[];
  supplements: SupplementOrder[];
  period: PeriodSelection;
  activeTab: ReportTab;
  onTabChange: (tab: ReportTab) => void;
  onPeriodChange?: (period: PeriodSelection) => void;
  /** 经营管理 · 非总部登录时所属门店标签 */
  storeScopeLabel?: string | null;
  onOpenOrderLookup?: () => void;
}

export function ReportHub({
  scope,
  orders,
  supplements,
  period,
  activeTab,
  onTabChange,
  onPeriodChange,
  storeScopeLabel = null,
  onOpenOrderLookup,
}: ReportHubProps) {
  const { user, staffRecords } = useAuth();
  const tabs = getReportTabs({ storeScopeLabel });

  const personScope = useMemo(
    () => resolveReportPersonScope(user, orders, staffRecords),
    [user, orders, staffRecords],
  );

  return (
    <section className="vi-panel">
      <div className="border-b border-[var(--vi-border-strong)] bg-slate-50/50 px-4 pt-3 pb-3 sm:px-5">
        <div className="vi-segmented" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() =>
                handleReportTabChange(
                  tab.id,
                  period,
                  onTabChange,
                  onPeriodChange,
                )
              }
              className={`vi-segmented-item ${
                activeTab === tab.id ? "vi-segmented-item-active" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {activeTab === "weekly" ? (
          <WeeklyDigestPanel
            orders={orders}
            supplements={supplements}
            period={period}
            embedded
            reportScope={scope}
            storeScopeLabel={storeScopeLabel}
            personScope={personScope}
          />
        ) : null}
        {activeTab === "monthly" ? (
          <MonthlyDigestPanel
            orders={orders}
            supplements={supplements}
            period={period}
            embedded
            reportScope={scope}
            storeScopeLabel={storeScopeLabel}
            personScope={personScope}
          />
        ) : null}
        {activeTab === "allSummary" ? (
          <MonthlyDigestPanel
            orders={orders}
            supplements={supplements}
            period={{ preset: "all" }}
            embedded
            reportScope={scope}
            storeScopeLabel={storeScopeLabel}
            personScope={personScope}
            digestVariant="allSummary"
            onOpenOrderLookup={onOpenOrderLookup}
          />
        ) : null}
        {activeTab === "history" ? (
          <DigestHistoryPanel
            orders={orders}
            supplements={supplements}
            embedded
            reportScope={scope}
            storeScopeLabel={storeScopeLabel}
            personScope={personScope}
          />
        ) : null}
      </div>
    </section>
  );
}
