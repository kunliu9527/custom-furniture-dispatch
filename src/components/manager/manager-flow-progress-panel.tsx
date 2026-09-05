"use client";

import { StatusBadge } from "@/components/orders/status-badge";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useOrders } from "@/context/orders-context";
import { normalizeDispatcherName } from "@/lib/admin-stats";
import { resolvePrefilledOrderAmount } from "@/lib/customer-flow";
import { getEffectiveDesignerRoster } from "@/lib/designer-staff-store";
import { getEffectiveDispatcherRoster } from "@/lib/dispatchers";
import { resolveReportPersonScope } from "@/lib/evaluation-scope";
import { isAdminAccess, isPersonalAccess } from "@/lib/permissions";
import { getDispatchStoreOptions } from "@/lib/stores";
import { formatStatusUpdatedLabel } from "@/lib/order-status-feedback";
import { showStatusToast } from "@/lib/status-toast";
import { downloadCsv, stampForFilename } from "@/lib/csv-utils";
import {
  buildFlowProgressCsv,
  exportFlowProgressSnapshotPng,
} from "@/lib/flow-progress-export";
import {
  buildFlowStageCells,
  FLOW_STAGE_CELL_FILL,
  FLOW_STAGE_DISPLAY,
  FLOW_STAGE_ORDER,
  STATUS_BAR_FILL,
  type FlowStageCell,
} from "@/lib/flow-progress-utils";
import { getOrderAnomalyMarkers } from "@/lib/order-anomaly";
import { formatOrderDateDay, isRefundStatus } from "@/lib/order-utils";
import type { FlowOrderStatus, Order, OrderStatus, StoreName } from "@/lib/types";

const LABEL_WIDTH = 176;
const STAGE_COL_MIN_WIDTH = 92;
const HEADER_HEIGHT = 34;
const ROW_HEIGHT = 44;
const PAGE_SIZE = 80;

/**
 * 工具栏下拉样式(原生 select):不用 vi-field——
 * .vi-field 的 14px 字号 + 大上下 padding 在 h-8 定高下会把文字垂直裁掉,
 * max-w 又截断长店名;这里自绘紧凑样式,宽度按最长选项自适应、无 max-w。
 */
const TOOLBAR_SELECT_CLASS =
  "h-8 w-auto min-w-[7.5rem] rounded-[var(--radius-input)] border border-[var(--separator-opaque)] bg-[var(--bg-primary)] px-2.5 text-xs text-[var(--label-primary)] outline-none transition-colors duration-[var(--duration-fast)] focus:border-[var(--system-blue)]";

type StatusGroup = "all" | "design" | "progress" | "done" | "refund";

const STATUS_GROUP_OPTIONS: { value: StatusGroup; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "design", label: "设计中" },
  { value: "progress", label: "进行中" },
  { value: "done", label: "已验收" },
  { value: "refund", label: "退单" },
];

/** 已下单在流程列中的位置(其之前的环节 = 设计段) */
const ORDERED_STAGE_INDEX = FLOW_STAGE_ORDER.indexOf(
  "已下单" as FlowOrderStatus,
);

function matchStatusGroup(status: OrderStatus, group: StatusGroup): boolean {
  if (group === "all") return true;
  if (group === "done") return status === "已验收";
  if (group === "refund") return isRefundStatus(status);
  if (group === "design") {
    // 设计中 = 流程未到已下单(已录单 … 已签约)
    const index = FLOW_STAGE_ORDER.indexOf(status as FlowOrderStatus);
    return index >= 0 && index < ORDERED_STAGE_INDEX;
  }
  // 进行中 = 所有未完结主流程订单(含设计中,直至已安装)
  return status !== "已验收" && !isRefundStatus(status);
}

/** 从订单池中收集实际出现的设计师/派单人(去重;个人权限兜底用) */
function collectOrderPersonNames(
  orders: Order[],
  kind: "designer" | "dispatcher",
): string[] {
  const names = new Set<string>();
  for (const order of orders) {
    const raw = kind === "designer" ? order.designer : order.dispatcherName;
    const name = raw?.trim();
    if (name && name !== "—") names.add(name);
  }
  return [...names];
}

