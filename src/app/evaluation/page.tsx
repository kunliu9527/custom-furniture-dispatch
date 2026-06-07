"use client";

import { RouteGuard } from "@/components/auth/route-guard";
import { AcceptanceEvaluationSection } from "@/components/evaluation/acceptance-evaluation-section";
import { DispatcherPerformanceTable } from "@/components/evaluation/dispatcher-performance-table";
import { DispatcherPerformanceDigestPanel } from "@/components/evaluation/dispatcher-performance-digest-panel";
import { DispatcherEvaluationRankingTable } from "@/components/evaluation/dispatcher-evaluation-ranking-table";
import { DispatcherEvaluationTable } from "@/components/evaluation/dispatcher-evaluation-table";
import { DesignerPerformanceTable } from "@/components/evaluation/designer-performance-table";
import { EvaluationCockpit } from "@/components/evaluation/evaluation-cockpit";
import { EvaluationOperationsChartHub } from "@/components/evaluation/evaluation-operations-chart-hub";
import {
  EvaluationMobileNav,
  EvaluationSidebar,
  type EvaluationMainSection,
} from "@/components/evaluation/evaluation-sidebar";
import { ReportHub } from "@/components/shared/report-hub";
import { EvaluationWorkbenchLayout } from "@/components/evaluation/evaluation-workbench-layout";
import { EvaluationStatsTable } from "@/components/evaluation/evaluation-stats-table";
import { ManagerLookupPanel } from "@/components/manager/manager-lookup-panel";
import { ManagerOrderTable } from "@/components/manager/manager-order-table";
import { OrderAnomalySummaryLine } from "@/components/orders/order-anomaly-badges";
import { MonthlyOverviewCard } from "@/components/evaluation/monthly-overview-card";
import { DesignerSituationNarrativePanel } from "@/components/evaluation/designer-situation-narrative-panel";
import { MonthlySnapshotPanel } from "@/components/evaluation/monthly-snapshot-panel";
import { EVAL_PAGE_MAIN_CLASS } from "@/components/evaluation/sticky-section";
import { AGGREGATE_TABLE_FOOTNOTE } from "@/lib/metric-display-labels";
import { AppShell } from "@/components/layout/app-shell";
import { PeriodFilterBar } from "@/components/shared/period-filter-bar";
import { WorkbenchPeriodSearchBar } from "@/components/shared/workbench-period-search-bar";
import { useAuth } from "@/context/auth-context";
import { useOrders } from "@/context/orders-context";
import {
  formatEvaluationMetric,
  getDesignerAmountRows,
  getDesignerEvaluationRows,
  getDispatcherEvaluationRows,
  getDispatcherWorkflowRows,
  getDispatcherTabSummary,
  getStoreEvaluationRows,
  getStoreDispatcherAmountRows,
  getWorkflowTabSummary,
  type EvaluationViewMode,
} from "@/lib/evaluation-stats";
import {
  getDefaultEvaluationViewMode,
  getDesignerSubtitleForEvaluation,
  getEvaluationBoardTitle,
  getVisibleEvaluationViewModes,
  isEvaluationStoreScoped,
  resolveEvaluationRowScope,
  resolveEvaluationScopeLabel,
  scopeOrdersForEvaluationBoard,
  scopeOrdersForEvaluationView,
  shouldShowStoreRankingSubView,
} from "@/lib/evaluation-scope";
import { filterRankingDisplayRows } from "@/lib/evaluation-ranking";
import {
  canAccessEvaluationPage,
} from "@/lib/nav-access";
import {
  getDesignerPerformanceRows,
  getMonthlyReportOverview,
} from "@/lib/designer-performance";
import {
  loadEvaluationUi,
  saveEvaluationUi,
  type EvaluationOperationsSubView,
  type EvaluationSubView,
} from "@/lib/evaluation-ui-persistence";
import { getManagerAlerts } from "@/lib/manager-alerts";
import type { ReportTab } from "@/lib/report-hub-config";
import {
  resolvePeriodForReportTab,
  periodFilterVariantForReportTab,
  periodFilterVariantForDataSubView,
  performancePeriodBarHint,
  reportPeriodBarHint,
  resolvePeriodForPerformanceSubView,
  isMonthPeriod,
} from "@/lib/report-period-sync";
import {
  loadWorkbenchPeriod,
  saveWorkbenchPeriod,
} from "@/lib/workbench-period-persistence";
import { getAcceptanceEvaluationSummary, getAcceptancePersonRanking, getAcceptanceRatingRecords, getAcceptanceStoreRows, formatAcceptanceTabMetric } from "@/lib/acceptance-evaluation-stats";
import { getDispatcherPerformanceRows } from "@/lib/dispatcher-performance";
import {
  getActiveSubView,
  getEvaluationSideNavGroups,
  getSubViewTitle,
  setActiveSubView,
} from "@/lib/evaluation-side-nav";
import { buildEvaluationBoardSnapshot } from "@/lib/evaluation-board-snapshot";
import {
  buildDesignerSituationNarrative,
  formatDesignerSituationNarrativeText,
} from "@/lib/designer-situation-narrative";
import { aggregateIssueTags } from "@/lib/issue-tag-stats";
import { buildConversionFunnel, buildFunnelCompare } from "@/lib/conversion-funnel";
import {
  buildOverviewMonthlySnapshot,
  ensureOverviewMonthlySnapshot,
  fetchMonthlySnapshotClient,
  fetchMonthlySnapshotIndexClient,
  type AutoSnapshotResult,
} from "@/lib/evaluation-auto-snapshot";
import {
  applyDemoIssueTagFallback,
  applyDemoTrendFallback,
  shouldUseEvaluationDemo,
} from "@/lib/evaluation-trend-demo";
import { seedDemoMonthlySnapshots } from "@/lib/demo-monthly-snapshots";
import { apiFetch } from "@/lib/client-api";
import { buildIssueTagTrendSeries } from "@/lib/issue-tag-trend";
import {
  buildAcceptanceMiniSeries,
  buildDesignerMiniSeries,
  buildDispatcherMiniSeries,
  buildStoreBarItems,
  getDispatcherTop5,
} from "@/lib/tab-trend-series";
import {
  buildOperationsBrief,
  enrichBriefWithSecondaryCompare,
  enrichBriefWithYoY,
} from "@/lib/operations-brief";
import {
  buildMonthlyTrendSeries,
  enrichTrendSeriesWithArchives,
  type TrendMonthPoint,
  type TrendMonthSpan,
} from "@/lib/trend-series";
import { exportCommissionDraftCsv } from "@/lib/commission-export";
import { exportMonthlyDesignerReport } from "@/lib/monthly-report-export";
import {
  DEFAULT_PERIOD,
  filterOrdersByPeriod,
  filterSupplementsByPeriod,
  formatPeriodLabel,
  selectionToYearMonth,
  shiftYearMonth,
  yearMonthToPeriod,
  type PeriodSelection,
} from "@/lib/period-filter";
import type { MonthlyCockpitSnapshot } from "@/lib/monthly-snapshot-types";
import { getSessionResetKey } from "@/lib/session-user";
import { useOrderLookupWorkbench } from "@/lib/use-order-lookup-workbench";
import { searchOrders } from "@/lib/order-search";
import {
  formatStrongPinEmptyMessage,
  formatStrongPinHeading,
  formatStrongPinSearchHint,
  resolveStrongPinOrder,
  resolveStrongPinOrSearchMatches,
} from "@/lib/strong-pin-order";
import { sortOrdersNewestFirst } from "@/lib/order-utils";
import { filterSupplementsByOrders } from "@/lib/supplement-filter";
import type { ViewMode } from "@/lib/manager-stats";
import { useCallback, useEffect, useMemo, useState } from "react";

