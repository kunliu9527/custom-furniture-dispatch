import { STATUS_LABELS } from "./constants";
import type { Order, OrderStatus, WorkflowRemarkEntry } from "./types";

/** 备注流程顺序（派单录入 → 主流程 → 退单） */
export const WORKFLOW_REMARK_STAGE_ORDER: WorkflowRemarkEntry["stage"][] = [
  "派单录入",
  "未派单",
  "待量尺",
  "已量尺",
  "已出图",
  "待签约",
  "已签约",
  "已下单",
  "已安装",
  "待退单",
  "已退单",
];

function stageSortIndex(stage: WorkflowRemarkEntry["stage"]): number {
  const idx = WORKFLOW_REMARK_STAGE_ORDER.indexOf(stage);
  return idx === -1 ? WORKFLOW_REMARK_STAGE_ORDER.length : idx;
}

export function createWorkflowRemarkEntry(
  stage: WorkflowRemarkEntry["stage"],
  text: string,
  at?: string,
): WorkflowRemarkEntry {
  return {
    stage,
    text: text.trim(),
    at: at ?? new Date().toISOString(),
  };
}

export function normalizeWorkflowRemarkEntries(
  raw: unknown,
): WorkflowRemarkEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const r = item as Record<string, unknown>;
      const stage = String(r.stage ?? "待量尺") as WorkflowRemarkEntry["stage"];
      const text = String(r.text ?? "").trim();
      const at = String(r.at ?? new Date().toISOString());
      if (!text) return null;
      return createWorkflowRemarkEntry(stage, text, at);
    })
    .filter((e): e is WorkflowRemarkEntry => e !== null);
}

/** 合并 legacy workflowRemark 与流程备注列表 */
export function getOrderWorkflowRemarks(order: Order): WorkflowRemarkEntry[] {
  const list = [...(order.workflowRemarks ?? [])];
  const legacy = order.workflowRemark?.trim();
  if (
    legacy &&
    !list.some((e) => e.text === legacy || e.text.includes(legacy))
  ) {
    list.push(
      createWorkflowRemarkEntry(
        order.status as WorkflowRemarkEntry["stage"],
        legacy,
        order.createdAt,
      ),
    );
  }
  return sortWorkflowRemarks(list);
}

export function sortWorkflowRemarks(
  entries: WorkflowRemarkEntry[],
): WorkflowRemarkEntry[] {
  return [...entries].sort((a, b) => {
    const stageDiff = stageSortIndex(a.stage) - stageSortIndex(b.stage);
    if (stageDiff !== 0) return stageDiff;
    return new Date(a.at).getTime() - new Date(b.at).getTime();
  });
}

/** 任一流程备注含关键字（含 legacy workflowRemark） */
export function orderRemarksContainText(order: Order, keyword: string): boolean {
  return getOrderWorkflowRemarks(order).some((e) => e.text.includes(keyword));
}

/** 备注含「前置」时初始定金为 0；若已补交定金则不再强制清零 */
export function applyDepositRuleForQianzhiRemark(order: Order): Order {
  if (!orderRemarksContainText(order, "前置")) return order;
  if (order.deposit > 0 || order.preMeasureDeposit) return order;
  return order;
}

export function reconcileOrderBusinessRules(order: Order): Order {
  return applyDepositRuleForQianzhiRemark(order);
}

export function appendWorkflowRemark(
  order: Order,
  stage: WorkflowRemarkEntry["stage"],
  text: string,
): Order {
  const trimmed = text.trim();
  if (!trimmed) return order;
  const entry = createWorkflowRemarkEntry(stage, trimmed);
  return reconcileOrderBusinessRules({
    ...order,
    workflowRemarks: sortWorkflowRemarks([
      ...(order.workflowRemarks ?? []),
      entry,
    ]),
    workflowRemark: null,
  });
}

export function formatWorkflowRemarkDisplay(order: Order): string {
  const entries = getOrderWorkflowRemarks(order);
  if (entries.length === 0) return "";
  return entries
    .map((e) => {
      const label =
        e.stage === "派单录入"
          ? "派单录入"
          : (STATUS_LABELS[e.stage as OrderStatus] ?? e.stage);
      return `【${label}】${e.text}`;
    })
    .join("；");
}
