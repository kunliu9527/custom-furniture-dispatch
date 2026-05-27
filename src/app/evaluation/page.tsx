"use client";

import { RouteGuard } from "@/components/auth/route-guard";
import { DispatcherEvaluationRankingTable } from "@/components/evaluation/dispatcher-evaluation-ranking-table";
import { DispatcherEvaluationTable } from "@/components/evaluation/dispatcher-evaluation-table";
import { EvaluationSectionToggle } from "@/components/evaluation/evaluation-section-toggle";
import { EvaluationStatsTable } from "@/components/evaluation/evaluation-stats-table";
import { EvaluationViewTabs } from "@/components/evaluation/evaluation-view-tabs";
import { AppShell } from "@/components/layout/app-shell";
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
import { getSessionScopeKey } from "@/lib/session-user";
import { useEffect, useMemo, useState } from "react";

type EvaluationSubView = "aggregate" | "ranking" | "workflow";

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
  const [viewMode, setViewMode] = useState<EvaluationViewMode>("dispatcher");
  const [dispatcherSubView, setDispatcherSubView] =
    useState<EvaluationSubView>("aggregate");
  const [storeSubView, setStoreSubView] = useState<EvaluationSubView>("aggregate");
  const [designerSubView, setDesignerSubView] =
    useState<EvaluationSubView>("aggregate");
  const sessionScopeKey = getSessionScopeKey(user);
  const scopeLabel = resolveEvaluationScopeLabel(user);

  useEffect(() => {
    const defaults = getDefaultEvaluationViewMode(user);
    setViewMode(
      allowedModes.includes(defaults) ? defaults : (allowedModes[0] ?? "dispatcher"),
    );
  }, [sessionScopeKey, allowedModes, user]);

  useEffect(() => {
    if (!allowedModes.includes(viewMode)) {
      setViewMode(allowedModes[0] ?? "dispatcher");
    }
  }, [allowedModes, viewMode]);

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
        scopedOrdersByView.dispatcher,
        supplements,
        rowScope.dispatcherNames,
      ),
    [scopedOrdersByView.dispatcher, supplements, rowScope.dispatcherNames],
  );

  const designerRows = useMemo(
    () =>
      getDesignerEvaluationRows(
        scopedOrdersByView.designer,
        supplements,
        rowScope.designerNames,
        (name) => getDesignerSubtitleForEvaluation(name, staffRecords),
      ),
    [
      scopedOrdersByView.designer,
      supplements,
      rowScope.designerNames,
      staffRecords,
    ],
  );

  const designerAmountRows = useMemo(
    () =>
      getDesignerAmountRows(
        scopedOrdersByView.designer,
        supplements,
        rowScope.designerNames,
        (name) => getDesignerSubtitleForEvaluation(name, staffRecords),
      ),
    [
      scopedOrdersByView.designer,
      supplements,
      rowScope.designerNames,
      staffRecords,
    ],
  );

  const storeRows = useMemo(
    () =>
      getStoreEvaluationRows(
        scopedOrdersByView.store,
        supplements,
        rowScope.storeNames,
      ),
    [scopedOrdersByView.store, supplements, rowScope.storeNames],
  );

  const storeDispatcherAmountRows = useMemo(
    () =>
      getStoreDispatcherAmountRows(
        scopedOrdersByView.dispatcher,
        supplements,
        rowScope.storeNames,
      ),
    [scopedOrdersByView.dispatcher, supplements, rowScope.storeNames],
  );

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
  }, [viewMode, sessionScopeKey]);

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
              <EvaluationViewTabs
                value={viewMode}
                onChange={setViewMode}
                summaries={tabSummaries}
                allowedModes={allowedModes}
                exportData={exportData}
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
                    </div>
                    {designerSubView === "workflow" ? (
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
