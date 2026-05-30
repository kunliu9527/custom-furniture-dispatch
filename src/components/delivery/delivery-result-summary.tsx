"use client";

import {
  countDeliveryByStatus,
  formatDeliveryOrderAmountTotal,
  type DeliveryViewMode,
} from "@/lib/delivery-stats";
import {
  summarizeCustomerRatings,
  summarizeScopedStoreDeliveryRatings,
  type AcceptanceLookupFilter,
  type StoreDeliveryPersonScope,
} from "@/lib/customer-ratings";
import { formatOrderAnomalySummary } from "@/lib/order-anomaly";
import type { Order } from "@/lib/types";

interface DeliveryResultSummaryProps {
  orders: Order[];
  viewMode: DeliveryViewMode;
  acceptanceFilter?: AcceptanceLookupFilter;
  storeScope?: StoreDeliveryPersonScope;
}

export function DeliveryResultSummary({
  orders,
  viewMode,
  acceptanceFilter = "全部",
  storeScope,
}: DeliveryResultSummaryProps) {
  const statusCounts = countDeliveryByStatus(orders);
  const useStoreScope = viewMode === "store" && storeScope != null;
  const scopedRating = useStoreScope
    ? summarizeScopedStoreDeliveryRatings(orders, storeScope)
    : null;
  const ratingSummary = scopedRating ?? summarizeCustomerRatings(orders);

  const anomalySummary = formatOrderAnomalySummary(orders, {
    includeOperationalHints: false,
  });

  const roleLabels = scopedRating?.roleMetricLabels ?? {
    dispatcher: "派单人均分",
    designer: "设计师均分",
    installer: "安装师均分",
  };

  const showRatingMetrics =
    viewMode === "store" || ratingSummary.ratedCount > 0;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">查找结果统计</h3>
          {viewMode === "acceptance" ? (
            <p className="mt-1 text-xs text-slate-500">
              当前筛选：{acceptanceFilter}
            </p>
          ) : scopedRating ? (
            <p className="mt-1 text-xs text-slate-500">{scopedRating.scopeLabel}</p>
          ) : null}
          {anomalySummary ? (
            <p className="mt-1 text-xs font-medium text-rose-600">{anomalySummary}</p>
          ) : null}
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold text-slate-900">共 {orders.length} 笔交付单</p>
          <p className="mt-1 text-xs text-slate-600">
            下单金额合计{" "}
            <span className="font-medium text-teal-800">
              {formatDeliveryOrderAmountTotal(orders)}
            </span>
          </p>
          {viewMode !== "acceptance" ? (
            <p className="mt-1 text-xs text-slate-600">
              已下单 {statusCounts["已下单"]} · 已安装 {statusCounts["已安装"]} · 已验收{" "}
              {statusCounts["已验收"]}
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-600">
              待扫码 {ratingSummary.pendingScanCount} · 已评价 {ratingSummary.ratedCount} ·
              无电子 {ratingSummary.skippedCount}
            </p>
          )}
        </div>
      </div>

      {showRatingMetrics ? (
        <div className="mt-4 grid gap-2 border-t border-slate-200/80 pt-4 sm:grid-cols-2 lg:grid-cols-5">
          <MiniStat
            label="综合均分"
            value={
              ratingSummary.ratedCount > 0
                ? `${ratingSummary.avgOverall.toFixed(1)} 星`
                : "—"
            }
          />
          <MiniStat
            label={roleLabels.dispatcher}
            value={
              ratingSummary.ratedCount > 0
                ? `${ratingSummary.avgByRole.dispatcher.toFixed(1)} 星`
                : "—"
            }
          />
          <MiniStat
            label={roleLabels.designer}
            value={
              ratingSummary.ratedCount > 0
                ? `${ratingSummary.avgByRole.designer.toFixed(1)} 星`
                : "—"
            }
          />
          <MiniStat
            label={roleLabels.installer}
            value={
              ratingSummary.ratedCount > 0
                ? `${ratingSummary.avgByRole.installer.toFixed(1)} 星`
                : "—"
            }
          />
          <MiniStat
            label="电子验收率"
            value={
              ratingSummary.ratedCount + ratingSummary.skippedCount > 0
                ? `${Math.round(ratingSummary.electronicRate * 100)}%`
                : "—"
            }
          />
        </div>
      ) : null}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200/80">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