/**
 * 行分组序:在途订单按当前环节沿流程正序(未派单→…→已安装),
 * 待退单紧随其后(仍需跟进),已验收/已退单沉底。
 */
function flowRowRank(status: OrderStatus): number {
  if (status === "已验收") return 9;
  if (status === "待退单") return 8;
  if (status === "已退单") return 10;
  return FLOW_STAGE_ORDER.indexOf(status as FlowOrderStatus);
}

/** 进入当前环节的时间(同环节排序次级键:先进环节的先排,卡得久的在组顶) */
function currentStageEntryMs(order: Order): number {  const fromMap = order.statusEnteredAt?.[order.status as FlowOrderStatus];
  const mapTime = fromMap ? new Date(fromMap).getTime() : Number.NaN;
  if (Number.isFinite(mapTime)) return mapTime;
  for (const event of order.orderEvents ?? []) {
    if (event.toStatus === order.status || event.kind === order.status) {
      const t = new Date(event.at).getTime();
      if (Number.isFinite(t)) return t;
    }
  }
  for (const remark of order.workflowRemarks ?? []) {
    if (remark.stage === order.status) {
      const t = new Date(remark.at).getTime();
      if (Number.isFinite(t)) return t;
    }
  }
  return new Date(order.createdAt).getTime();
}

/** 按流程分组序 + 进入环节时间比较两单(行排序基准) */
function compareFlowOrder(a: Order, b: Order): number {
  const rankDiff = flowRowRank(a.status) - flowRowRank(b.status);
  if (rankDiff !== 0) return rankDiff;
  const entryDiff = currentStageEntryMs(a) - currentStageEntryMs(b);
  if (entryDiff !== 0) return entryDiff;
  return a.createdAt.localeCompare(b.createdAt);
}

/** 「下一环节格」的动作类型:直推确认 / 打开订单卡处理 / 无操作 */
type AdvanceSlotAction = "advance" | "card" | null;

/** 非管理员点击推进格时的提示 */
const NO_SLOT_PERMISSION_MSG = "仅管理员可在推进图中更新订单";

/**
 * 决定下一环节格的行为(仅管理员可点),与订单卡(OrderCard)语义对齐:
 * - 未派单:指派在订单卡内 → 开卡;
 * - 待量尺未确认接单:先确认接单 → 开卡;已接单可直接推进量尺;
 * - 待签约:发起/线下签约需表单 → 开卡;
 * - 已安装:发起/跳过验收在订单卡内 → 开卡;
 * - 其余(已量尺/已出图/已签约/已下单)可直接推进。
 */
function resolveAdvanceSlotAction(
  order: Order,
  editable: boolean,
): AdvanceSlotAction {
  if (!editable) return null;
  switch (order.status) {
    case "未派单":
      return "card";
    case "待量尺":
      return order.designerAcceptedAt ? "advance" : "card";
    case "待签约":
    case "已安装":
      return "card";
    default:
      return "advance";
  }
}

/** 下一环节格悬停提示(按动作类型给不同引导文案) */
function advanceSlotTitle(
  order: Order,
  action: Exclude<AdvanceSlotAction, null>,
): string {
  if (action === "card") {
    switch (order.status) {
      case "未派单":
        return "指派设计师(在订单卡中处理)";
      case "待量尺":
        return "先确认接单(在订单卡中处理)";
      case "待签约":
        return "签约流程(在订单卡中发起/线下签约)";
      default:
        return "验收流程(在订单卡中发起/跳过)";
    }
  }
  const next = FLOW_STAGE_ORDER[FLOW_STAGE_ORDER.indexOf(order.status as FlowOrderStatus) + 1];
  return next ? `推进为「${next}」` : "";
}

interface FlowProgressRow {
  order: Order;
  cells: FlowStageCell[];
}

