"use client";

import { AppShell } from "@/components/layout/app-shell";
import { RouteGuard } from "@/components/auth/route-guard";
import { ManagerLookupPanel } from "@/components/manager/manager-lookup-panel";
import { AnomalyTodosPanel } from "@/components/manager/anomaly-todos-panel";
import { WeeklyDigestPanel } from "@/components/manager/weekly-digest-panel";
import { ManagerFlowProgressPanel } from "@/components/manager/manager-flow-progress-panel";
import { OrderCardDialog } from "@/components/manager/order-card-dialog";
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
} from "@/lib/manager-ui-persistence";
import { SNAPSHOT_REPORT_HINT } from "@/lib/report-period-sync";
import { parseManagerFocus, parseManagerOrderStatus } from "@/lib/manager-deep-link";
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
import { useOnSessionScopeChange } from "@/lib/use-on-session-scope-change";
import { useOrderLookupWorkbench } from "@/lib/use-order-lookup-workbench";
import type { DesignerName, Order } from "@/lib/types";
import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

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
  const [weeklyPeriod, setWeeklyPeriod] = useState<PeriodSelection>({
    preset: "thisWeek",
  });
  const [period, setPeriod] = useState<PeriodSelection>(DEFAULT_PERIOD);
  const [focusOrderId, setFocusOrderId] = useState<string | null>(null);
  const [uiHydrated, setUiHydrated] = useState(false);
  /** 最近一次已应用的深链 URL 查询串(幂等守卫用,见下方 effect) */
  const appliedSearchRef = useRef<string | null>(null);

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

  /**
   * 恢复本账号的 UI 偏好（区块/周期）与角色默认筛选。
   * 触发键只取「会话范围 + 是否查询台专版」：
   * 云端轮询会让 staffRecords 引用抖动，若直接依赖它，经理每 ~8s 就被重置回默认筛选/区块。
   */
  const hydrateManagerUi = useCallback(() => {
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
      lookup.setViewMode(savedUi.viewMode);
      if (savedUi.weeklyPeriod === "lastWeek") {
        setWeeklyPeriod({ preset: "lastWeek" });
      }
    }
    setUiHydrated(true);
  }, [user, lookupOnly, staffRecords, lookup]);

  useOnSessionScopeChange(
    `${sessionResetKey}|${lookupOnly ? "lookup" : "full"}`,
    hydrateManagerUi,
  );

  useEffect(() => {
    if (!user || !uiHydrated) return;
    saveWorkbenchPeriod(user.username, period);
  }, [user, period, uiHydrated]);

  useEffect(() => {
    if (!user || !uiHydrated) return;
    saveManagerUi(user.username, {
      mainSection,
      viewMode: lookup.viewMode,
      weeklyPeriod: weeklyPeriod.preset === "lastWeek" ? "lastWeek" : "thisWeek",
    });
  }, [user, mainSection, lookup.viewMode, weeklyPeriod, uiHydrated]);

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

  /** 打开订单卡浮层(manager 内所有「点订单→详情/操作」的统一落点) */
  const [cardOrderId, setCardOrderId] = useState<string | null>(null);
  const openOrderCard = useCallback((order: Order) => {
    setCardOrderId(order.id);
  }, []);

  /** 侧栏/移动端切换区块：把当前区块写进 URL（replaceState），
   *  保证「返回」能回到上一区块（如强定位 → 返回流程推进图），避免历史栈不一致
   *  注:区块 id「gantt」为旧名遗留,界面已更名「流程推进图」,深链/持久化沿用旧键 */
  const handleSectionChange = useCallback((section: ManagerMainSection) => {
    const url =
      section === "weekly" ? "/manager" : `/manager?section=${section}`;
    window.history.replaceState(null, "", url);
    setMainSection(section);
  }, []);

  /** 工单待办里的订单类动作：直接在 manager 内打开订单卡处理（指派/接单/退单等全在卡内），不再跨页跳转 */
  const handleOpenPendingOrder = useCallback(
    ({ order }: { order: Order }) => {
      openOrderCard(order);
    },
    [openOrderCard],
  );

  useEffect(() => {
    if (!isHydrated || !uiHydrated) return;

    // 幂等守卫:仅当 URL 查询串真正变化时才应用深链定位。
    // lookup 对象每次渲染都是新引用,若无此守卫,点击行首后只要用户再操作
    // (打字/切筛选),effect 就会重跑并把定位弹回原订单 → 表现为「卡住/点不动」。
    const searchKey = searchParams.toString();
    if (appliedSearchRef.current === searchKey) return;
    appliedSearchRef.current = searchKey;

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
                      流程推进图
                      {managerScopeLabel ? ` · ${managerScopeLabel}` : ""}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      按主流程列查看每单推进 · 到达的环节填色并记录达成日期 ·
                      点击行首查看详情
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
                <WeeklyDigestPanel
                  orders={scopedOrders}
                  supplements={scopedReportSupplements}
                  period={weeklyPeriod}
                  reportScope={personalWeeklyOnly ? "manager" : "global"}
                  storeScopeLabel={personalWeeklyOnly ? null : managerScopeLabel}
                  personScope={reportPersonScope}
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
                <ManagerFlowProgressPanel
                  orders={scopedOrders}
                  onOpenOrder={openOrderCard}
                />
              ) : (
                <ManagerLookupPanel
                  {...lookup.lookupPanelProps}
                  onOpenOrder={openOrderCard}
                />
              )}
            </ModuleWorkbenchLayout>
          )}
        </div>
        {/* 订单详情/操作浮层:manager 内所有订单统一在此完整处理 */}
        <OrderCardDialog
          orderId={cardOrderId}
          onClose={() => setCardOrderId(null)}
        />
      </AppShell>
    </RouteGuard>
  );
}
