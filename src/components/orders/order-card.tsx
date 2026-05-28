"use client";

import { AssignmentInfo } from "@/components/orders/assignment-info";
import { StatusBadge } from "@/components/orders/status-badge";
import { Button } from "@/components/ui/button";
import { DeleteOrderButton } from "@/components/orders/delete-order-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AdvanceOrderOptions } from "@/context/orders-context";
import { formatWorkflowRemark } from "@/lib/order-remark";
import { useAuth } from "@/context/auth-context";
import {
  getEffectiveDesignerHomeStore,
  isCrossStoreOrderForDesigner,
} from "@/lib/designer-staff-store";
import {
  formatDeposit,
} from "@/lib/designers";
import {
  formatAfterSalesAmount,
  formatBudget,
  formatOrderAmount,
  formatSpaces,
} from "@/lib/order-format";
import { hasAfterSales } from "@/lib/after-sales-utils";
import { hasBeenTransferred } from "@/lib/transfer-utils";
import {
  formatOrderDate,
  getNextStatus,
  getPreviousStatus,
  canMarkPendingRefund,
  canRevertStatus,
  isRefundStatus,
} from "@/lib/order-utils";
import {
  formatIntervalDays,
  formatTotalElapsedDisplay,
  getStageTimeoutAlert,
} from "@/lib/stage-intervals";
import { IssueTagsEditor } from "@/components/shared/issue-tags-editor";
import {
  isAcceptanceOverdue,
  needsDesignerAcceptance,
} from "@/lib/designer-load";
import type { Order, OrderIssueTag } from "@/lib/types";
import { FormEvent, useState } from "react";

interface OrderCardProps {
  order: Order;
  showDesigner?: boolean;
  highlightCrossStore?: boolean;
  readOnly?: boolean;
  onAdvanceStatus?: (id: string, options?: number | AdvanceOrderOptions) => void;
  onAddWorkflowRemark?: (id: string, text: string) => void;
  onRevertStatus?: (id: string) => void;
  onMarkPendingRefund?: (
    id: string,
    remark?: string,
    issueTags?: OrderIssueTag[],
  ) => void;
  onConfirmRefund?: (
    id: string,
    remark?: string,
    issueTags?: OrderIssueTag[],
  ) => void;
  onConfirmDesignerAccept?: (id: string) => void;
  showAcceptAction?: boolean;
  showAfterSales?: boolean;
  canRevertOrder?: (order: Order) => boolean;
  canEditRemark?: (order: Order) => boolean;
  onDeleteOrder?: (id: string) => void;
}

