"use client";

import { DigestHistoryPanel } from "@/components/manager/digest-history-panel";
import { FollowUpPanel } from "@/components/manager/follow-up-panel";
import { useAuth } from "@/context/auth-context";
import { resolveReportPersonScope } from "@/lib/evaluation-scope";
import { countUnackedFollowUpOrders } from "@/lib/follow-up-ack";
import { MonthlyDigestPanel } from "@/components/manager/monthly-digest-panel";
import {
  PendingConfirmPanel,
  type OpenPendingOrderPayload,
} from "@/components/manager/pending-confirm-panel";
import { WeeklyDigestPanel } from "@/components/manager/weekly-digest-panel";
import { buildPendingConfirmSnapshot } from "@/lib/pending-confirm";
import type { PeriodSelection } from "@/lib/period-filter";
import {
  getReportTabs,
  type ReportScope,
  type ReportTab,
} from "@/lib/report-hub-config";
import {
  handleReportTabChange,
  SNAPSHOT_REPORT_HINT,
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
  onSelectDesigner?: (designer: string) => void;
  onOpenPendingOrder?: (payload: OpenPendingOrderPayload) => void;
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
  onSelectDesigner,
  onOpenPendingOrder,
  storeScopeLabel = null,
  onOpenOrderLookup,
}: ReportHubProps) {
  const { user, staffRecords } = useAuth();
  const tabs = getReportTabs(scope, { storeScopeLabel });

  const personScope = useMemo(
    () => resolveReportPersonScope(user, orders, staffRecords),
    [user, orders, staffRecords],
  );

  const pendingSnapshot = useMemo(
    () => buildPendingConfirmSnapshot(orders),
    [orders],
  );
  const followUpCount = useMemo(
    () => countUnackedFollowUpOrders(orders, user?.username),
    [orders, user?.username],
  );

  const tabBadges: Partial<Record<ReportTab, number>> = {
    pending: pendingSnapshot.totalCount,
    alerts: followUpCount,
  };

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
              {tabBadges[tab.id] != null && tabBadges[tab.id]! > 0 ? (
                <span className="ml-1 text-xs font-medium text-rose-600">
                  ({tabBadges[tab.id]})
                </span>
              ) : null}
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
        {activeTab === "pending" ? (
          <>
            <p className="mb-3 text-xs text-slate-500">{SNAPSHOT_REPORT_HINT}</p>
            <PendingConfirmPanel
              orders={orders}
              onSelectDesigner={onSelectDesigner}
              onOpenPendingOrder={onOpenPendingOrder}
              embedded
            />
          </>
        ) : null}
        {activeTab === "alerts" ? (
          <div id={scope === "global" ? "global-flow-alerts" : "manager-flow-alerts"}>
            <p className="mb-3 text-xs text-slate-500">{SNAPSHOT_REPORT_HINT}</p>
            <FollowUpPanel orders={orders} embedded />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function pickUrgentReportTab(
  orders: Order[],
  username?: string,
): ReportTab | null {
  const followUpCount = countUnackedFollowUpOrders(orders, username);
  const pendingCount = buildPendingConfirmSnapshot(orders).totalCount;
  if (followUpCount > 0) return "alerts";
  if (pendingCount > 0) return "pending";
  return null;
}
