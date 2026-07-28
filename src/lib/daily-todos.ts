import {
  anomalyLabelText,
  buildAnomalyTodosSnapshot,
  pickPrimaryAnomalyLabel,
} from "./anomaly-todos";
import { buildPendingConfirmSnapshot } from "./pending-confirm";
import { buildFollowUpSnapshot } from "./follow-up";
import { getStageTimeoutAlert } from "./stage-intervals";
import { resolveOrderDisplayName } from "./order-remark";
import {
  getPendingAcceptanceOrders,
  isAcceptanceOverdue,
  needsDesignerAcceptance,
} from "./designer-load";
import {
  hasFullOrderScope,
  isAcceptanceManagerAccess,
  scopeOrdersForAdminBoard,
  scopeOrdersForUser,
  type SessionUser,
} from "./permissions";
import { managerAnomalyTodosHref } from "./manager-deep-link";
import type { Order } from "./types";

export interface DailyTodoItem {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  priority: number;
  urgent: boolean;
}

export interface RoleDailyTodosSnapshot {
  items: DailyTodoItem[];
  totalCount: number;
  headline: string;
}

const MAX_ITEMS = 5;

function sortAndCap(items: DailyTodoItem[]): DailyTodoItem[] {
  return [...items]
    .sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title, "zh-CN"))
    .slice(0, MAX_ITEMS);
}

function scopedOrders(orders: Order[], user: SessionUser | null): Order[] {
  if (!user) return [];
  if (
    user.accessLevel === "design_manager" ||
    user.accessLevel === "general_manager" ||
    user.accessLevel === "admin" ||
    user.accessLevel === "store_manager"
  ) {
    return scopeOrdersForAdminBoard(orders, user);
  }
  return scopeOrdersForUser(orders, user);
}

export function buildRoleDailyTodos(
  user: SessionUser | null,
  orders: Order[],
  username: string | undefined,
  now = new Date(),
): RoleDailyTodosSnapshot {
  if (!user) {
    return { items: [], totalCount: 0, headline: "登录后查看今日必做" };
  }

  const scoped = scopedOrders(orders, user);
  const items: DailyTodoItem[] = [];

  const isManagerLike =
    hasFullOrderScope(user) ||
    user.accessLevel === "design_manager" ||
    user.accessLevel === "general_manager" ||
    user.accessLevel === "store_manager";

  if (isManagerLike) {
    const anomaly = buildAnomalyTodosSnapshot(orders, username, now);
    for (const row of anomaly.orderRows.slice(0, MAX_ITEMS)) {
      const primary = pickPrimaryAnomalyLabel(row);
      items.push({
        id: `anomaly:${row.orderId}`,
        title: `${anomalyLabelText(primary)} · ${row.customerName}`,
        subtitle: `${row.designer} · ${row.status} · ${row.dispatchStore}`,
        href: managerAnomalyTodosHref({ orderId: row.orderId }),
        priority: primary.source === "pending" ? 1 : 2,
        urgent: primary.source === "pending",
      });
    }
    for (const cap of anomaly.capacityRows.slice(0, 2)) {
      items.push({
        id: `capacity:${cap.designer}`,
        title: cap.label,
        subtitle: cap.hint,
        href: `/admin?view=dispatch&designer=${encodeURIComponent(cap.designer)}`,
        priority: 3,
        urgent: true,
      });
    }
    const capped = sortAndCap(items);
    return {
      items: capped,
      totalCount: anomaly.totalCount,
      headline:
        anomaly.totalCount > 0
          ? `全公司待处理 ${anomaly.totalCount} 项，优先跟进前 ${capped.length} 项`
          : "暂无工单待办，可查看本周简报",
    };
  }

  if (user.role === "dispatcher") {
    const undispatched = scoped.filter((o) => o.status === "未派单");
    for (const order of undispatched.slice(0, 3)) {
      items.push({
        id: `undispatched:${order.id}`,
        title: `未派单 · ${resolveOrderDisplayName(order)}`,
        subtitle: order.dispatchStore,
        href: `/admin?view=dispatch&orderId=${encodeURIComponent(order.id)}`,
        priority: 1,
        urgent: true,
      });
    }
    const signTimeout = scoped.filter(
      (o) => o.status === "待签约" && getStageTimeoutAlert(o),
    );
    for (const order of signTimeout.slice(0, 2)) {
      items.push({
        id: `sign:${order.id}`,
        title: `签约超时 · ${resolveOrderDisplayName(order)}`,
        subtitle: order.designer ?? "未指派设计师",
        href: `/admin?view=orderLookup&orderId=${encodeURIComponent(order.id)}`,
        priority: 2,
        urgent: true,
      });
    }
    const pending = buildPendingConfirmSnapshot(scoped, now);
    const refunds = pending.orderItems.filter((i) => i.kind === "pending-refund");
    for (const item of refunds.slice(0, 2)) {
      items.push({
        id: `refund:${item.orderId}`,
        title: item.label,
        subtitle: item.customerName,
        href: `/admin?view=orderLookup&orderId=${encodeURIComponent(item.orderId)}`,
        priority: 3,
        urgent: false,
      });
    }
    const capped = sortAndCap(items);
    return {
      items: capped,
      totalCount: undispatched.length + signTimeout.length + refunds.length,
      headline:
        capped.length > 0
          ? `你有 ${undispatched.length} 笔未派单、${signTimeout.length} 笔签约超时`
          : "今日派单跟进正常",
    };
  }

  if (user.role === "designer") {
    const mine = scoped.filter((o) => o.designer === user.displayName);
    for (const order of getPendingAcceptanceOrders(mine)) {
      items.push({
        id: `accept:${order.id}`,
        title: isAcceptanceOverdue(order, now) ? "接单超时" : "待确认接单",
        subtitle: resolveOrderDisplayName(order),
        href: `/designer?orderId=${encodeURIComponent(order.id)}`,
        priority: 1,
        urgent: isAcceptanceOverdue(order, now),
      });
    }
    for (const order of mine) {
      if (!needsDesignerAcceptance(order) && getStageTimeoutAlert(order)) {
        items.push({
          id: `timeout:${order.id}`,
          title: `流程超时 · ${getStageTimeoutAlert(order)}`,
          subtitle: resolveOrderDisplayName(order),
          href: `/designer?orderId=${encodeURIComponent(order.id)}`,
          priority: 2,
          urgent: true,
        });
      }
    }
    const inProgress = mine.filter(
      (o) =>
        o.status === "待量尺" ||
        o.status === "已量尺" ||
        o.status === "已出图" ||
        o.status === "待签约",
    );
    if (items.length < MAX_ITEMS && inProgress.length > 0) {
      const order = inProgress[0]!;
      items.push({
        id: `progress:${order.id}`,
        title: `在途跟进 · ${order.status}`,
        subtitle: resolveOrderDisplayName(order),
        href: `/designer?orderId=${encodeURIComponent(order.id)}`,
        priority: 4,
        urgent: false,
      });
    }
    const capped = sortAndCap(items);
    return {
      items: capped,
      totalCount: items.length,
      headline:
        capped.length > 0
          ? `设计师今日必做 ${capped.length} 项`
          : "在途订单正常，继续保持跟进",
    };
  }

  if (isAcceptanceManagerAccess(user)) {
    const lag = buildFollowUpSnapshot(orders, now).items.filter(
      (i) => i.kind === "acceptance-lag" || i.kind === "install-lag",
    );
    for (const item of lag.slice(0, MAX_ITEMS)) {
      items.push({
        id: `delivery:${item.orderId}`,
        title: item.label,
        subtitle: item.customerName,
        href: `/delivery?orderId=${encodeURIComponent(item.orderId)}`,
        priority: item.kind === "acceptance-lag" ? 1 : 2,
        urgent: item.kind === "acceptance-lag",
      });
    }
    const capped = sortAndCap(items);
    return {
      items: capped,
      totalCount: lag.length,
      headline:
        lag.length > 0
          ? `${lag.length} 笔安装/验收需跟进`
          : "交付验收正常",
    };
  }

  return {
    items: [],
    totalCount: 0,
    headline: "暂无待办",
  };
}

