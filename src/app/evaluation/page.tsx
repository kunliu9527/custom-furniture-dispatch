"use client";

import { RouteGuard } from "@/components/auth/route-guard";
import { DispatcherEvaluationRankingTable } from "@/components/evaluation/dispatcher-evaluation-ranking-table";
import { DispatcherEvaluationTable } from "@/components/evaluation/dispatcher-evaluation-table";
import { DesignerPerformanceTable } from "@/components/evaluation/designer-performance-table";
import { EvaluationSectionToggle } from "@/components/evaluation/evaluation-section-toggle";
import { EvaluationStatsTable } from "@/components/evaluation/evaluation-stats-table";
import { EvaluationViewTabs } from "@/components/evaluation/evaluation-view-tabs";
import { MonthlyOverviewCard } from "@/components/evaluation/monthly-overview-card";
import { MonthlySnapshotPanel } from "@/components/evaluation/monthly-snapshot-panel";
import { AppShell } from "@/components/layout/app-shell";
import { PeriodFilterBar } from "@/components/shared/period-filter-bar";
import { useAuth } from "@/context/auth-context";
import { useOrders } from "@/context/orders-context";
import {
  formatEvaluationMetric,
  getDesignerAmountRows,
  getDesignerEvaluationRows,
  getDispatcherEvaluationRows,
  getDispatcherTabSummary,
  getStoreEvaluationRows,
  getStoreDispatcherAmountRows,
  getWorkflowTabSummary,
  type EvaluationViewMode,
} from "@/lib/evaluation-stats";
import {
  getDefaultEvaluationViewMode,
  getDesignerSubtitleForEvaluation,
  getVisibleEvaluationViewModes,
  resolveEvaluationRowScope,
  resolveEvaluationScopeLabel,
  scopeOrdersForEvaluationView,
} from "@/lib/evaluation-scope";
import {
  canAccessEvaluationPage,
  getSessionBadgeLabel,
} from "@/lib/nav-access";
import {
  getDesignerPerformanceRows,
  getMonthlyReportOverview,
} from "@/lib/designer-performance";
import {
  loadEvaluationUi,
  saveEvaluationUi,
  type EvaluationSubView,
} from "@/lib/evaluation-ui-persistence";
import { aggregateIssueTags } from "@/lib/issue-tag-stats";
import { exportMonthlyDesignerReport } from "@/lib/monthly-report-export";
import {
  DEFAULT_PERIOD,
  filterOrdersByPeriod,
  filterSupplementsByPeriod,
  formatPeriodLabel,
  type PeriodSelection,
} from "@/lib/period-filter";
import { getSessionResetKey } from "@/lib/session-user";
import { useCallback, useEffect, useMemo, useState } from "react";

const viewConfig: Record<
  EvaluationViewMode,
  { title: string; nameColumnLabel: string; emptyMessage: string }
> = {
  dispatcher: {
    title: "派单人归总",
    nameColumnLabel: "派单人",
    emptyMessage: "当前权限范围内暂无派单人订单",
  },
  designer: {
    title: "设计师个人数据",
    nameColumnLabel: "设计师",
    emptyMessage: "当前权限范围内暂无设计师订单",
  },
  store: {
    title: "门店数据",
    nameColumnLabel: "门店名称",
    emptyMessage: "当前权限范围内暂无门店订单",
  },
};

