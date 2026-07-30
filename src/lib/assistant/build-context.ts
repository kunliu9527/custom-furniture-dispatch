import type { Order, OrderStatus } from "@/lib/types";
import type { SessionUser } from "@/lib/permissions";
import { ACCESS_LEVEL_LABELS } from "@/lib/staff-access";
import { ROLE_LABELS } from "@/lib/auth-users";
import {
  describeAssistantDataScope,
  resolveAssistantScopedOrders,
} from "./scope";

const STATUS_ORDER: OrderStatus[] = [
  "未派单",
  "待量尺",
  "已量尺",
  "已出图",
  "待签约",
  "已签约",
  "已下单",
  "已安装",
  "已验收",
  "待退单",
  "已退单",
];

function countByStatus(orders: Order[]): string {
  const map = new Map<OrderStatus, number>();
  for (const o of orders) {
    map.set(o.status, (map.get(o.status) ?? 0) + 1);
  }
  return STATUS_ORDER.filter((s) => (map.get(s) ?? 0) > 0)
    .map((s) => `${s} ${map.get(s)}`)
    .join("；");
}

function recentLines(orders: Order[], limit: number): string[] {
  const sorted = [...orders].sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || ""),
  );
  return sorted.slice(0, limit).map((o) => {
    const parts = [
      o.id,
      o.customerName || "未名客户",
      o.dispatchStore || "",
      o.status,
      o.designer ? `设计:${o.designer}` : "",
      o.dispatcherName ? `派单:${o.dispatcherName}` : "",
    ].filter(Boolean);
    return `- ${parts.join(" | ")}`;
  });
}

/**
 * 将「已按权限裁剪」的订单压成给大模型的只读上下文（控制体积）。
 */
export function buildAssistantContextText(
  allOrders: Order[],
  user: SessionUser,
  options?: { sampleLimit?: number },
): { scopeLabel: string; contextText: string; orderCount: number } {
  const scoped = resolveAssistantScopedOrders(allOrders, user);
  const scopeLabel = describeAssistantDataScope(user);
  const sampleLimit = options?.sampleLimit ?? 45;

  const lines: string[] = [
    `操作者：${user.displayName}（账号 ${user.username}）`,
    `岗位：${user.position || ROLE_LABELS[user.role]}`,
    `权限级别：${ACCESS_LEVEL_LABELS[user.accessLevel]}`,
    `数据范围：${scopeLabel}`,
    `可见订单数：${scoped.length}`,
    `状态分布：${countByStatus(scoped) || "无"}`,
    "",
    `近期订单样本（最多 ${sampleLimit} 条，含单号/客户/门店/状态）：`,
    ...recentLines(scoped, sampleLimit),
  ];

  if (scoped.length > sampleLimit) {
    lines.push(
      `…另有 ${scoped.length - sampleLimit} 条未逐条列出，可依据状态分布作汇总回答。`,
    );
  }

  return {
    scopeLabel,
    contextText: lines.join("\n"),
    orderCount: scoped.length,
  };
}