export function OrderCard({
  order,
  showDesigner = true,
  highlightCrossStore = false,
  readOnly = false,
  onAdvanceStatus,
  onAddWorkflowRemark,
  onRevertStatus,
  onMarkPendingRefund,
  onConfirmRefund,
  onConfirmDesignerAccept,
  showAcceptAction = false,
  showAfterSales = false,
  canRevertOrder,
  canEditRemark: canEditRemarkCheck,
  onDeleteOrder,
}: OrderCardProps) {
  const { designerHomeStoreIndex } = useAuth();
  const nextStatus = getNextStatus(order.status);
  const requiresOrderAmount = nextStatus === "已下单";
  const [showRefundPanel, setShowRefundPanel] = useState(false);
  const [refundTags, setRefundTags] = useState<OrderIssueTag[]>([]);
  const pendingAccept =
    showAcceptAction && needsDesignerAcceptance(order);
  const acceptOverdue = pendingAccept && isAcceptanceOverdue(order);
  const canAdvance =
    !readOnly &&
    !pendingAccept &&
    Boolean(onAdvanceStatus && nextStatus && !isRefundStatus(order.status));
  const canMarkRefund =
    !readOnly &&
    Boolean(onMarkPendingRefund && canMarkPendingRefund(order.status));
  const canConfirmRefund =
    !readOnly &&
    Boolean(onConfirmRefund && order.status === "待退单");
  const canDelete = !readOnly && Boolean(onDeleteOrder);
  const canRevert =
    !readOnly &&
    Boolean(onRevertStatus && canRevertStatus(order.status)) &&
    (canRevertOrder?.(order) ?? true);
  const previousStatus = getPreviousStatus(order.status);
  const crossStore =
    highlightCrossStore &&
    isCrossStoreOrderForDesigner(
      order.dispatchStore,
      order.designer,
      designerHomeStoreIndex,
    );
  const designerStore = getEffectiveDesignerHomeStore(
    order.designer,
    designerHomeStoreIndex,
  );

  const [showOrderAmountForm, setShowOrderAmountForm] = useState(false);
  const [orderAmountInput, setOrderAmountInput] = useState("");
  const [amountError, setAmountError] = useState("");
  const [remarkDraft, setRemarkDraft] = useState("");
  const [remarkSaved, setRemarkSaved] = useState(false);

  const remarkSummary = formatWorkflowRemark(order);
  const canEditRemark =
    !readOnly &&
    (canEditRemarkCheck?.(order) ?? true) &&
    Boolean(onAddWorkflowRemark || onAdvanceStatus);

  function handleAdvanceClick() {
    if (requiresOrderAmount) {
      setShowOrderAmountForm(true);
      setAmountError("");
      return;
    }
    submitAdvance({});
  }

  function submitAdvance(opts: AdvanceOrderOptions) {
    const remark = remarkDraft.trim();
    onAdvanceStatus?.(order.id, {
      ...opts,
      remark: remark || opts.remark,
    });
    setRemarkDraft("");
  }

  function handleSaveRemark() {
    const text = remarkDraft.trim();
    if (!text || !onAddWorkflowRemark) return;
    onAddWorkflowRemark(order.id, text);
    setRemarkDraft("");
    setRemarkSaved(true);
    window.setTimeout(() => setRemarkSaved(false), 2000);
  }

  function handleOrderAmountSubmit(e: FormEvent) {
    e.preventDefault();
    const amount = Number(orderAmountInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setAmountError("请填写有效的下单金额（大于 0）");
      return;
    }
    submitAdvance({ orderAmount: amount });
    setShowOrderAmountForm(false);
    setOrderAmountInput("");
    setAmountError("");
  }

  function handleCancelOrderAmount() {
    setShowOrderAmountForm(false);
    setOrderAmountInput("");
    setAmountError("");
  }

  const hasOrderAmount =
    order.orderAmount != null && order.orderAmount > 0;
  const timeoutAlert = getStageTimeoutAlert(order);
  const totalElapsed = formatTotalElapsedDisplay(order);
  const intervals = order.stageIntervalDays;

  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`text-base font-semibold ${timeoutAlert ? "text-red-600" : "text-slate-900"}`}
            >
              {order.customerName}
            </h3>
            {timeoutAlert ? (
              <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 ring-1 ring-red-200">
                {timeoutAlert}
              </span>
            ) : null}
            <StatusBadge status={order.status} />
            {crossStore ? (
              <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 ring-1 ring-red-200">
                跨店派单
              </span>
            ) : null}
            {hasBeenTransferred(order) ? (
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                已转派
              </span>
            ) : null}
            {pendingAccept ? (
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${
                  acceptOverdue
                    ? "bg-amber-50 text-amber-800 ring-amber-200"
                    : "bg-sky-50 text-sky-700 ring-sky-200"
                }`}
              >
                {acceptOverdue ? "接单超时" : "待确认接单"}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            派单时间 · {formatOrderDate(order.createdAt)}
          </p>
        </div>
        {showDesigner ? (
          <div className="text-right text-xs">
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
              {order.designer}
            </span>
            <p className="mt-1 text-slate-400">所在 {designerStore}</p>
            <div className="mt-2 text-left sm:text-right">
              <AssignmentInfo order={order} compact />
            </div>
          </div>
        ) : null}
      </div>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-400">联系电话</dt>
          <dd className="font-medium text-slate-800">{order.phone}</dd>
        </div>
        <div>
          <dt className="text-slate-400">派单门店</dt>
          <dd className="font-medium text-slate-800">{order.dispatchStore}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-slate-400">小区地址</dt>
          <dd
            className={`font-medium ${crossStore ? "text-red-600" : "text-slate-800"}`}
          >
            {order.address}
          </dd>
          {crossStore ? (
            <p className="mt-0.5 text-xs text-red-500">
              派单门店「{order.dispatchStore}」与设计师门店「{designerStore}」不一致
            </p>
          ) : null}
        </div>
        <div>
          <dt className="text-slate-400">派单人</dt>
          <dd className="font-medium text-slate-800">
            {order.dispatcherName || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">定制空间</dt>
          <dd className="font-medium text-slate-800">{formatSpaces(order.spaces)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">预算</dt>
          <dd className="font-medium text-slate-800">{formatBudget(order.budget)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">定金</dt>
          <dd
            className={`font-medium ${order.deposit <= 0 ? "text-amber-600" : "text-slate-800"}`}
          >
            {formatDeposit(order.deposit)}
          </dd>
        </div>
        {hasOrderAmount ? (
          <div>
            <dt className="text-slate-400">下单金额</dt>
            <dd className="font-semibold text-indigo-700">
              {formatOrderAmount(order.orderAmount)}
            </dd>
          </div>
        ) : null}
        {order.status === "已下单" || order.status === "已安装" ? (
          <div>
            <dt className="text-slate-400">耗时</dt>
            <dd className="font-medium text-slate-800">
              {totalElapsed ?? ""}
            </dd>
          </div>
        ) : null}
        {intervals?.toMeasured != null ? (
          <div>
            <dt className="text-slate-400">量尺间隔</dt>
            <dd className="font-medium text-slate-700">
              {formatIntervalDays(intervals.toMeasured)}
            </dd>
          </div>
        ) : null}
        {intervals?.toDrawn != null ? (
          <div>
            <dt className="text-slate-400">出图间隔</dt>
            <dd className="font-medium text-slate-700">
              {formatIntervalDays(intervals.toDrawn)}
            </dd>
          </div>
        ) : null}
        {intervals?.toSigned != null ? (
          <div>
            <dt className="text-slate-400">签约间隔</dt>
            <dd className="font-medium text-slate-700">
              {formatIntervalDays(intervals.toSigned)}
            </dd>
          </div>
        ) : null}
        {intervals?.toOrdered != null ? (
          <div>
            <dt className="text-slate-400">下单间隔</dt>
            <dd className="font-medium text-slate-700">
              {formatIntervalDays(intervals.toOrdered)}
            </dd>
          </div>
        ) : null}
        {!showDesigner && hasBeenTransferred(order) ? (
          <div className="sm:col-span-2">
            <dt className="text-slate-400">指派信息</dt>
            <dd>
              <AssignmentInfo order={order} />
            </dd>
          </div>
        ) : null}
        {showAfterSales && hasAfterSales(order) ? (
          <div className="sm:col-span-2 border-t border-slate-100 pt-2">
            <dt className="text-slate-400">售后金</dt>
            <dd className="font-semibold text-rose-700">
              {formatAfterSalesAmount(order.afterSalesAmount)}
            </dd>
            <p className="mt-0.5 text-xs text-slate-400">
              由设计经理登记 · 流程后续项
            </p>
          </div>
        ) : null}
      </dl>

      {remarkSummary ? (
        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
          <p className="text-xs font-medium text-slate-500">流程备注（按阶段）</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">
            {remarkSummary}
          </p>
        </div>
      ) : null}

      {canEditRemark ? (
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
          <Textarea
            label={`添加备注（当前：${order.status}）`}
            name={`remark-${order.id}`}
            placeholder="填写本阶段说明，保存后按流程顺序累计显示在列表「备注」列"
            value={remarkDraft}
            onChange={(e) => setRemarkDraft(e.target.value)}
            rows={2}
          />
          <div className="flex flex-wrap items-center gap-2">
            {onAddWorkflowRemark ? (
              <Button
                type="button"
                variant="secondary"
                onClick={handleSaveRemark}
                disabled={!remarkDraft.trim()}
              >
                保存备注
              </Button>
            ) : null}
            {remarkSaved ? (
              <span className="text-xs text-emerald-600">已记入备注</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {showOrderAmountForm ? (
        <form
          onSubmit={handleOrderAmountSubmit}
          className="mt-4 space-y-3 border-t border-slate-100 pt-4"
        >
          <div className="rounded-lg border border-orange-200 bg-orange-50/60 px-3 py-2 text-sm text-orange-900">
            更新为「已下单」须填写实际下单金额，与预算范围区分。
          </div>
          <Input
            label="下单金额（元）"
            name="orderAmount"
            type="number"
            min={1}
            step={1}
            required
            autoFocus
            placeholder="请输入合同/下单实际金额"
            value={orderAmountInput}
            onChange={(e) => {
              setOrderAmountInput(e.target.value);
              setAmountError("");
            }}
          />
          <Textarea
            label="已下单阶段备注（可选）"
            name="orderRemark"
            placeholder="推进至已下单时可一并填写备注"
            value={remarkDraft}
            onChange={(e) => setRemarkDraft(e.target.value)}
            rows={2}
          />
          <p className="text-xs text-slate-500">
            当前预算参考：{formatBudget(order.budget)}
          </p>
          {amountError ? (
            <p className="text-sm text-red-600">{amountError}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit">确认下单</Button>
            <Button type="button" variant="secondary" onClick={handleCancelOrderAmount}>
              取消
            </Button>
          </div>
        </form>
      ) : pendingAccept && onConfirmDesignerAccept ? (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-amber-800">
            请先确认接单，再推进量尺等后续流程。
          </p>
          <Button type="button" onClick={() => onConfirmDesignerAccept(order.id)}>
            确认接单
          </Button>
        </div>
      ) : showRefundPanel && canMarkRefund ? (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium text-slate-600">退单问题标签（可选）</p>
          <IssueTagsEditor value={refundTags} onChange={setRefundTags} />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                onMarkPendingRefund?.(order.id, remarkDraft.trim() || undefined, refundTags);
                setShowRefundPanel(false);
                setRefundTags([]);
                setRemarkDraft("");
              }}
            >
              确认标记待退单
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowRefundPanel(false)}
            >
              取消
            </Button>
          </div>
        </div>
      ) : canAdvance || canRevert || canMarkRefund || canConfirmRefund || canDelete ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {canAdvance ? (
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleAdvanceClick}
            >
              更新为「{nextStatus}」
            </Button>
          ) : null}
          {canRevert && previousStatus ? (
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => onRevertStatus?.(order.id)}
            >
              撤回更新
            </Button>
          ) : null}
          {canMarkRefund ? (
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => setShowRefundPanel(true)}
            >
              标记待退单
            </Button>
          ) : null}
          {canConfirmRefund ? (
            <Button
              variant="outline"
              className="w-full border-red-200 text-red-700 hover:bg-red-50 sm:w-auto"
              onClick={() => onConfirmRefund?.(order.id)}
            >
              确认已退单
            </Button>
          ) : null}
          {canDelete && onDeleteOrder ? (
            <DeleteOrderButton
              orderId={order.id}
              customerLabel={order.customerName}
              onDelete={onDeleteOrder}
            />
          ) : null}
        </div>
      ) : readOnly ? (
        <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-400">
          仅查看，无操作权限
        </p>
      ) : order.status === "已安装" ? (
        <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">
          订单已完成安装
        </p>
      ) : order.status === "已退单" ? (
        <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-red-600">
          订单已退单，流程已终止
        </p>
      ) : null}
    </article>
  );
}