interface ManagerFlowProgressPanelProps {
  orders: Order[];
  onOpenOrder: (order: Order) => void;
}

/** 进行中环节的虚线描边(叠加在达成格上方,或单独用于无日期的初始环节) */
function CurrentStageRing({
  dotClass,
}: {
  dotClass?: string | undefined;
}) {
  return (
    <span
      className="pointer-events-none absolute inset-[3px] z-[1] flex items-center justify-center rounded-[4px] border border-dashed"
      style={{ borderColor: "var(--label-tertiary)" }}
      title="当前环节 · 进行中"
    >
      {dotClass ? (
        <span className={`size-1.5 rounded-full ${dotClass}`} aria-hidden />
      ) : (
        <span className="sr-only">进行中</span>
      )}
    </span>
  );
}

/** 单个格子的内容:达成 = 阶段浅色填充 + 日期;进行中叠加虚线描边 */
function StageCellContent({ cell }: { cell: FlowStageCell }) {
  if (cell.doneIso) {
    return (
      <>
        <span
          className={`flex h-full w-full items-center justify-center ${FLOW_STAGE_CELL_FILL[cell.status]}`}
        >
          <span className="px-0.5 text-[11px] font-semibold leading-none tabular-nums">
            {formatOrderDateDay(cell.doneIso)}
          </span>
        </span>
        {cell.isCurrent ? <CurrentStageRing /> : null}
      </>
    );
  }
  if (cell.isCurrent) {
    return <CurrentStageRing dotClass={STATUS_BAR_FILL[cell.status]} />;
  }
  return null;
}

/**
 * 流程推进图:每行一笔订单,横向表头按主流程名排列;
 * 订单到达某环节即填色并记录该环节达成日期,进行中环节以虚线标出。
 */
