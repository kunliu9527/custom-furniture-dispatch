"use client";

import { AppShell } from "@/components/layout/app-shell";
import { RouteGuard } from "@/components/auth/route-guard";
import { ManagerLookupPanel } from "@/components/manager/manager-lookup-panel";
import { AnomalyTodosPanel } from "@/components/manager/anomaly-todos-panel";
import { WeeklyDigestSummaryCard } from "@/components/manager/weekly-digest-summary-card";
import { ManagerGanttPanel } from "@/components/manager/manager-gantt-panel";
import { ManagerSidebar, ManagerMobileNav } from "@/components/manager/manager-sidebar";
import { WorkbenchPeriodSearchBar } from "@/components/shared/workbench-period-search-bar";
import { PeriodFilterBar } from "@/components/shared/period-filter-bar";
import { ModuleWorkbenchLayout } from "@/components/workbench/module-workbench-layout";
import { EVAL_PAGE_MAIN_CLASS } from "@/components/evaluation/sticky-section";
import { useAuth } from "@/context/auth-context";
import { useOrders } from "@/context/orders-context";
import { resolveEvaluationScopeLabel, resolveReportPersonScope } from "@/lib/evaluation-scope";
import {
  isPersonalDispatcherLookup,
  isPersonalManagerLookupOnly,
  scopeOrdersForUser,
} from "@/lib/permissions";
import { canAccessManagerPage } from "@/lib/nav-access";
import { getManagerRoleDefaults } from "@/lib/role-routes";
import { filterSupplementsByOrders } from "@/lib/supplement-filter";
import {
  loadManagerUi,
  saveManagerUi,
  type ManagerMainSection,
  type ManagerReportTab,
} from "@/lib/manager-ui-persistence";
import { SNAPSHOT_REPORT_HINT } from "@/lib/report-period-sync";
import { parseManagerFocus, parseManagerOrderStatus } from "@/lib/manager-deep-link";
import { resolvePendingConfirmNavigate, managerLookupHref } from "@/lib/order-action-link";
import { EMPTY_RESULT_DRILL } from "@/lib/result-drill";
import {
  DEFAULT_PERIOD,
  type PeriodSelection,
} from "@/lib/period-filter";
import {
  loadWorkbenchPeriod,
  saveWorkbenchPeriod,
} from "@/lib/workbench-period-persistence";
import { resolveOrderDisplayName } from "@/lib/order-remark";
import { getSessionResetKey } from "@/lib/session-user";
import { useOrderLookupWorkbench } from "@/lib/use-order-lookup-workbench";
import type { DesignerName, Order, OrderStatus } from "@/lib/types";
import type { ViewMode } from "@/lib/manager-stats";
import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { PendingConfirmKind } from "@/lib/pending-confirm";

export default function ManagerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
          加载…
        </div>
      }
    >
      <ManagerPageContent />
    </Suspense>
  );
}

function ManagerPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, staffRecords, designerHomeStoreIndex } = useAuth();
  const {
    orders,
    supplements,
    isHydrated,
    reassignOrder,
    setAfterSalesAmount,
    setOrderIssueTags,
  } = useOrders();
  const lookupOnly = isPersonalManagerLookupOnly(user);
  const personalWeeklyOnly = lookupOnly;
  const [mainSection, setMainSection] =
    useState<ManagerMainSection>("weekly");
  const [reportTab, setReportTab] = useState<ManagerReportTab>("pending");
  const [weeklyPeriod, setWeeklyPeriod] = useState<PeriodSelection>({
    preset: "thisWeek",
  });
  const [period, setPeriod] = useState<PeriodSelection>(DEFAULT_PERIOD);
  const [focusOrderId, setFocusOrderId] = useState<string | null>(null);
  const [uiHydrated, setUiHydrated] = useState(false);

  const sessionResetKey = getSessionResetKey(user);

  const scopedOrders = useMemo(
    () => scopeOrdersForUser(orders, user),
    [orders, user],
  );

  const managerScopeLabel = resolveEvaluationScopeLabel(user);

  const reportPersonScope = useMemo(
    () => resolveReportPersonScope(user, scopedOrders, staffRecords),
    [user, scopedOrders, staffRecords],
  );

  const scopedReportSupplements = useMemo(
    () => filterSupplementsByOrders(supplements, scopedOrders),
    [supplements, scopedOrders],
  );

  const lookup = useOrderLookupWorkbench({
    user,
    scopedOrders,
    orders,
    supplements,
    staffRecords,
    designerHomeStoreIndex,
    period,
    onPeriodChange: setPeriod,
    reassignOrder,
    setAfterSalesAmount,
    setOrderIssueTags,
    sessionResetKey,
  });

  useEffect(() => {
    if (!user) return;
    const savedPeriod = loadWorkbenchPeriod(user.username);
    if (savedPeriod) setPeriod(savedPeriod);
    const savedUi = loadManagerUi(user.username);
    if (lookupOnly) {
      const defaults = getManagerRoleDefaults(user, staffRecords);
      lookup.setStoreFilter(defaults.storeFilter);
      lookup.setDispatcherFilter(defaults.dispatcherFilter);
      lookup.setDesignerFilter(defaults.designerFilter);
      if (user.role === "designer") {
        lookup.setViewMode("designer");
      } else if (isPersonalDispatcherLookup(user)) {
        lookup.setViewMode("dispatcher");
      }
      if (savedUi?.mainSection === "lookup") {
        setMainSection("lookup");
      } else if (savedUi?.mainSection === "reports") {
        setMainSection("weekly");
      } else {
        setMainSection(savedUi?.mainSection ?? "weekly");
      }
      if (savedUi?.weeklyPeriod === "lastWeek") {
        setWeeklyPeriod({ preset: "lastWeek" });
      }
    } else if (savedUi) {
      setMainSection(savedUi.mainSection);
      setReportTab(savedUi.reportTab);
      lookup.setViewMode(savedUi.viewMode);
      if (savedUi.weeklyPeriod === "lastWeek") {
        setWeeklyPeriod({ preset: "lastWeek" });
      }
    }
    setUiHydrated(true);
  }, [user, lookupOnly, staffRecords]);

  useEffect(() => {
    if (!user || !uiHydrated) return;
    saveWorkbenchPeriod(user.username, period);
  }, [user, period, uiHydrated]);

  useEffect(() => {
    if (!user || !uiHydrated) return;
    saveManagerUi(user.username, {
      mainSection,
      reportTab,
      viewMode: lookup.viewMode,
      weeklyPeriod: weeklyPeriod.preset === "lastWeek" ? "lastWeek" : "thisWeek",
    });
  }, [user, mainSection, reportTab, lookup.viewMode, weeklyPeriod, uiHydrated]);

  useEffect(() => {
    if (mainSection !== "reports") {
      setFocusOrderId(null);
    }
  }, [mainSection]);

  const handleAlertDesignerSelect = useCallback(
    (designer: string) => {
      setMainSection("lookup");
      lookup.setViewMode("designer");
      lookup.setDesignerFilter(designer as DesignerName);
      lookup.setSearchQuery("");
      lookup.setStatusFilter("全部");
      lookup.setResultDrill(EMPTY_RESULT_DRILL);
    },
    [lookup],
  );

  const handleOpenGanttOrder = useCallback(
    (order: Order) => {
      // 仅 query 变化的同路由跳转：router.push 在生产模式会静默失效，
      // 按 Next.js 指引使用原生 history API（自动同步 useSearchParams → 深链定位）
      window.history.pushState(null, "", managerLookupHref(order.id));
    },
    [],
  );

  /** 侧栏/移动端切换区块：把当前区块写进 URL（replaceState），
   *  保证「返回」能回到上一区块（如强定位 → 返回甘特图），避免历史栈不一致 */
  const handleSectionChange = useCallback((section: ManagerMainSection) => {
    const url =
      section === "weekly" ? "/manager" : `/manager?section=${section}`;
    window.history.replaceState(null, "", url);
    setMainSection(section);
  }, []);

  const applyManagerLookupForOrder = useCallback(
    (
      order: Order,
      options?: { status?: OrderStatus | "全部"; viewMode?: ViewMode },
    ) => {
      setMainSection("lookup");
      lookup.applyLookupForOrder(order, options);
    },
    [lookup],
  );

  const handleOpenPendingOrder = useCallback(
    ({
      kind,
      order,
    }: {
      orderId: string;
      kind: PendingConfirmKind;
      order: Order;
    }) => {
      const target = resolvePendingConfirmNavigate(user, order, kind);
      if (!target) return;
      if (
        target.href.startsWith("/admin") ||
        target.href.startsWith("/designer")
      ) {
        router.push(target.href);
        return;
      }
      if (kind === "undispatched") {
        applyManagerLookupForOrder(order, { status: "未派单" });
        return;
      }
      if (kind === "pending-refund") {
        applyManagerLookupForOrder(order, { status: "待退单" });
        return;
      }
      if (kind === "designer-accept") {
        applyManagerLookupForOrder(order, { status: "待量尺" });
      }
    },
    [user, router, applyManagerLookupForOrder],
  );

  useEffect(() => {
    if (!isHydrated || !uiHydrated) return;

    const focus = parseManagerFocus(searchParams.get("focus"));
    const section = searchParams.get("section");
    const orderId = searchParams.get("orderId");
    const status = parseManagerOrderStatus(searchParams.get("status"));
    const designer = searchParams.get("designer");
    const view = searchParams.get("view");

    if (!focus && !section && !orderId && !designer) return;

    if (focus) {
      switch (focus) {
        case "flow-timeout":
          setMainSection(lookupOnly ? "lookup" : "reports");
          break;
        case "sign-timeout":
          setMainSection("lookup");
          lookup.setViewMode("status");
          lookup.setStatusFilter("待签约");
          break;
        case "pending-acceptance":
          setMainSection(lookupOnly ? "lookup" : "reports");
          break;
        case "pending-refund":
          setMainSection("lookup");
          lookup.setViewMode("status");
          lookup.setStatusFilter("待退单");
          break;
      }
    }

    if (section === "lookup") {
      setMainSection("lookup");
    } else if (section === "weekly") {
      setMainSection("weekly");
    } else if (section === "reports") {
      // 本人账号无工单待办侧栏：深链落到订单查询，避免空白/误跳简报
      setMainSection(lookupOnly ? "lookup" : "reports");
    } else if (section === "gantt") {
      setMainSection("gantt");
    }

    if (view === "designer" && designer) {
      lookup.setViewMode("designer");
      lookup.setDesignerFilter(designer as DesignerName);
    }
    if (status) {
      lookup.setViewMode("status");
      lookup.setStatusFilter(status);
    }
    if (orderId) {
      const order = scopedOrders.find((o) => o.id === orderId);
      if (order && section === "reports" && !lookupOnly) {
        setMainSection("reports");
        setFocusOrderId(orderId);
      } else if (order) {
        setMainSection("lookup");
        lookup.setSearchQuery(resolveOrderDisplayName(order));
        setFocusOrderId(null);
      }
    } else {
      setFocusOrderId(null);
    }
  }, [isHydrated, uiHydrated, searchParams, scopedOrders, lookupOnly, lookup]);

  return (
    <RouteGuard canAccess={canAccessManagerPage(user)}>
      <AppShell
        title="项目进程管理"
        board="/manager"
        mainClassName={EVAL_PAGE_MAIN_CLASS}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {!isHydrated ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-400">
              加载数据…
            </div>
          ) : (
            <ModuleWorkbenchLayout
              mobileTabs={
                <ManagerMobileNav
                  mainSection={mainSection}
                  onMainSectionChange={handleSectionChange}
                  personalWeeklyOnly={personalWeeklyOnly}
                />
              }
              periodBar={
                mainSection === "lookup" ? (
                  <WorkbenchPeriodSearchBar
                    period={period}
                    onPeriodChange={lookup.handlePeriodChange}
                    query={lookup.searchQuery}
                    onQueryChange={lookup.setSearchQuery}
                    hint={lookup.lookupSearchHint}
                    placeholder="客户姓名、电话、地址、设计师、派单人、门店…"
                    resultCount={lookup.lookupSearchCount}
                  />
                ) : mainSection === "weekly" ? (
                  <PeriodFilterBar
                    value={weeklyPeriod}
                    onChange={setWeeklyPeriod}
                    embedded
                    variant="weeklyBriefOnly"
                    hint={
                      personalWeeklyOnly
                        ? `${user?.displayName ?? ""} · 本周简报`
                        : managerScopeLabel
                          ? `${managerScopeLabel} · 本周简报`
                          : "本周简报"
                    }
                  />
                ) : mainSection === "reports" ? (
                  <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5">
                    <p className="text-xs text-slate-600">
                      工单待办
                      {managerScopeLabel ? ` · ${managerScopeLabel}` : ""}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      异常订单按触发时间排序，最新在最上 · {SNAPSHOT_REPORT_HINT}
                    </p>
                  </div>
                ) : mainSection === "gantt" ? (
                  <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5">
                    <p className="text-xs text-slate-600">
                      流程甘特图
                      {managerScopeLabel ? ` · ${managerScopeLabel}` : ""}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      按时间轴查看各订单阶段进度 · 点击行查看详情
                    </p>
                  </div>
                ) : null
              }
              sidebar={
                <ManagerSidebar
                  mainSection={mainSection}
                  onMainSectionChange={handleSectionChange}
                  personalWeeklyOnly={personalWeeklyOnly}
                />
              }
            >
              {mainSection === "weekly" ? (
                <WeeklyDigestSummaryCard
                  orders={scopedOrders}
                  supplements={scopedReportSupplements}
                  period={weeklyPeriod}
                  storeScopeLabel={personalWeeklyOnly ? null : managerScopeLabel}
                  personScope={reportPersonScope}
                  personalMode={personalWeeklyOnly}
                  personalTitle={
                    personalWeeklyOnly
                      ? `${user?.displayName ?? "本人"} · 本周简报`
                      : null
                  }
                />
              ) : mainSection === "reports" ? (
                <AnomalyTodosPanel
                  orders={scopedOrders}
                  focusOrderId={focusOrderId}
                  onSelectDesigner={handleAlertDesignerSelect}
                  onOpenPendingOrder={handleOpenPendingOrder}
                />
              ) : mainSection === "gantt" ? (
                <ManagerGanttPanel
                  orders={scopedOrders}
                  onOpenOrder={handleOpenGanttOrder}
                />
              ) : (
                <ManagerLookupPanel {...lookup.lookupPanelProps} />
              )}
            </ModuleWorkbenchLayout>
          )}
        </div>
      </AppShell>
    </RouteGuard>
  );
}
