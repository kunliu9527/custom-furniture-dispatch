import {
  buildDesignerHomeStoreIndex,
  getEffectiveDesignerHomeStore,
  getEffectiveDesignersInStores,
} from "./designer-staff-store";
import { IN_PROGRESS_STATUSES } from "./designer-performance";
import { isRefundStatus } from "./order-utils";
import type { StaffRecord } from "./staff-roster";
import type { FlowOrderStatus, Order, StoreName } from "./types";
import { filterOrdersByWeek } from "./week-filter";
import { orderRemarksContainText } from "./workflow-remarks";

/** 已下单及之后的主流程状态（「下单」列口径，与 DesignerView 一致） */
const ORDERED_STATUSES: FlowOrderStatus[] = ["已下单", "已安装", "已验收"];

/** 「前置」标记关键字：流程备注含该词，或量尺前已交定标记 */
const PRE_ORDER_KEYWORD = "前置";

/** 前置单项目名最多展示个数 */
const PRE_ORDER_LABEL_LIMIT = 2;

export interface DesignerBriefRow {
  name: string;
  /** 当前在途：处于待量尺→已签约的订单数（快照口径） */
  inProgress: number;
  /** 前置：在途单中备注含「前置」或已打前置交定标记的订单数 */
  preOrder: number;
  /** 下单：本周期内到达已下单及之后的订单数 */
  ordered: number;
  /** 前置单项目名（客户姓名，最多 2 个） */
  preOrderLabels: string[];
}

export interface StoreDesignerBrief {
  store: string;
  designers: DesignerBriefRow[];
  totals: { inProgress: number; preOrder: number; ordered: number };
}

export interface StoreDesignerBriefOptions {
  /** 本周参照时间（与简报统计周期一致） */
  weekRef?: Date;
  /** 门店范围标签，如「东岸天冠、高桥天冠」；有值时按其中顺序与门店名分组 */
  storeScopeLabel?: string | null;
  /** 仅统计这些设计师（个人简报范围） */
  designerNames?: string[] | null;
}

function isInProgressStatus(order: Order): boolean {
  return IN_PROGRESS_STATUSES.includes(order.status as FlowOrderStatus);
}

function isOrderedStatus(order: Order): boolean {
  return (
    !isRefundStatus(order.status) &&
    ORDERED_STATUSES.includes(order.status as FlowOrderStatus)
  );
}

function isPreOrder(order: Order): boolean {
  return (
    Boolean(order.preMeasureDeposit) ||
    orderRemarksContainText(order, PRE_ORDER_KEYWORD)
  );
}

function orderLabel(order: Order): string {
  return order.customerName?.trim() || order.address?.trim() || order.id;
}

function splitStoreScope(storeScopeLabel: string | null | undefined): string[] {
  return (storeScopeLabel ?? "")
    .split("、")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * 设计简报：按设计师归属门店分组，逐设计师统计 在途 / 前置 / 下单 并给出门店合计。
 * - 在途、前置取当前快照口径（传入的全部范围内订单）。
 * - 下单取本周期内到达已下单及之后的订单（与周报周期一致）。
 */
export function buildStoreDesignerBrief(
  orders: Order[],
  staffRecords: StaffRecord[] = [],
  options: StoreDesignerBriefOptions = {},
): StoreDesignerBrief[] {
  const { weekRef = new Date(), storeScopeLabel = null, designerNames = null } =
    options;

  const allowed =
    designerNames && designerNames.length > 0 ? new Set(designerNames) : null;
  const weekOrderIds = new Set(
    filterOrdersByWeek(orders, weekRef).orders.map((o) => o.id),
  );

  const homeStoreIndex = buildDesignerHomeStoreIndex(staffRecords);

  const designerOrders = new Map<string, { all: Order[]; week: Order[] }>();
  for (const order of orders) {
    const designer = order.designer;
    if (!designer) continue;
    if (allowed && !allowed.has(designer)) continue;
    let entry = designerOrders.get(designer);
    if (!entry) {
      entry = { all: [], week: [] };
      designerOrders.set(designer, entry);
    }
    entry.all.push(order);
    if (weekOrderIds.has(order.id)) entry.week.push(order);
  }

  const scopedStores = splitStoreScope(storeScopeLabel);

  // 门店分组与顺序：有范围标签时按其顺序；否则按订单量降序（仅包含有订单的设计师）
  const storeNames: StoreName[] = [];
  if (scopedStores.length > 0) {
    for (const store of scopedStores) {
      if (!storeNames.includes(store)) storeNames.push(store);
    }
  } else {
    const orderCountByStore = new Map<string, number>();
    for (const [designer, entry] of designerOrders) {
      const store = getEffectiveDesignerHomeStore(designer, homeStoreIndex);
      orderCountByStore.set(store, (orderCountByStore.get(store) ?? 0) + entry.all.length);
    }
    storeNames.push(
      ...[...orderCountByStore.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hans-CN"))
        .map(([store]) => store),
    );
  }

  const briefs: StoreDesignerBrief[] = [];
  for (const store of storeNames) {
    // 有范围标签（门店经理）时保留全量名册含 0 活动设计师；全公司范围仅列有单设计师
    const rosterNames: string[] =
      scopedStores.length > 0
        ? getEffectiveDesignersInStores([store], homeStoreIndex, staffRecords).map(
            (d) => d.name,
          )
        : [];

    const names: string[] = [];
    for (const name of rosterNames) {
      if (!names.includes(name)) names.push(name);
    }
    for (const designer of designerOrders.keys()) {
      if (names.includes(designer)) continue;
      if (getEffectiveDesignerHomeStore(designer, homeStoreIndex) !== store) continue;
      names.push(designer);
    }

    const designers: DesignerBriefRow[] = [];
    for (const name of names) {
      const entry = designerOrders.get(name);
      if (!entry && scopedStores.length === 0) continue;
      const all = entry?.all ?? [];
      const inProgressOrders = all.filter(isInProgressStatus);
      const preOrders = inProgressOrders.filter(isPreOrder);
      designers.push({
        name,
        inProgress: inProgressOrders.length,
        preOrder: preOrders.length,
        ordered: (entry?.week ?? []).filter(isOrderedStatus).length,
        preOrderLabels: preOrders
          .map(orderLabel)
          .slice(0, PRE_ORDER_LABEL_LIMIT),
      });
    }

    if (designers.length === 0) continue;

    briefs.push({
      store,
      designers,
      totals: designers.reduce(
        (acc, d) => ({
          inProgress: acc.inProgress + d.inProgress,
          preOrder: acc.preOrder + d.preOrder,
          ordered: acc.ordered + d.ordered,
        }),
        { inProgress: 0, preOrder: 0, ordered: 0 },
      ),
    });
  }

  return briefs;
}