export function ManagerFlowProgressPanel({
  orders,
  onOpenOrder,
}: ManagerFlowProgressPanelProps) {
  const { user, staffRecords, designerHomeStoreIndex } = useAuth();
  const { advanceOrderStatus } = useOrders();
  const [statusGroup, setStatusGroup] = useState<StatusGroup>("all");
  const [storeFilter, setStoreFilter] = useState<StoreName | "全部">("全部");
  const [designerFilter, setDesignerFilter] = useState<string>("全部");
  const [dispatcherFilter, setDispatcherFilter] = useState<string>("全部");
  const [visibleLimit, setVisibleLimit] = useState<number>(PAGE_SIZE);
  /** 「推进为已下单」金额浮层 */
  const [amountTarget, setAmountTarget] = useState<Order | null>(null);
  const [amountDraft, setAmountDraft] = useState("");

  const storeOptions = useMemo(() => getDispatchStoreOptions(), []);

  /** 当前登录权限范围内可见的设计师 / 派单人名单(供人员筛选) */
  const personOptions = useMemo(() => {
    const scope = resolveReportPersonScope(user, orders, staffRecords);
    const personal = isPersonalAccess(user);
    const rosterDesigners = getEffectiveDesignerRoster(
      designerHomeStoreIndex,
      staffRecords,
    ).map((d) => d.name);
    const rosterDispatchers = getEffectiveDispatcherRoster(staffRecords).map(
      (d) => d.name,
    );
    // 个人权限账号只取自己订单中出现过的人员,避免列出权限外全名册
    return {
      designerNames:
        scope.designerNames ??
        (personal ? collectOrderPersonNames(orders, "designer") : rosterDesigners),
      dispatcherNames:
        scope.dispatcherNames ??
        (personal
          ? collectOrderPersonNames(orders, "dispatcher")
          : rosterDispatchers),
    };
  }, [user, orders, staffRecords, designerHomeStoreIndex]);

  /**
   * 行排序冻结:进入面板时按当时流程状态排定一次订单顺序;
   * 期间推进订单只刷新格子/徽标、不打断当前阅读位置;
   * 退出界面(组件卸载)后下次进入时按最新流程状态重新排序。
   */
  const [frozenOrderIds] = useState<string[]>(() =>
    [...orders].sort(compareFlowOrder).map((order) => order.id),
  );
  const frozenOrderIndex = useMemo(() => {
    const map = new Map<string, number>();
    frozenOrderIds.forEach((id, index) => map.set(id, index));
    return map;
  }, [frozenOrderIds]);

  const rows = useMemo<FlowProgressRow[]>(() => {
    return orders
      .map((order) => ({
        order,
        cells: buildFlowStageCells(order),
      }))
      .filter((row) => {
        if (
          storeFilter !== "全部" &&
          row.order.dispatchStore !== storeFilter
        ) {
          return false;
        }
        if (designerFilter !== "全部" && row.order.designer !== designerFilter) {
          return false;
        }
        if (
          dispatcherFilter !== "全部" &&
          normalizeDispatcherName(row.order.dispatcherName) !==
            normalizeDispatcherName(dispatcherFilter)
        ) {
          return false;
        }
        return matchStatusGroup(row.order.status, statusGroup);
      })
      .sort((a, b) => {
        const indexA = frozenOrderIndex.get(a.order.id);
        const indexB = frozenOrderIndex.get(b.order.id);
        if (indexA !== undefined && indexB !== undefined) {
          return indexA - indexB;
        }
        // 挂载后新出现的订单(如云同步新单)按当前流程规则排在末尾
        if (indexA !== undefined) return -1;
        if (indexB !== undefined) return 1;
        return compareFlowOrder(a.order, b.order);
      });
  }, [
    orders,
    frozenOrderIndex,
    storeFilter,
    designerFilter,
    dispatcherFilter,
    statusGroup,
  ]);

  // 分页渲染:限制 DOM 规模,避免大订单量时页面卡顿
  const visibleRows = useMemo(
    () => rows.slice(0, visibleLimit),
    [rows, visibleLimit],
  );

  /** 各流程列当前停留的在途单数(表头列计数,随筛选联动) */
  const stageLiveCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      counts.set(row.order.status, (counts.get(row.order.status) ?? 0) + 1);
    }
    return counts;
  }, [rows]);

  /** 点击「直推类」下一环节格:确认后推进;「已下单」需先录金额(其余动作型格子走 onOpenOrder 开卡) */
  const handleStageAdvance = (order: Order, next: FlowOrderStatus) => {
    if (next === "已下单") {
      setAmountDraft(resolvePrefilledOrderAmount(order));
      setAmountTarget(order);
      return;
    }
    const message =
      next === "已安装"
        ? "确认推进为「已安装」?将记录安装完成时间。"
        : `确认将订单推进为「${next}」?`;
    if (!window.confirm(message)) return;
    if (advanceOrderStatus(order.id)) {
      showStatusToast(formatStatusUpdatedLabel(next));
    } else {
      showStatusToast("操作未生效,请刷新后重试");
    }
  };

  /** 导出 CSV 明细(当前筛选结果) */
  const handleExportCsv = () => {
    downloadCsv(
      `流程推进图-明细-${stampForFilename()}.csv`,
      buildFlowProgressCsv(rows, designerHomeStoreIndex),
    );
    showStatusToast("已导出明细 CSV");
  };

  /** 快照:当前可见矩阵存为 PNG 图片 */
  const handleSnapshotPng = () => {
    const result = exportFlowProgressSnapshotPng({
      rows: visibleRows,
      liveCounts: stageLiveCount,
    });
    showStatusToast(
      result.exported > 0 ? "已保存图片快照" : "快照生成失败,请重试",
    );
  };

  /** 金额浮层确认:下单金额须大于 0 */
  const submitOrderAmount = () => {
    if (!amountTarget) return;
    const amount = Number(amountDraft);
    if (!Number.isFinite(amount) || amount <= 0) {
      showStatusToast("下单金额需大于 0");
      return;
    }
    const ok = advanceOrderStatus(amountTarget.id, { orderAmount: amount });
    if (ok) {
      showStatusToast(formatStatusUpdatedLabel("已下单"));
      setAmountTarget(null);
    } else {
      showStatusToast("操作未生效,请刷新后重试");
    }
  };

  return (
    <section
      className="vi-surface overflow-hidden"
      aria-labelledby="manager-progress-title"
    >
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[var(--separator)] px-4 py-3">
        <div className="min-w-0">
          <h2
            id="manager-progress-title"
            className="text-[17px] font-semibold"
            style={{ color: "var(--label-primary)" }}
          >
            流程推进图
          </h2>
          <p
            className="mt-0.5 text-[13px]"
            style={{ color: "var(--label-secondary)" }}
          >
            每行一笔订单 · 每列一个主流程 · 到达的环节填色并记录达成日期
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p
            className="text-sm tabular-nums"
            style={{ color: "var(--label-secondary)" }}
          >
            共 <span className="font-semibold">{rows.length}</span> 单
          </p>
          <Button variant="secondary" size="sm" onClick={handleExportCsv}>
            导出明细
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSnapshotPng}>
            快照
          </Button>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[var(--separator)] px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="vi-label-caps">状态</span>
          <div className="vi-segmented">
            {STATUS_GROUP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setStatusGroup(opt.value);
                  setVisibleLimit(PAGE_SIZE);
                }}
                className={`vi-segmented-item px-3 py-1.5 text-xs ${
                  statusGroup === opt.value ? "vi-segmented-item-active" : ""
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="vi-label-caps">设计师</span>
          <select
            className={TOOLBAR_SELECT_CLASS}
            value={designerFilter}
            onChange={(e) => {
              setDesignerFilter(e.target.value);
              setVisibleLimit(PAGE_SIZE);
            }}
            aria-label="设计师筛选"
          >
            <option value="全部">全部</option>
            {personOptions.designerNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="vi-label-caps">派单人</span>
          <select
            className={TOOLBAR_SELECT_CLASS}
            value={dispatcherFilter}
            onChange={(e) => {
              setDispatcherFilter(e.target.value);
              setVisibleLimit(PAGE_SIZE);
            }}
            aria-label="派单人筛选"
          >
            <option value="全部">全部</option>
            {personOptions.dispatcherNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="vi-label-caps">门店</span>
          <select
            className={TOOLBAR_SELECT_CLASS}
            value={storeFilter}
            onChange={(e) => {
              setStoreFilter(e.target.value as StoreName | "全部");
              setVisibleLimit(PAGE_SIZE);
            }}
            aria-label="门店筛选"
          >
            <option value="全部">全部</option>
            {storeOptions.map((store) => (
              <option key={store} value={store}>
                {store}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 推进矩阵 */}
      {rows.length === 0 ? (
        <div className="vi-empty-state m-4">
          <p className="text-sm" style={{ color: "var(--label-secondary)" }}>
            当前筛选下暂无订单
          </p>
          <p className="mt-1 text-[13px]" style={{ color: "var(--label-tertiary)" }}>
            可放宽状态分组或门店筛选
          </p>
        </div>
      ) : (
        <>
          <p
            className="pt-2 pr-4 text-right text-[10px] sm:hidden"
            style={{ color: "var(--label-tertiary)" }}
          >
            ← 左右滑动查看更多流程列
          </p>
          <div className="max-h-[65vh] overflow-auto">
            <div className="w-max min-w-full">
              {/* 表头:流程名列 */}
              <div
                className="sticky top-0 z-[2] flex border-b border-[var(--separator)]"
                style={{ backgroundColor: "var(--bg-grouped-secondary)" }}
              >
                <div
                  className="sticky left-0 z-[3] flex shrink-0 items-center justify-center border-r border-[var(--separator)]"
                  style={{ width: LABEL_WIDTH, height: HEADER_HEIGHT }}
                >
                  <span
                    className="text-[11px] font-medium whitespace-nowrap"
                    style={{ color: "var(--label-primary)" }}
                  >
                    项目名称
                  </span>
                </div>
                {FLOW_STAGE_ORDER.map((status, index) => {
                  const liveCount = stageLiveCount.get(status) ?? 0;
                  return (
                    <div
                      key={status}
                      className={`flex flex-1 items-center justify-center gap-1.5 ${
                        index > 0 ? "border-l border-[var(--separator)]" : ""
                      }`}
                      style={{
                        height: HEADER_HEIGHT,
                        minWidth: STAGE_COL_MIN_WIDTH,
                      }}
                      title={`当前处于「${FLOW_STAGE_DISPLAY[status]}」${liveCount} 单`}
                    >
                      <span
                        className={`size-2 rounded-full ${STATUS_BAR_FILL[status]}`}
                        aria-hidden
                      />
                      <span
                        className="text-[11px] font-medium whitespace-nowrap"
                        style={{ color: "var(--label-primary)" }}
                      >
                        {FLOW_STAGE_DISPLAY[status]}
                      </span>
                      <span
                        className="text-[10px] font-semibold tabular-nums"
                        style={{ color: "var(--label-tertiary)" }}
                      >
                        {liveCount}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 订单行 */}
              {visibleRows.map((row) => {
                const order = row.order;
                const flowIdx = FLOW_STAGE_ORDER.indexOf(
                  order.status as FlowOrderStatus,
                );
                // 下一环节列 = 当前环节的后继(未派单→待量尺…已安装→已验收;退单/已验收无下一环)
                const advanceIndex =
                  flowIdx >= 0 && flowIdx < FLOW_STAGE_ORDER.length - 1
                    ? flowIdx + 1
                    : -1;
                // 矩阵点格更新仅限管理员;其它角色点格提示无权限(行首订单卡入口不受限)
                const slotPending =
                  advanceIndex >= 0 && !row.cells[advanceIndex].doneIso;
                const slotAdmin = isAdminAccess(user);
                const slotAction = slotPending
                  ? resolveAdvanceSlotAction(order, slotAdmin)
                  : null;
                // 异常(超时/待确认接单/待退单/低评/跨店等)以行首红点标出
                const anomalyLabels = getOrderAnomalyMarkers(order, {
                  highlightCrossStore: true,
                  designerHomeStoreIndex,
                }).map((marker) => marker.label);
                return (
                  <div
                    key={order.id}
                    className="flex border-b border-[var(--separator)]"
                  >
                    <button
                      type="button"
                      onClick={() => onOpenOrder(order)}
                      className="sticky left-0 z-[1] flex shrink-0 cursor-pointer select-none items-center gap-2 border-r border-[var(--separator)] bg-[var(--bg-primary)] px-3 text-left transition-colors duration-[var(--duration-fast)] hover:bg-[var(--fill-quaternary)]"
                      style={{ width: LABEL_WIDTH, height: ROW_HEIGHT }}
                      title={`${order.address} · ${order.customerName}`}
                    >
                      <span className="flex min-w-0 flex-1 flex-col items-start justify-center">
                        <span
                          className="w-full truncate text-[13px] font-medium"
                          style={{ color: "var(--label-primary)" }}
                        >
                          {order.address}
                        </span>
                        <span
                          className="w-full truncate text-[11px]"
                          style={{ color: "var(--label-tertiary)" }}
                        >
                          {order.customerName}
                        </span>
                      </span>
                      <span className="relative shrink-0">
                        <StatusBadge status={order.status} />
                        {anomalyLabels.length > 0 ? (
                          <span
                            title={`异常：${anomalyLabels.join("、")}`}
                            aria-label={`异常：${anomalyLabels.join("、")}`}
                            className="absolute -top-1 -right-1 size-2 rounded-full ring-2 ring-[var(--bg-primary)]"
                            style={{ backgroundColor: "var(--system-red)" }}
                          />
                        ) : null}
                      </span>
                    </button>
                    {row.cells.map((cell, index) => {
                      const isAdvanceSlot = index === advanceIndex && slotPending;
                      const slotEnabled = isAdvanceSlot && slotAdmin;
                      return (
                        <div
                          key={cell.status}
                          className={`relative flex-1 ${
                            index > 0
                              ? "border-l border-[var(--separator)]"
                              : ""
                          } ${
                            slotEnabled
                              ? "cursor-pointer transition-colors duration-[var(--duration-fast)] hover:bg-[var(--fill-quaternary)]"
                              : isAdvanceSlot
                                ? "cursor-pointer"
                                : ""
                          }`}
                          style={{
                            height: ROW_HEIGHT,
                            minWidth: STAGE_COL_MIN_WIDTH,
                          }}
                          onClick={
                            isAdvanceSlot
                              ? () => {
                                  if (!slotAdmin) {
                                    window.alert(NO_SLOT_PERMISSION_MSG);
                                    return;
                                  }
                                  if (slotAction === "advance") {
                                    handleStageAdvance(order, cell.status);
                                  } else if (slotAction === "card") {
                                    onOpenOrder(order);
                                  }
                                }
                              : undefined
                          }
                          title={
                            isAdvanceSlot
                              ? slotAdmin
                                ? advanceSlotTitle(order, slotAction!)
                                : "仅管理员可更新"
                              : undefined
                          }
                        >
                          <StageCellContent cell={cell} />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
          {rows.length > visibleLimit ? (
            <div className="border-t border-[var(--separator)] px-4 py-2">
              <button
                type="button"
                onClick={() => setVisibleLimit((v) => v + PAGE_SIZE)}
                className="w-full rounded-lg border border-[var(--separator)] bg-[var(--bg-secondary)] py-2 text-sm font-medium transition-colors duration-[var(--duration-fast)] hover:bg-[var(--fill-quaternary)]"
                style={{ color: "var(--label-primary)" }}
              >
                显示更多（已显示 {visibleLimit} / {rows.length} 单）
              </button>
            </div>
          ) : null}
        </>
      )}

      {/* 图例 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--separator)] px-4 py-2.5">
        <span
          className="flex items-center gap-1.5 text-[11px]"
          style={{ color: "var(--label-secondary)" }}
        >
          <span
            className="size-2.5 rounded-[3px] bg-[var(--fill-tertiary)]"
            aria-hidden
          />
          已到达环节 · 格内为该环节达成日期
        </span>
        <span
          className="flex items-center gap-1.5 text-[11px]"
          style={{ color: "var(--label-secondary)" }}
        >
          <span
            className="size-2.5 rounded-[3px] border border-dashed"
            style={{ borderColor: "var(--label-tertiary)" }}
            aria-hidden
          />
          当前环节 · 进行中
        </span>
        <span
          className="ml-auto flex items-center gap-1.5 text-[11px]"
          style={{ color: "var(--label-tertiary)" }}
        >
          点击空白格快捷推进 · 签约/验收等动作打开订单卡 · 行首可查看订单卡
        </span>
      </div>

      {/* 下单金额浮层 */}
      {amountTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4"
          onClick={() => setAmountTarget(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="录入下单金额"
            className="vi-surface w-full max-w-sm rounded-xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p
              className="text-[15px] font-semibold"
              style={{ color: "var(--label-primary)" }}
            >
              推进为「已下单」
            </p>
            <p
              className="mt-0.5 truncate text-[13px]"
              style={{ color: "var(--label-secondary)" }}
            >
              {amountTarget.address} · {amountTarget.customerName}
            </p>
            <label className="mt-3 block">
              <span className="vi-label-caps">下单金额（元）</span>
              <input
                autoFocus
                type="number"
                min={0}
                step={100}
                className="vi-field mt-1 w-full text-sm"
                value={amountDraft}
                onChange={(e) => setAmountDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    submitOrderAmount();
                  } else if (e.key === "Escape") {
                    setAmountTarget(null);
                  }
                }}
                aria-label="下单金额（元）"
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAmountTarget(null)}
              >
                取消
              </Button>
              <Button variant="primary" size="sm" onClick={submitOrderAmount}>
                确认下单
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