/** 数据 Tab（派单人/设计师/门店）→ 订单查询查找模式 */
function evaluationViewToLookupMode(mode: EvaluationViewMode): ViewMode {
  if (mode === "acceptance") return "status";
  return mode;
}

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
  acceptance: {
    title: "客户验收评价",
    nameColumnLabel: "门店名称",
    emptyMessage: "当前权限范围内暂无验收评价",
  },
};

export default function EvaluationPage() {
  const { user, staffRecords, designerHomeStoreIndex } = useAuth();
  const { orders, supplements, isHydrated, reassignOrder, setAfterSalesAmount, setOrderIssueTags } = useOrders();
  const allowedModes = useMemo(
    () => getVisibleEvaluationViewModes(user),
    [user],
  );
  const allowedModesKey = allowedModes.join(",");
  const [mainSection, setMainSection] =
    useState<EvaluationMainSection>("operations");
  const [operationsSubView, setOperationsSubView] =
    useState<EvaluationOperationsSubView>("cockpit");
  const [reportTab, setReportTab] = useState<ReportTab>("weekly");
  const [viewMode, setViewMode] = useState<EvaluationViewMode>("dispatcher");
  const [dispatcherSubView, setDispatcherSubView] =
    useState<EvaluationSubView>("aggregate");
  const [storeSubView, setStoreSubView] = useState<EvaluationSubView>("aggregate");
  const [designerSubView, setDesignerSubView] =
    useState<EvaluationSubView>("aggregate");
  const [acceptanceSubView, setAcceptanceSubView] =
    useState<EvaluationSubView>("aggregate");
  const [period, setPeriod] = useState<PeriodSelection>(DEFAULT_PERIOD);
  const [orderQuery, setOrderQuery] = useState("");
  const [periodUiHydrated, setPeriodUiHydrated] = useState(false);
  const [snapshotStatus, setSnapshotStatus] =
    useState<AutoSnapshotResult | null>(null);
  const [archiveMonths, setArchiveMonths] = useState<string[]>([]);
  const [yoyCockpit, setYoyCockpit] = useState<MonthlyCockpitSnapshot | null>(
    null,
  );
  const [yoyLabel, setYoyLabel] = useState<string | null>(null);
  const [monthSpan, setMonthSpan] = useState<TrendMonthSpan>(6);
  const sessionResetKey = getSessionResetKey(user);
  const periodLabel = formatPeriodLabel(period);
  const scopeLabel = resolveEvaluationScopeLabel(user);
  const storeScoped = isEvaluationStoreScoped(user);

  const handleViewModeChange = useCallback((mode: EvaluationViewMode) => {
    setOrderQuery("");
    setViewMode(mode);
  }, []);

  const handleMainSectionChange = useCallback((section: EvaluationMainSection) => {
    setOrderQuery("");
    setMainSection(section);
  }, []);

  const handlePeriodChange = useCallback((next: PeriodSelection) => {
    setOrderQuery("");
    setPeriod(next);
  }, []);

  const boardOrders = useMemo(
    () => scopeOrdersForEvaluationBoard(orders, user),
    [orders, user],
  );

  const lookup = useOrderLookupWorkbench({
    user,
    scopedOrders: boardOrders,
    orders,
    supplements,
    staffRecords,
    designerHomeStoreIndex,
    period,
    onPeriodChange: handlePeriodChange,
    reassignOrder,
    setAfterSalesAmount,
    setOrderIssueTags,
    sessionResetKey,
    initialViewMode: evaluationViewToLookupMode(
      getDefaultEvaluationViewMode(user),
    ),
    searchHintBase: storeScoped && scopeLabel
      ? `${scopeLabel} · 订单查询按此统计周期`
      : "订单查询按此统计周期",
  });

  /** 订单查询与当前数据 Tab（派单人/设计师/门店）对齐 */
  useEffect(() => {
    if (mainSection !== "operations" || operationsSubView !== "lookup") return;
    const mapped = evaluationViewToLookupMode(viewMode);
    if (lookup.viewMode !== mapped) {
      lookup.handleViewModeChange(mapped);
    }
  }, [
    mainSection,
    operationsSubView,
    viewMode,
    lookup.viewMode,
    lookup.handleViewModeChange,
  ]);

  useEffect(() => {
    if (!user?.username) return;
    const savedWorkbenchPeriod = loadWorkbenchPeriod(user.username);
    const saved = loadEvaluationUi(user.username);
    if (saved && allowedModes.includes(saved.viewMode)) {
      setMainSection(saved.mainSection ?? "operations");
      setOperationsSubView(saved.operationsSubView ?? "cockpit");
      setReportTab(saved.reportTab ?? "weekly");
      setViewMode(saved.viewMode);
      setDispatcherSubView(saved.dispatcherSubView);
      setStoreSubView(saved.storeSubView);
      setDesignerSubView(saved.designerSubView);
      setAcceptanceSubView(saved.acceptanceSubView ?? "aggregate");
      setPeriod(savedWorkbenchPeriod ?? saved.period);
      setPeriodUiHydrated(true);
      return;
    }
    setMainSection("operations");
    setOperationsSubView("cockpit");
    setReportTab("weekly");
    const defaults = getDefaultEvaluationViewMode(user);
    setViewMode(
      allowedModes.includes(defaults) ? defaults : (allowedModes[0] ?? "dispatcher"),
    );
    setDispatcherSubView("aggregate");
    setStoreSubView("aggregate");
    setDesignerSubView("aggregate");
    setAcceptanceSubView("aggregate");
    setPeriod(savedWorkbenchPeriod ?? DEFAULT_PERIOD);
    setPeriodUiHydrated(true);
  }, [sessionResetKey, allowedModesKey, user]);

  useEffect(() => {
    if (!user?.username || !periodUiHydrated) return;
    saveWorkbenchPeriod(user.username, period);
  }, [user?.username, period, periodUiHydrated]);

  useEffect(() => {
    if (!user?.username) return;
    saveEvaluationUi(user.username, {
      mainSection,
      operationsSubView,
      reportTab,
      viewMode,
      dispatcherSubView,
      storeSubView,
      designerSubView,
      acceptanceSubView,
      period,
    });
  }, [
    user?.username,
    mainSection,
    operationsSubView,
    reportTab,
    viewMode,
    dispatcherSubView,
    storeSubView,
    designerSubView,
    acceptanceSubView,
    period,
  ]);

  useEffect(() => {
    if (!allowedModes.includes(viewMode)) {
      handleViewModeChange(allowedModes[0] ?? "dispatcher");
    }
  }, [allowedModesKey, viewMode, allowedModes, handleViewModeChange]);

  useEffect(() => {
    if (mainSection !== "operations" || operationsSubView !== "reports") return;
    const next = resolvePeriodForReportTab(reportTab, period);
    if (next) setPeriod(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 进入报告区或切换 Tab 时对齐周期
  }, [mainSection, operationsSubView, reportTab]);

  useEffect(() => {
    if (mainSection !== "data") return;
    if (viewMode === "dispatcher" && dispatcherSubView === "performance") {
      const next = resolvePeriodForPerformanceSubView("dispatcher", period);
      if (next) setPeriod(next);
    } else if (viewMode === "designer" && designerSubView === "performance") {
      const next = resolvePeriodForPerformanceSubView("designer", period);
      if (next) setPeriod(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 进入绩效报告时校正周期
  }, [mainSection, viewMode, dispatcherSubView, designerSubView]);

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
      acceptance: scopeOrdersForEvaluationView(
        "acceptance",
        orders,
        user,
        staffRecords,
      ),
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
      acceptance: filterOrdersByPeriod(scopedOrdersByView.acceptance, period),
    }),
    [scopedOrdersByView, period],
  );

  const evaluationSearchBaseOrders = useMemo(
    () => periodScopedOrdersByView[viewMode],
    [periodScopedOrdersByView, viewMode],
  );

  const strongPin = useMemo(
    () => resolveStrongPinOrder(evaluationSearchBaseOrders, orderQuery),
    [evaluationSearchBaseOrders, orderQuery],
  );

  const orderSearchResults = useMemo(() => {
    const q = orderQuery.trim();
    if (!q) return [];
    return sortOrdersNewestFirst(
      resolveStrongPinOrSearchMatches(
        evaluationSearchBaseOrders,
        orderQuery,
        strongPin,
      ),
    );
  }, [evaluationSearchBaseOrders, orderQuery, strongPin]);

  const isOrderSearching = orderQuery.trim().length > 0;

  const lookupSearchHint = formatStrongPinSearchHint(
    strongPin,
    orderQuery,
    "数据汇总与订单查询按此周期",
  );

  const lookupEmptyMessage = useMemo(
    () =>
      formatStrongPinEmptyMessage(strongPin, orderQuery, "未找到匹配的订单"),
    [strongPin, orderQuery],
  );

  const orderSearchHeading = useMemo(() => {
    if (isOrderSearching && strongPin.kind === "pin") {
      return formatStrongPinHeading(strongPin, "关键词查找结果");
    }
    if (isOrderSearching) {
      return `关键词查找结果（${orderSearchResults.length}）`;
    }
    return "";
  }, [isOrderSearching, strongPin, orderSearchResults.length]);

  const orderSearchSupplements = useMemo(
    () => filterSupplementsByOrders(supplements, orderSearchResults),
    [supplements, orderSearchResults],
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

  const showStoreRanking = shouldShowStoreRankingSubView(
    rowScope.storeNames,
    storeScoped,
  );

  const boardSupplements = useMemo(
    () => filterSupplementsByOrders(supplements, boardOrders),
    [supplements, boardOrders],
  );

  const periodScopedSupplements = useMemo(
    () => filterSupplementsByPeriod(boardSupplements, period),
    [boardSupplements, period],
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

  const dispatcherWorkflowRows = useMemo(
    () =>
      getDispatcherWorkflowRows(
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

  const companyPeriodOrders = useMemo(
    () =>
      filterOrdersByPeriod(storeScoped ? boardOrders : orders, period),
    [storeScoped, boardOrders, orders, period],
  );

  const storeRankingData = useMemo(() => {
    const rankSource = getStoreDispatcherAmountRows(
      companyPeriodOrders,
      periodScopedSupplements,
      storeScoped ? rowScope.storeNames : null,
    );
    return {
      rankSource,
      displayRows: filterRankingDisplayRows(rankSource, rowScope.storeNames),
    };
  }, [companyPeriodOrders, periodScopedSupplements, rowScope.storeNames]);

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

  const dispatcherPerformanceRows = useMemo(
    () =>
      getDispatcherPerformanceRows(
        scopedOrdersByView.dispatcher,
        supplements,
        rowScope.dispatcherNames,
        staffRecords,
        period,
      ),
    [
      scopedOrdersByView.dispatcher,
      supplements,
      rowScope.dispatcherNames,
      staffRecords,
      period,
    ],
  );

  const acceptanceSummary = useMemo(
    () => getAcceptanceEvaluationSummary(periodScopedOrdersByView.acceptance),
    [periodScopedOrdersByView.acceptance],
  );

  const acceptanceStoreRows = useMemo(
    () =>
      getAcceptanceStoreRows(
        periodScopedOrdersByView.acceptance,
        rowScope.storeNames,
      ),
    [periodScopedOrdersByView.acceptance, rowScope.storeNames],
  );

  const acceptancePersonRanking = useMemo(
    () => getAcceptancePersonRanking(periodScopedOrdersByView.acceptance),
    [periodScopedOrdersByView.acceptance],
  );

  const acceptanceRatingRecords = useMemo(
    () => getAcceptanceRatingRecords(periodScopedOrdersByView.acceptance),
    [periodScopedOrdersByView.acceptance],
  );

  const issueTagStats = useMemo(
    () => aggregateIssueTags(scopedOrdersByView.designer, period),
    [scopedOrdersByView.designer, period],
  );

  const designerSituationNarrative = useMemo(
    () =>
      buildDesignerSituationNarrative(
        designerAmountRows,
        periodScopedOrdersByView.designer,
        period,
        periodLabel,
      ),
    [
      designerAmountRows,
      periodScopedOrdersByView.designer,
      period,
      periodLabel,
    ],
  );

  const handleExportMonthlyReport = useCallback(() => {
    exportMonthlyDesignerReport(
      monthlyOverview,
      designerPerformanceRows,
      period,
      scopedOrdersByView.designer,
      formatDesignerSituationNarrativeText(designerSituationNarrative),
    );
  }, [
    monthlyOverview,
    designerPerformanceRows,
    period,
    scopedOrdersByView.designer,
    designerSituationNarrative,
  ]);

  const handleExportCommissionDraft = useCallback(() => {
    exportCommissionDraftCsv(
      orders,
      supplements,
      staffRecords,
      period,
    );
  }, [orders, supplements, staffRecords, period]);

  const storeAggregateSummary = useMemo(
    () => getDispatcherTabSummary(storeDispatcherAmountRows),
    [storeDispatcherAmountRows],
  );

  const designerAggregateSummary = useMemo(
    () => getDispatcherTabSummary(designerAmountRows),
    [designerAmountRows],
  );

  const dispatcherWorkflowSummary = useMemo(
    () => getWorkflowTabSummary(dispatcherWorkflowRows),
    [dispatcherWorkflowRows],
  );

  const tabSummaries = useMemo(
    () => ({
      dispatcher: getDispatcherTabSummary(dispatcherRows),
      designer: getDispatcherTabSummary(designerAmountRows),
      store: getDispatcherTabSummary(storeDispatcherAmountRows),
      acceptance: {
        count: acceptanceSummary.ratedCount,
        amount: 0,
        displayText: formatAcceptanceTabMetric(acceptanceSummary),
        metricHint: "已评价 / 综合均分",
      },
    }),
    [
      dispatcherRows,
      designerAmountRows,
      storeDispatcherAmountRows,
      acceptanceSummary,
    ],
  );

  const activeConfig = viewConfig[viewMode];

  const overviewOrders = boardOrders;

  const globalReportSupplements = useMemo(
    () => filterSupplementsByOrders(supplements, overviewOrders),
    [supplements, overviewOrders],
  );

  const globalAlerts = useMemo(
    () => getManagerAlerts(overviewOrders),
    [overviewOrders],
  );

  const operationsBrief = useMemo(
    () => buildOperationsBrief(overviewOrders, globalReportSupplements, period),
    [overviewOrders, globalReportSupplements, period],
  );

  const briefWithSecondary = useMemo(
    () =>
      enrichBriefWithSecondaryCompare(
        operationsBrief,
        period,
        overviewOrders,
        supplements,
      ),
    [operationsBrief, period, overviewOrders, supplements],
  );

  const displayBrief = useMemo(
    () => enrichBriefWithYoY(briefWithSecondary, yoyLabel, yoyCockpit),
    [briefWithSecondary, yoyLabel, yoyCockpit],
  );

  const trendPoints = useMemo(
    () => buildMonthlyTrendSeries(overviewOrders, globalReportSupplements, monthSpan),
    [overviewOrders, globalReportSupplements, monthSpan],
  );

  const issueTagPointsRaw = useMemo(
    () => buildIssueTagTrendSeries(overviewOrders, monthSpan),
    [overviewOrders, monthSpan],
  );

  const [displayTrendPoints, setDisplayTrendPoints] =
    useState<TrendMonthPoint[]>(trendPoints);
  const [displayIssueTagPoints, setDisplayIssueTagPoints] = useState(
    issueTagPointsRaw,
  );

  useEffect(() => {
    let cancelled = false;
    void enrichTrendSeriesWithArchives(
      trendPoints,
      (ym) => fetchMonthlySnapshotClient(ym, scopeLabel),
      { scopeLabel },
    ).then((points) => {
      if (cancelled) return;
      const withDemo =
        storeScoped || !shouldUseEvaluationDemo()
          ? points
          : applyDemoTrendFallback(points, monthSpan);
      setDisplayTrendPoints(withDemo);
    });
    return () => {
      cancelled = true;
    };
  }, [trendPoints, monthSpan, scopeLabel, storeScoped]);

  useEffect(() => {
    setDisplayIssueTagPoints(
      storeScoped
        ? issueTagPointsRaw
        : applyDemoIssueTagFallback(issueTagPointsRaw, monthSpan),
    );
  }, [issueTagPointsRaw, monthSpan, storeScoped]);

  const isDemoTrend = displayTrendPoints.some((p) => p.isDemo);

  const chartDataByMode = useMemo(
    () => ({
      dispatcher: {
        dispatcherSeries: buildDispatcherMiniSeries(
          scopedOrdersByView.dispatcher,
          supplements,
          monthSpan,
        ),
        dispatcherTop5: getDispatcherTop5(
          scopedOrdersByView.dispatcher,
          supplements,
          rowScope.dispatcherNames,
          staffRecords,
          period,
        ),
        designerSeries: [],
        storeBars: [],
        acceptanceSeries: [],
      },
      designer: {
        dispatcherSeries: [],
        dispatcherTop5: [],
        designerSeries: buildDesignerMiniSeries(
          scopedOrdersByView.designer,
          supplements,
          monthSpan,
        ),
        storeBars: [],
        acceptanceSeries: [],
      },
      store: {
        dispatcherSeries: [],
        dispatcherTop5: [],
        designerSeries: [],
        storeBars: buildStoreBarItems(
          scopedOrdersByView.store,
          supplements,
          period,
          rowScope.storeNames,
        ),
        acceptanceSeries: [],
      },
      acceptance: {
        dispatcherSeries: [],
        dispatcherTop5: [],
        designerSeries: [],
        storeBars: [],
        acceptanceSeries: buildAcceptanceMiniSeries(
          periodScopedOrdersByView.acceptance,
          monthSpan,
        ),
      },
    }),
    [
      scopedOrdersByView,
      supplements,
      monthSpan,
      period,
      rowScope.dispatcherNames,
      rowScope.storeNames,
      staffRecords,
      periodScopedOrdersByView.acceptance,
    ],
  );

  const funnelCompare = useMemo(
    () => buildFunnelCompare(overviewOrders, period),
    [overviewOrders, period],
  );

  const handlePeriodMonthSelect = useCallback((yearMonth: string) => {
    setPeriod(yearMonthToPeriod(yearMonth));
  }, []);

  useEffect(() => {
    if (!isHydrated || period.preset === "all" || period.preset === "thisWeek" || period.preset === "lastWeek") return;
    let cancelled = false;

    const funnel = buildConversionFunnel(overviewOrders, period);
    const snapshot = buildOverviewMonthlySnapshot(
      overviewOrders,
      globalReportSupplements,
      period,
      operationsBrief,
      funnel,
      {
        scopeLabel: scopeLabel ?? undefined,
        staffRecords,
        savedBy: user?.displayName ?? "综合看板",
      },
    );

    void ensureOverviewMonthlySnapshot(snapshot).then((result) => {
      if (!cancelled) setSnapshotStatus(result);
    });

    if (period.preset !== "lastMonth") {
      const lastPeriod = { preset: "lastMonth" as const };
      const lastBrief = buildOperationsBrief(
        overviewOrders,
        globalReportSupplements,
        lastPeriod,
      );
      const lastFunnel = buildConversionFunnel(overviewOrders, lastPeriod);
      const lastSnapshot = buildOverviewMonthlySnapshot(
        overviewOrders,
        globalReportSupplements,
        lastPeriod,
        lastBrief,
        lastFunnel,
        { scopeLabel: scopeLabel ?? undefined, staffRecords },
      );
      void ensureOverviewMonthlySnapshot(lastSnapshot);
    }

    return () => {
      cancelled = true;
    };
  }, [
    isHydrated,
    overviewOrders,
    globalReportSupplements,
    period,
    operationsBrief,
    scopeLabel,
    staffRecords,
    user?.displayName,
  ]);

  useEffect(() => {
    void fetchMonthlySnapshotIndexClient(scopeLabel).then(setArchiveMonths);
  }, [scopeLabel]);

  useEffect(() => {
    if (!isHydrated || storeScoped || !shouldUseEvaluationDemo()) return;
    void seedDemoMonthlySnapshots(async (snap) => {
      try {
        const existing = await apiFetch(
          `/api/monthly-snapshots?month=${encodeURIComponent(snap.yearMonth)}`,
        );
        if (existing.ok) return false;
        const post = await apiFetch("/api/monthly-snapshots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(snap),
        });
        return post.ok;
      } catch {
        return false;
      }
    }).then((saved) => {
      if (saved > 0) {
        void fetchMonthlySnapshotIndexClient(scopeLabel).then(setArchiveMonths);
      }
    });
  }, [isHydrated]);

  useEffect(() => {
    const ym = selectionToYearMonth(period);
    if (!ym) {
      setYoyCockpit(null);
      setYoyLabel(null);
      return;
    }
    const prevYearYm = shiftYearMonth(ym, -12);
    if (!prevYearYm) {
      setYoyCockpit(null);
      setYoyLabel(null);
      return;
    }
    setYoyLabel(formatPeriodLabel(yearMonthToPeriod(prevYearYm)));
    void fetchMonthlySnapshotClient(prevYearYm, scopeLabel).then((snap) => {
      setYoyCockpit(snap?.cockpit ?? null);
    });
  }, [period, scopeLabel]);

  const activeSubView = getActiveSubView(viewMode, {
    dispatcher: dispatcherSubView,
    designer: designerSubView,
    store: storeSubView,
    acceptance: acceptanceSubView,
  });

  const tableBoardSnapshot = useMemo(() => {
    if (viewMode === "acceptance") return undefined;
    if (
      (viewMode === "dispatcher" || viewMode === "designer") &&
      activeSubView === "performance"
    ) {
      return undefined;
    }
    return buildEvaluationBoardSnapshot(viewMode, activeSubView);
  }, [viewMode, activeSubView]);

  const sideNavGroups = useMemo(() => {
    const groups = getEvaluationSideNavGroups(viewMode, {
      hideStoreRanking: viewMode === "store" && !showStoreRanking,
    });
    return groups.map((group) => ({
      ...group,
      items: group.items.map((item) => {
        let suffix: string | undefined;
        if (viewMode === "dispatcher") {
          if (item.id === "aggregate") {
            suffix = formatEvaluationMetric(
              tabSummaries.dispatcher.count,
              tabSummaries.dispatcher.amount,
            );
          } else if (item.id === "workflow") {
            suffix = formatEvaluationMetric(
              dispatcherWorkflowSummary.count,
              dispatcherWorkflowSummary.amount,
            );
          } else if (item.id === "performance") {
            suffix = `${periodLabel} · 贡献分`;
          }
        } else if (viewMode === "designer") {
          if (item.id === "aggregate") {
            suffix = formatEvaluationMetric(
              designerAggregateSummary.count,
              designerAggregateSummary.amount,
            );
          } else if (item.id === "workflow") {
            suffix = formatEvaluationMetric(
              tabSummaries.designer.count,
              tabSummaries.designer.amount,
            );
          } else if (item.id === "performance") {
            suffix = `${periodLabel} · 贡献分 · 超时`;
          }
        } else if (viewMode === "store") {
          if (item.id === "aggregate") {
            suffix = formatEvaluationMetric(
              storeAggregateSummary.count,
              storeAggregateSummary.amount,
            );
          } else if (item.id === "workflow") {
            suffix = formatEvaluationMetric(
              tabSummaries.store.count,
              tabSummaries.store.amount,
            );
          }
        } else if (viewMode === "acceptance") {
          if (item.id === "aggregate") {
            suffix = `已评价 ${acceptanceSummary.ratedCount} 单 · 均分 ${acceptanceSummary.avgOverall.toFixed(1)} 星`;
          }
        }
        return { ...item, suffix };
      }),
    }));
  }, [
    viewMode,
    showStoreRanking,
    tabSummaries,
    dispatcherWorkflowSummary,
    designerAggregateSummary,
    storeAggregateSummary,
    acceptanceSummary,
    periodLabel,
  ]);

  useEffect(() => {
    if (viewMode === "store" && storeSubView === "ranking" && !showStoreRanking) {
      setStoreSubView("aggregate");
    }
  }, [viewMode, storeSubView, showStoreRanking]);

  const handleSubViewSelect = useCallback(
    (id: EvaluationSubView) => {
      setOrderQuery("");
      setActiveSubView(viewMode, id, {
        setDispatcherSubView,
        setDesignerSubView,
        setStoreSubView,
        setAcceptanceSubView,
      });
    },
    [viewMode],
  );

  const exportData = useMemo(
    () => ({
      dispatcherRows,
      dispatcherWorkflowRows,
      designerAmountRows,
      designerWorkflowRows: designerRows,
      storeDispatcherAmountRows,
      storeWorkflowRows: storeRows,
      storeRankingDisplayRows: storeRankingData.displayRows,
      storeRankingRankSource: storeRankingData.rankSource,
      acceptanceSummary,
      acceptanceStoreRows,
      acceptancePersonRanking,
      acceptanceRatingRecords,
      dispatcherPerformanceRows,
    }),
    [
      dispatcherRows,
      dispatcherWorkflowRows,
      designerAmountRows,
      designerRows,
      storeDispatcherAmountRows,
      storeRows,
      storeRankingData,
      acceptanceSummary,
      acceptanceStoreRows,
      acceptancePersonRanking,
      acceptanceRatingRecords,
      dispatcherPerformanceRows,
    ],
  );

  const dataPeriodVariant = periodFilterVariantForDataSubView(
    mainSection,
    viewMode,
    activeSubView,
  );
  const isDataPerformanceSubView =
    mainSection === "data" &&
    activeSubView === "performance" &&
    (viewMode === "dispatcher" || viewMode === "designer");
  const dataPeriodHint =
    viewMode === "dispatcher" && activeSubView === "performance"
      ? performancePeriodBarHint("dispatcher", scopeLabel)
      : viewMode === "designer" && activeSubView === "performance"
        ? performancePeriodBarHint("designer", scopeLabel)
        : lookupSearchHint;

  return (
    <RouteGuard canAccess={canAccessEvaluationPage(user)}>
      <AppShell
        title={getEvaluationBoardTitle(scopeLabel)}
        board="/evaluation"
        mainClassName={EVAL_PAGE_MAIN_CLASS}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {!isHydrated ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-400">
              加载订单数据…
            </div>
          ) : (
            <EvaluationWorkbenchLayout
              periodBar={
                mainSection === "data" ? (
                  <WorkbenchPeriodSearchBar
                    period={period}
                    onPeriodChange={handlePeriodChange}
                    query={orderQuery}
                    onQueryChange={setOrderQuery}
                    hint={dataPeriodHint}
                    showSearch={!isDataPerformanceSubView}
                    periodVariant={dataPeriodVariant}
                    placeholder={
                      storeScoped && scopeLabel
                        ? `查询 ${scopeLabel} 订单：客户、电话、地址、设计师、派单人…`
                        : "查询订单：客户、电话、地址、设计师、派单人、门店…"
                    }
                    resultCount={orderSearchResults.length}
                  />
                ) : mainSection === "operations" &&
                  operationsSubView === "lookup" ? (
                  <WorkbenchPeriodSearchBar
                    period={period}
                    onPeriodChange={lookup.handlePeriodChange}
                    query={lookup.searchQuery}
                    onQueryChange={lookup.setSearchQuery}
                    hint={lookup.lookupSearchHint}
                    placeholder={
                      storeScoped && scopeLabel
                        ? `查询 ${scopeLabel} 订单：客户、电话、地址、设计师、派单人…`
                        : "客户姓名、电话、地址、设计师、派单人、门店…"
                    }
                    resultCount={lookup.lookupSearchCount}
                  />
                ) : (
                  <PeriodFilterBar
                    value={period}
                    onChange={setPeriod}
                    embedded
                    variant={
                      mainSection === "operations" &&
                      operationsSubView === "reports"
                        ? periodFilterVariantForReportTab(reportTab)
                        : "default"
                    }
                    hint={
                      mainSection === "operations" &&
                      operationsSubView === "reports"
                        ? reportPeriodBarHint(reportTab, scopeLabel)
                        : undefined
                    }
                  />
                )
              }
              mobileTabs={
                <EvaluationMobileNav
                  mainSection={mainSection}
                  onMainSectionChange={handleMainSectionChange}
                  operationsSubView={operationsSubView}
                  onOperationsSubViewChange={setOperationsSubView}
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                  summaries={tabSummaries}
                  allowedModes={allowedModes}
                  exportData={exportData}
                  periodLabel={periodLabel}
                  reportScopeLabel={scopeLabel}
                  sideNavGroups={sideNavGroups}
                  activeSubView={activeSubView}
                  onSubViewSelect={handleSubViewSelect}
                />
              }
              sidebar={
                <EvaluationSidebar
                  mainSection={mainSection}
                  onMainSectionChange={handleMainSectionChange}
                  operationsSubView={operationsSubView}
                  onOperationsSubViewChange={setOperationsSubView}
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                  summaries={tabSummaries}
                  allowedModes={allowedModes}
                  exportData={exportData}
                  periodLabel={periodLabel}
                  sideNavGroups={sideNavGroups}
                  activeSubView={activeSubView}
                  onSubViewSelect={handleSubViewSelect}
                  reportScopeLabel={scopeLabel}
                />
              }
            >
              {mainSection === "operations" ? (
                operationsSubView === "reports" ? (
                  <ReportHub
                    scope="global"
                    orders={overviewOrders}
                    supplements={globalReportSupplements}
                    period={period}
                    activeTab={reportTab}
                    onTabChange={setReportTab}
                    onPeriodChange={handlePeriodChange}
                    storeScopeLabel={scopeLabel}
                    onOpenOrderLookup={() => {
                      setMainSection("operations");
                      setOperationsSubView("lookup");
                    }}
                  />
                ) : operationsSubView === "lookup" ? (
                  <ManagerLookupPanel {...lookup.lookupPanelProps} />
                ) : (
                <>
                  <EvaluationCockpit
                    brief={displayBrief}
                    scopeLabel={scopeLabel}
                    snapshotStatus={snapshotStatus}
                    isDemoTrend={isDemoTrend}
                  />
                  <EvaluationOperationsChartHub
                    allowedModes={allowedModes}
                    hideStoreChartTab={storeScoped && !showStoreRanking}
                    trendPoints={displayTrendPoints}
                    issueTagPoints={displayIssueTagPoints}
                    funnelCompare={funnelCompare}
                    period={period}
                    periodLabel={periodLabel}
                    monthSpan={monthSpan}
                    onMonthSpanChange={setMonthSpan}
                    onPeriodMonthSelect={handlePeriodMonthSelect}
                    archiveMonths={archiveMonths}
                    dataByMode={chartDataByMode}
                    selectedYearMonth={selectionToYearMonth(period)}
                  />
                </>
                )
              ) : (
                <div className="space-y-4">
                  {isOrderSearching ? (
                    <section className="space-y-3">
                      <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5">
                        <h2 className="text-sm font-semibold text-slate-900">
                          {orderSearchHeading}
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {periodLabel}
                          {scopeLabel ? ` · ${scopeLabel}` : ""}
                          {` · ${viewConfig[viewMode].title}`}
                          {lookupSearchHint && strongPin.kind === "pin"
                            ? ` · ${lookupSearchHint}`
                            : null}
                        </p>
                        <OrderAnomalySummaryLine
                          orders={orderSearchResults}
                          className="mt-1 text-xs font-medium text-rose-600"
                          highlightCrossStore
                          designerHomeStoreIndex={designerHomeStoreIndex}
                        />
                      </div>
                      <ManagerOrderTable
                        orders={orderSearchResults}
                        supplements={orderSearchSupplements}
                        showDesigner
                        readOnly
                        emptyMessage={lookupEmptyMessage}
                      />
                    </section>
                  ) : (
                    <>
                  <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5">
                    <h2 className="text-sm font-semibold text-slate-900">
                      {getSubViewTitle(viewMode, activeSubView)}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {periodLabel}
                      {scopeLabel ? ` · ${scopeLabel}` : ""}
                    </p>
                  </div>
                {viewMode === "acceptance" ? (
                  <AcceptanceEvaluationSection
                    orders={periodScopedOrdersByView.acceptance}
                    storeNames={rowScope.storeNames}
                    scopeLabel={scopeLabel}
                    subView={acceptanceSubView}
                    onSubViewChange={setAcceptanceSubView}
                    hideNav
                  />
                ) : viewMode === "store" ? (
                  <>
                    {storeSubView === "workflow" ? (
                      <EvaluationStatsTable
                        nameColumnLabel={activeConfig.nameColumnLabel}
                        rows={storeRows}
                        emptyMessage={activeConfig.emptyMessage}
                        snapshot={tableBoardSnapshot}
                      />
                    ) : storeSubView === "ranking" && showStoreRanking ? (
                      <DispatcherEvaluationRankingTable
                        nameColumnLabel="门店名称"
                        rows={storeRankingData.displayRows}
                        rankAgainstRows={storeRankingData.rankSource}
                        emptyMessage="当前权限范围内暂无门店排名数据"
                        footnote={
                          rowScope.storeNames && storeScoped
                            ? rowScope.storeNames.length > 1
                              ? "名次在分管门店内计算 · 按派单人所属门店 · 本店合计=本店派单人之和"
                              : "本店数据 · 按派单人所属门店 · 跨店单计入派单人店"
                            : `按派单人所属门店 · 本店合计=本店派单人之和 · ${AGGREGATE_TABLE_FOOTNOTE}`
                        }
                        snapshot={tableBoardSnapshot}
                      />
                    ) : (
                      <DispatcherEvaluationTable
                        nameColumnLabel="门店名称"
                        rows={storeDispatcherAmountRows}
                        emptyMessage="当前权限范围内暂无派单金额数据"
                        footnote="按派单人所属门店 · 本店合计=本店派单人之和 · 未下单量=原始未下单"
                        snapshot={tableBoardSnapshot}
                      />
                    )}
                  </>
                ) : viewMode === "designer" ? (
                  <>
                    {designerSubView === "performance" ? (
                      <div className="space-y-4">
                        {isMonthPeriod(period) ? (
                          <MonthlySnapshotPanel
                            orders={scopedOrdersByView.designer}
                            supplements={supplements}
                            period={period}
                            designerNames={rowScope.designerNames}
                            staffRecords={staffRecords}
                            scopeLabel={scopeLabel ?? undefined}
                            savedBy={user?.displayName}
                          />
                        ) : null}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <MonthlyOverviewCard
                            overview={monthlyOverview}
                            issueTagStats={issueTagStats}
                          />
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={handleExportCommissionDraft}
                            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-800 hover:bg-indigo-100"
                          >
                            导出{periodLabel}提成底稿 CSV
                          </button>
                        </div>
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
                        snapshot={tableBoardSnapshot}
                      />
                    ) : designerSubView === "ranking" ? (
                      <DispatcherEvaluationRankingTable
                        nameColumnLabel="设计师"
                        rows={designerAmountRows}
                        emptyMessage="当前权限范围内暂无设计师排名数据"
                        footnote={`按订单 designer 归集 · 副标题为订单派单门店 · ${AGGREGATE_TABLE_FOOTNOTE}`}
                        designerExtendedMetrics
                        snapshot={tableBoardSnapshot}
                      />
                    ) : (
                      <DispatcherEvaluationTable
                        nameColumnLabel="设计师"
                        rows={designerAmountRows}
                        emptyMessage="当前权限范围内暂无设计师归总数据"
                        footnote={`按订单 designer 归集 · 副标题为订单派单门店 · ${AGGREGATE_TABLE_FOOTNOTE}`}
                        designerExtendedMetrics
                        snapshot={tableBoardSnapshot}
                      />
                    )}
                    <DesignerSituationNarrativePanel
                      narrative={designerSituationNarrative}
                    />
                  </>
                ) : (
                  <>
                    {dispatcherSubView === "performance" ? (
                      <div className="space-y-4">
                        <DispatcherPerformanceDigestPanel
                          periodLabel={periodLabel}
                          rows={dispatcherPerformanceRows}
                        />
                        <DispatcherPerformanceTable
                          rows={dispatcherPerformanceRows}
                          emptyMessage="当前周期与权限范围内暂无派单人贡献数据"
                        />
                      </div>
                    ) : dispatcherSubView === "ranking" ? (
                      <DispatcherEvaluationRankingTable
                        nameColumnLabel={activeConfig.nameColumnLabel}
                        rows={dispatcherRows}
                        emptyMessage="当前权限范围内暂无派单人排名数据"
                        snapshot={tableBoardSnapshot}
                      />
                    ) : dispatcherSubView === "workflow" ? (
                      <EvaluationStatsTable
                        nameColumnLabel={activeConfig.nameColumnLabel}
                        rows={dispatcherWorkflowRows}
                        emptyMessage="当前权限范围内暂无派单人个人数据"
                        snapshot={tableBoardSnapshot}
                      />
                    ) : (
                      <DispatcherEvaluationTable
                        nameColumnLabel={activeConfig.nameColumnLabel}
                        rows={dispatcherRows}
                        emptyMessage={activeConfig.emptyMessage}
                        snapshot={tableBoardSnapshot}
                      />
                    )}
                  </>
                )}
                </>
                  )}
                </div>
              )}
            </EvaluationWorkbenchLayout>
          )}
        </div>
      </AppShell>
    </RouteGuard>
  );
}