/** 企微每日待办正文（全公司口径） */
export function formatDailyTodosText(
  orders: Order[],
  now = new Date(),
): string {
  const dateLabel = now.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  const pending = buildPendingConfirmSnapshot(orders, now);
  const followUp = buildFollowUpSnapshot(orders, now);
  const anomaly = buildAnomalyTodosSnapshot(orders, undefined, now);

  const lines = [
    `【派单系统·每日待办】${dateLabel}`,
    "",
    `待确认：${pending.totalCount} 项（接单/未派单/退单/超额）`,
    `流程跟进：${followUp.totalCount} 项`,
    `异常汇总：${anomaly.totalCount} 项`,
  ];

  if (pending.orderItems.length > 0) {
    lines.push("", "— 待确认 —");
    for (const item of pending.orderItems.slice(0, 8)) {
      lines.push(
        `· ${item.label} · ${item.customerName} · ${item.designer} · ${item.dispatchStore}`,
      );
    }
    if (pending.orderItems.length > 8) {
      lines.push(`… 另有 ${pending.orderItems.length - 8} 笔`);
    }
  }

  if (followUp.items.length > 0) {
    lines.push("", "— 流程跟进 —");
    const topKinds = followUp.summaryParts.slice(0, 6);
    for (const part of topKinds) {
      lines.push(`· ${part}`);
    }
  }

  if (anomaly.orderRows.length > 0) {
    lines.push("", "— 重点异常 —");
    for (const row of anomaly.orderRows.slice(0, 6)) {
      const primary = pickPrimaryAnomalyLabel(row);
      lines.push(
        `· ${anomalyLabelText(primary)} · ${row.customerName} · ${row.designer}`,
      );
    }
  }

  if (pending.designerItems.length > 0) {
    lines.push("", "— 设计师在途已满 —");
    for (const item of pending.designerItems.slice(0, 4)) {
      lines.push(`· ${item.designer} · ${item.hint}`);
    }
  }

  lines.push("", "请登录系统处理 → 项目进程管理 / 工单待办");
  return lines.join("\n");
}