export default function EvaluationPage() {
  const { user, staffRecords } = useAuth();
  const { orders, supplements, isHydrated } = useOrders();
  const allowedModes = useMemo(
    () => getVisibleEvaluationViewModes(user),
    [user],
  );
  const allowedModesKey = allowedModes.join(",");
  const [viewMode, setViewMode] = useState<EvaluationViewMode>("dispatcher");
  const [dispatcherSubView, setDispatcherSubView] =
    useState<EvaluationSubView>("aggregate");
  const [storeSubView, setStoreSubView] = useState<EvaluationSubView>("aggregate");
  const [designerSubView, setDesignerSubView] =
    useState<EvaluationSubView>("aggregate");
  const [period, setPeriod] = useState<PeriodSelection>(DEFAULT_PERIOD);
  const sessionResetKey = getSessionResetKey(user);
  const periodLabel = formatPeriodLabel(period);
  const scopeLabel = resolveEvaluationScopeLabel(user);

  useEffect(() => {
    if (!user?.username) return;
    const saved = loadEvaluationUi(user.username);
    if (saved && allowedModes.includes(saved.viewMode)) {
      setViewMode(saved.viewMode);
      setDispatcherSubView(saved.dispatcherSubView);
      setStoreSubView(saved.storeSubView);
      setDesignerSubView(saved.designerSubView);
      setPeriod(saved.period);
      return;
    }
    const defaults = getDefaultEvaluationViewMode(user);
    setViewMode(
      allowedModes.includes(defaults) ? defaults : (allowedModes[0] ?? "dispatcher"),
    );
    setDispatcherSubView("aggregate");
    setStoreSubView("aggregate");
    setDesignerSubView("aggregate");
    setPeriod(DEFAULT_PERIOD);
  }, [sessionResetKey, allowedModesKey, user]);

  useEffect(() => {
    if (!user?.username) return;
    saveEvaluationUi(user.username, {
      viewMode,
      dispatcherSubView,
      storeSubView,
      designerSubView,
      period,
    });
  }, [
    user?.username,
    viewMode,
    dispatcherSubView,
    storeSubView,
    designerSubView,
    period,
  ]);

  useEffect(() => {
    if (!allowedModes.includes(viewMode)) {
      setViewMode(allowedModes[0] ?? "dispatcher");
    }
  }, [allowedModesKey, viewMode]);

  const scopedOrdersByView = useMemo(
    () => ({
      dispatcher: scopeOrdersForEvaluationView(
        "dispatcher",
        orders,
        user,
        staffRecords,
      ),
      designer: scopeOrdersForEvaluationView(
        "designer",
        orders,
        user,
        staffRecords,
      ),
      store: scopeOrdersForEvaluationView("store", orders, user, staffRecords),
    }),
    [orders, user, staffRecords],
  );

  const periodScopedOrdersByView = useMemo(
    () => ({
      dispatcher: filterOrdersByPeriod(
        scopedOrdersByView.dispatcher,
        period,
      ),
      designer: filterOrdersByPeriod(scopedOrdersByView.designer, period),
      store: filterOrdersByPeriod(scopedOrdersByView.store, period),
    }),
    [scopedOrdersByView, period],
  );

  const periodScopedSupplements = useMemo(
    () => filterSupplementsByPeriod(supplements, period),
    [supplements, period],
  );

  const rowScope = useMemo(
    () =>
      resolveEvaluationRowScope(
        user,
        staffRecords,
        scopedOrdersByView.dispatcher,
      ),
    [user, staffRecords, scopedOrdersByView.dispatcher],
  );

  const dispatcherRows = useMemo(
    () =>
      getDispatcherEvaluationRows(
        periodScopedOrdersByView.dispatcher,
        periodScopedSupplements,
        rowScope.dispatcherNames,
        staffRecords,
      ),
    [
      periodScopedOrdersByView.dispatcher,
      periodScopedSupplements,
      rowScope.dispatcherNames,
      staffRecords,
    ],
  );

  const designerRows = useMemo(
    () =>
      getDesignerEvaluationRows(
        periodScopedOrdersByView.designer,
        periodScopedSupplements,
        rowScope.designerNames,
        (name) => getDesignerSubtitleForEvaluation(name, staffRecords),
        staffRecords,
      ),
    [
      periodScopedOrdersByView.designer,
      periodScopedSupplements,
      rowScope.designerNames,
      staffRecords,
    ],
  );

  const designerAmountRows = useMemo(
    () =>
      getDesignerAmountRows(
        periodScopedOrdersByView.designer,
        periodScopedSupplements,
        rowScope.designerNames,
        (name) => getDesignerSubtitleForEvaluation(name, staffRecords),
        staffRecords,
      ),
    [
      periodScopedOrdersByView.designer,
      periodScopedSupplements,
      rowScope.designerNames,
      staffRecords,
    ],
  );

  const storeRows = useMemo(
    () =>
      getStoreEvaluationRows(
        periodScopedOrdersByView.store,
        periodScopedSupplements,
        rowScope.storeNames,
      ),
    [
      periodScopedOrdersByView.store,
      periodScopedSupplements,
      rowScope.storeNames,
    ],
  );

  const storeDispatcherAmountRows = useMemo(
    () =>
      getStoreDispatcherAmountRows(
        periodScopedOrdersByView.dispatcher,
        periodScopedSupplements,
        rowScope.storeNames,
      ),
    [
      periodScopedOrdersByView.dispatcher,
      periodScopedSupplements,
      rowScope.storeNames,
    ],
  );

  const designerPerformanceRows = useMemo(
    () =>
      getDesignerPerformanceRows(
        scopedOrdersByView.designer,
        supplements,
        rowScope.designerNames,
        (name) => getDesignerSubtitleForEvaluation(name, staffRecords),
        staffRecords,
        period,
      ),
    [
      scopedOrdersByView.designer,
      supplements,
      rowScope.designerNames,
      staffRecords,
      period,
    ],
  );

  const monthlyOverview = useMemo(
    () =>
      getMonthlyReportOverview(
        scopedOrdersByView.designer,
        supplements,
        period,
      ),
    [scopedOrdersByView.designer, supplements, period],
  );

  const issueTagStats = useMemo(
    () => aggregateIssueTags(scopedOrdersByView.designer, period),
    [scopedOrdersByView.designer, period],
  );

  const handleExportMonthlyReport = useCallback(() => {
    exportMonthlyDesignerReport(
      monthlyOverview,
      designerPerformanceRows,
      period,
      scopedOrdersByView.designer,
    );
  }, [monthlyOverview, designerPerformanceRows, period, scopedOrdersByView.designer]);

  useEffect(() => {
    if (viewMode === "dispatcher") {
      setDispatcherSubView("aggregate");
    }
    if (viewMode === "store") {
      setStoreSubView("aggregate");
    }
    if (viewMode === "designer") {
      setDesignerSubView("aggregate");
    }
  }, [viewMode]);

  const storeAggregateSummary = useMemo(
    () => getDispatcherTabSummary(storeDispatcherAmountRows),
    [storeDispatcherAmountRows],
  );

  const designerAggregateSummary = useMemo(
    () => getDispatcherTabSummary(designerAmountRows),
    [designerAmountRows],
  );

  const tabSummaries = useMemo(
    () => ({
      dispatcher: getDispatcherTabSummary(dispatcherRows),
      designer: getWorkflowTabSummary(designerRows),
      store: getWorkflowTabSummary(storeRows),
    }),
    [dispatcherRows, designerRows, storeRows],
  );

  const activeConfig = viewConfig[viewMode];

  const exportData = useMemo(
    () => ({
      dispatcherRows,
      designerAmountRows,
      designerWorkflowRows: designerRows,
      storeDispatcherAmountRows,
      storeWorkflowRows: storeRows,
    }),
    [
      dispatcherRows,
      designerAmountRows,
      designerRows,
      storeDispatcherAmountRows,
      storeRows,
    ],
  );

  return (
    <RouteGuard canAccess={canAccessEvaluationPage(user)}>
      <AppShell title="评价看板" badge={getSessionBadgeLabel(user) ?? "统计"}>
        <div className="space-y-6">
          {!isHydrated ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-400">
              加载订单数据…
            </div>
          ) : (
            <>
              <PeriodFilterBar value={period} onChange={setPeriod} />

              <EvaluationViewTabs
                value={viewMode}
                onChange={setViewMode}
                summaries={tabSummaries}
                allowedModes={allowedModes}
                exportData={exportData}
                periodLabel={periodLabel}
              />

              <section className="space-y-4">
                {viewMode === "store" ? (
                  <>
                    <div className="flex flex-wrap items-start gap-3">
                      <EvaluationSectionToggle
                        title="门店归总"
                        active={storeSubView === "aggregate"}
                        onSelect={() => setStoreSubView("aggregate")}
                        suffix={
                          <>
                            {scopeLabel ? `所属：${scopeLabel} · ` : null}
                            当前{" "}
                            {formatEvaluationMetric(
                              storeAggregateSummary.count,
                              storeAggregateSummary.amount,
                            )}
                          </>
                        }
                      />
                      <EvaluationSectionToggle
                        title="门店数据"
                        active={storeSubView === "workflow"}
                        onSelect={() => setStoreSubView("workflow")}
                        suffix={
                          <>
                            {scopeLabel ? `所属：${scopeLabel} · ` : null}
                            当前{" "}
                            {formatEvaluationMetric(
                              tabSummaries.store.count,
                              tabSummaries.store.amount,
                            )}
                          </>
                        }
                      />
                      <EvaluationSectionToggle
                        title="门店排名（数量/金额）"
                        active={storeSubView === "ranking"}
                        onSelect={() => setStoreSubView("ranking")}
                      />
                    </div>
                    {storeSubView === "workflow" ? (
                      <EvaluationStatsTable
                        nameColumnLabel={activeConfig.nameColumnLabel}
                        rows={storeRows}
                        emptyMessage={activeConfig.emptyMessage}
                      />
                    ) : storeSubView === "ranking" ? (
                      <DispatcherEvaluationRankingTable
                        nameColumnLabel="门店名称"
                        rows={storeDispatcherAmountRows}
                        emptyMessage="当前权限范围内暂无门店排名数据"
                        footnote="按派单人名册所属门店归集 · 单元格为 数量 / 金额"
                      />
                    ) : (
                      <DispatcherEvaluationTable
                        nameColumnLabel="门店名称"
                        rows={storeDispatcherAmountRows}
                        emptyMessage="当前权限范围内暂无派单金额数据"
                        footnote="按派单人名册所属门店归集 · 单元格为 数量 / 金额"
                      />
                    )}
                  </>
                ) : viewMode === "designer" ? (
                  <>
                    <div className="flex flex-wrap items-start gap-3">
                      <EvaluationSectionToggle
                        title="设计师归总"
                        active={designerSubView === "aggregate"}
                        onSelect={() => setDesignerSubView("aggregate")}
                        suffix={
                          <>
                            {scopeLabel ? `所属：${scopeLabel} · ` : null}
                            当前{" "}
                            {formatEvaluationMetric(
                              designerAggregateSummary.count,
                              designerAggregateSummary.amount,
                            )}
                          </>
                        }
                      />
                      <EvaluationSectionToggle
                        title="设计师个人数据"
                        active={designerSubView === "workflow"}
                        onSelect={() => setDesignerSubView("workflow")}
                        suffix={
                          <>
                            {scopeLabel ? `所属：${scopeLabel} · ` : null}
                            当前{" "}
                            {formatEvaluationMetric(
                              tabSummaries.designer.count,
                              tabSummaries.designer.amount,
                            )}
                          </>
                        }
                      />
                      <EvaluationSectionToggle
                        title="设计师排名（数量/金额）"
                        active={designerSubView === "ranking"}
                        onSelect={() => setDesignerSubView("ranking")}
                      />
                      <EvaluationSectionToggle
                        title="设计师绩效月报"
                        active={designerSubView === "performance"}
                        onSelect={() => setDesignerSubView("performance")}
                        suffix="贡献分 · 周期 · 超时"
                      />
                    </div>
                    {designerSubView === "performance" ? (
                      <div className="space-y-4">
                        <MonthlySnapshotPanel
                          orders={scopedOrdersByView.designer}
                          supplements={supplements}
                          period={period}
                          designerNames={rowScope.designerNames}
                          staffRecords={staffRecords}
                          scopeLabel={scopeLabel ?? undefined}
                          savedBy={user?.displayName}
                        />
                        <MonthlyOverviewCard
                          overview={monthlyOverview}
                          issueTagStats={issueTagStats}
                        />
                        <DesignerPerformanceTable
                          rows={designerPerformanceRows}
                          emptyMessage="当前周期与权限范围内暂无设计师数据"
                          periodLabel={periodLabel}
                          onExportReport={handleExportMonthlyReport}
                        />
                      </div>
                    ) : designerSubView === "workflow" ? (
                      <EvaluationStatsTable
                        nameColumnLabel={activeConfig.nameColumnLabel}
                        rows={designerRows}
                        emptyMessage={activeConfig.emptyMessage}
                      />
                    ) : designerSubView === "ranking" ? (
                      <DispatcherEvaluationRankingTable
                        nameColumnLabel="设计师"
                        rows={designerAmountRows}
                        emptyMessage="当前权限范围内暂无设计师排名数据"
                        footnote="按订单 designer 字段归集 · 单元格为 数量 / 金额"
                        designerExtendedMetrics
                      />
                    ) : (
                      <DispatcherEvaluationTable
                        nameColumnLabel="设计师"
                        rows={designerAmountRows}
                        emptyMessage="当前权限范围内暂无设计师归总数据"
                        footnote="按订单 designer 字段归集 · 单元格为 数量 / 金额"
                        designerExtendedMetrics
                      />
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap items-start gap-3">
                      <EvaluationSectionToggle
                        title="派单人归总"
                        active={dispatcherSubView === "aggregate"}
                        onSelect={() => setDispatcherSubView("aggregate")}
                        suffix={
                          <>
                            {scopeLabel ? `所属：${scopeLabel} · ` : null}
                            当前{" "}
                            {formatEvaluationMetric(
                              tabSummaries.dispatcher.count,
                              tabSummaries.dispatcher.amount,
                            )}
                          </>
                        }
                      />
                      <EvaluationSectionToggle
                        title="派单人排名（数量/金额）"
                        active={dispatcherSubView === "ranking"}
                        onSelect={() => setDispatcherSubView("ranking")}
                      />
                    </div>
                    {dispatcherSubView === "ranking" ? (
                      <DispatcherEvaluationRankingTable
                        nameColumnLabel={activeConfig.nameColumnLabel}
                        rows={dispatcherRows}
                        emptyMessage="当前权限范围内暂无派单人排名数据"
                      />
                    ) : (
                      <DispatcherEvaluationTable
                        nameColumnLabel={activeConfig.nameColumnLabel}
                        rows={dispatcherRows}
                        emptyMessage={activeConfig.emptyMessage}
                      />
                    )}
                  </>
                )}
              </section>
            </>
          )}
        </div>
      </AppShell>
    </RouteGuard>
  );
}
