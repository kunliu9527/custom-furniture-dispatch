"use client";

import { AcceptancePanel } from "@/components/orders/acceptance-panel";
import { AssignDesignerPanel } from "@/components/orders/assign-designer-panel";
import { AssignmentInfo } from "@/components/orders/assignment-info";
import { ContractPanel } from "@/components/orders/contract-panel";
import { DepositEditor, PreMeasureDepositBadge } from "@/components/orders/deposit-editor";
import { OrderAnomalyBadges, OrderAnomalyName } from "@/components/orders/order-anomaly-badges";
import { StatusBadge } from "@/components/orders/status-badge";
import { Button } from "@/components/ui/button";
import { DeleteOrderButton } from "@/components/orders/delete-order-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { InitiateContractInput } from "@/components/orders/contract-panel";
import type { AdvanceOrderOptions } from "@/context/orders-context";
import {
  displayCustomerNameColumn,
  displayOrderNameColumn,
  formatWorkflowRemark,
} from "@/lib/order-remark";
import { useAuth } from "@/context/auth-context";
import {
  getEffectiveDesignerHomeStore,
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
import { resolvePrefilledOrderAmount } from "@/lib/customer-flow";
import {
  formatIntervalDays,
  formatTotalElapsedDisplay,
} from "@/lib/stage-intervals";
import { IssueTagsEditor } from "@/components/shared/issue-tags-editor";
import { needsDesignerAcceptance } from "@/lib/designer-load";
import type { DesignerName, Order, OrderIssueTag, OrderStatus } from "@/lib/types";
import { showStatusToast } from "@/lib/status-toast";
import {
  formatStatusRevertedLabel,
  formatStatusUpdatedLabel,
  ORDER_STATUS_SUCCESS_BANNER_CLASS,
  ORDER_STATUS_SUCCESS_CARD_CLASS,
  ORDER_STATUS_SUCCESS_MS,
  parseStatusFromFeedbackLabel,
  type OrderStatusTransitionPayload,
} from "@/lib/order-status-feedback";
import { FormEvent, useEffect, useRef, useState, type ReactNode } from "react";

interface OrderCardProps {
  order: Order;
  showDesigner?: boolean;
  highlightCrossStore?: boolean;
  /** 深链定位高亮 */
  focused?: boolean;
  readOnly?: boolean;
  onAdvanceStatus?: (id: string, options?: number | AdvanceOrderOptions) => boolean;
  onAddWorkflowRemark?: (id: string, text: string) => void;
  onRevertStatus?: (id: string) => boolean;
  onMarkPendingRefund?: (
    id: string,
    remark?: string,
    issueTags?: OrderIssueTag[],
  ) => boolean;
  onConfirmRefund?: (
    id: string,
    remark?: string,
    issueTags?: OrderIssueTag[],
  ) => boolean;
  onConfirmDesignerAccept?: (id: string) => boolean;
  showAcceptAction?: boolean;
  showAfterSales?: boolean;
  canRevertOrder?: (order: Order) => boolean;
  canEditRemark?: (order: Order) => boolean;
  onDeleteOrder?: (id: string) => void;
  onAssignDesigner?: (
    id: string,
    designer: DesignerName,
    forceOverCapacity?: boolean,
  ) => boolean;
  showAssignDesigner?: boolean;
  assignDesignerDefault?: DesignerName;
  showCustomerFlow?: boolean;
  onInitiateContract?: (id: string, input: InitiateContractInput) => void;
  onUpdateDeposit?: (id: string, deposit: number) => void;
  onOfflineSign?: (id: string, depositPaid?: number) => void;
  /** @deprecated 使用 onOfflineSign */
  onSkipElectronicSign?: (id: string) => void;
  onConfirmContractOffline?: (id: string) => void;
  canConfirmContractOffline?: boolean;
  onInitiateAcceptance?: (id: string) => void;
  onSkipElectronicAccept?: (id: string) => void;
  /** 卡片主标题：默认客户姓名；查询页用地址 */
  headingMode?: "customer" | "address";
  /** 嵌入信息区空白处（增补单等） */
  supplementPane?: ReactNode;
  /** 状态变更后通知列表占位（卡片即将移出筛选时） */
  onStatusTransition?: (payload: OrderStatusTransitionPayload) => void;
  /** 任意成功状态变更时触发（含 inlineStatusFeedback=false） */
  onStatusUpdated?: (payload: OrderStatusTransitionPayload) => void;
  /** 为 false 时仅 toast，不显示绿条占位、不禁用操作（如「全部」订单列表） */
  inlineStatusFeedback?: boolean;
}

export function OrderCard({
  order,
  showDesigner = true,
  highlightCrossStore = false,
  focused = false,
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
  onAssignDesigner,
  showAssignDesigner = false,
  assignDesignerDefault,
  showCustomerFlow = false,
  onInitiateContract,
  onUpdateDeposit,
  onOfflineSign,
  onSkipElectronicSign,
  onConfirmContractOffline,
  canConfirmContractOffline = false,
  onInitiateAcceptance,
  onSkipElectronicAccept,
  headingMode = "address",
  supplementPane,
  onStatusTransition,
  onStatusUpdated,
  inlineStatusFeedback = true,
}: OrderCardProps) {
  const { designerHomeStoreIndex } = useAuth();
  const nextStatus = getNextStatus(order.status);
  const requiresOrderAmount = nextStatus === "已下单";
  const showSignedOrderForm =
    order.status === "已签约" && Boolean(onAdvanceStatus) && !readOnly;
  const [showRefundPanel, setShowRefundPanel] = useState(false);
  const [refundTags, setRefundTags] = useState<OrderIssueTag[]>([]);
  const pendingAccept =
    showAcceptAction && needsDesignerAcceptance(order);
  const canAdvance =
    !readOnly &&
    !pendingAccept &&
    !showSignedOrderForm &&
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
  const designerStore = order.designer
    ? getEffectiveDesignerHomeStore(order.designer, designerHomeStoreIndex)
    : null;

  const [showOrderAmountForm, setShowOrderAmountForm] = useState(false);
  const [orderAmountInput, setOrderAmountInput] = useState("");
  const [amountError, setAmountError] = useState("");
  const [remarkDraft, setRemarkDraft] = useState("");
  const [remarkSaved, setRemarkSaved] = useState(false);
  const [statusFeedbackLabel, setStatusFeedbackLabel] = useState<string | null>(
    null,
  );
  const statusFeedbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (statusFeedbackTimerRef.current != null) {
        window.clearTimeout(statusFeedbackTimerRef.current);
      }
    };
  }, []);

  function applyStatusFeedback(resultLabel: string) {
    const payload = {
      orderId: order.id,
      resultLabel,
      orderSnapshot: order,
    };
    showStatusToast(`${displayOrderNameColumn(order)} ${resultLabel}`);
    onStatusUpdated?.(payload);
    if (!inlineStatusFeedback) return;

    setShowRefundPanel(false);
    setShowOrderAmountForm(false);
    setStatusFeedbackLabel(resultLabel);
    onStatusTransition?.(payload);
    if (statusFeedbackTimerRef.current != null) {
      window.clearTimeout(statusFeedbackTimerRef.current);
    }
    statusFeedbackTimerRef.current = window.setTimeout(() => {
      setStatusFeedbackLabel(null);
      statusFeedbackTimerRef.current = null;
    }, ORDER_STATUS_SUCCESS_MS);
  }

  const resolvedOfflineSign =
    onOfflineSign ?? onSkipElectronicSign ?? onConfirmContractOffline;

  useEffect(() => {
    if (order.status === "已签约") {
      setOrderAmountInput(resolvePrefilledOrderAmount(order));
    }
  }, [
    order.id,
    order.status,
    order.contract?.contractAmount,
    order.contract?.offlineConfirmed,
    order.contract?.signedAt,
  ]);

  const remarkSummary = formatWorkflowRemark(order);
  const canEditRemark =
    !readOnly &&
    order.status !== "已安装" &&
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

  function runStatusAction(
    resultLabel: string,
    action: () => boolean | undefined,
  ) {
    if (action() !== true) return;
    applyStatusFeedback(resultLabel);
  }

  function submitAdvance(opts: AdvanceOrderOptions) {
    const remark = remarkDraft.trim();
    const advancingTo = nextStatus;
    if (!advancingTo || !onAdvanceStatus) return;
    const ok = onAdvanceStatus(order.id, {
      ...opts,
      remark: remark || opts.remark,
    });
    if (!ok) return;
    applyStatusFeedback(formatStatusUpdatedLabel(advancingTo));
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
  const anomalyOptions = {
    highlightCrossStore,
    designerHomeStoreIndex,
  };
  const totalElapsed = formatTotalElapsedDisplay(order);
  const intervals = order.stageIntervalDays;
  const addressAsTitle = headingMode === "address";
  const orderTitle = displayOrderNameColumn(order);
  const customerNameLabel = displayCustomerNameColumn(order) || "—";
  const isFeedbackActive = Boolean(statusFeedbackLabel);
  const displayStatus: OrderStatus =
    isFeedbackActive && statusFeedbackLabel
      ? ((parseStatusFromFeedbackLabel(statusFeedbackLabel) ??
          order.status) as OrderStatus)
      : order.status;
  const hasPrimaryActions =
    Boolean(pendingAccept && onConfirmDesignerAccept) ||
    (!showRefundPanel &&
      (canAdvance ||
        canRevert ||
        canMarkRefund ||
        canConfirmRefund ||
        canDelete));
  const hasPrimaryActionBar =
    !isFeedbackActive &&
    (hasPrimaryActions ||
      readOnly ||
      order.status === "已安装" ||
      order.status === "已验收" ||
      order.status === "已退单");

  return (
    <article
      id={focused ? `order-card-${order.id}` : undefined}
      className={`vi-order-card ${
        isFeedbackActive
          ? ORDER_STATUS_SUCCESS_CARD_CLASS
          : focused
            ? "vi-order-card-focused"
            : ""
      }`}
    >
      {statusFeedbackLabel ? (
        <div className={ORDER_STATUS_SUCCESS_BANNER_CLASS}>
          ✓ {statusFeedbackLabel}
        </div>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <OrderAnomalyName
              order={order}
              as="h3"
              className={`text-base ${addressAsTitle ? "leading-snug" : ""}`}
              defaultClassName="text-base font-semibold tracking-tight text-zinc-900"
              {...anomalyOptions}
            >
              {orderTitle}
            </OrderAnomalyName>
            <StatusBadge status={displayStatus} />
            <OrderAnomalyBadges order={order} {...anomalyOptions} />
            <PreMeasureDepositBadge order={order} />
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            {customerNameLabel !== "—" ? (
              <>
                {customerNameLabel} · 派单时间 · {formatOrderDate(order.createdAt)}
              </>
            ) : (
              <>派单时间 · {formatOrderDate(order.createdAt)}</>
            )}
          </p>
        </div>
        {showDesigner ? (
          <div className="text-right text-xs">
            <span
              className={`rounded-lg px-2.5 py-1 font-medium ${
                order.designer
                  ? "bg-slate-100 text-slate-600"
                  : "bg-slate-50 text-slate-400 ring-1 ring-slate-200"
              }`}
            >
              {order.designer ?? "未指派"}
            </span>
            {designerStore ? (
              <p className="mt-1 text-slate-400">所在 {designerStore}</p>
            ) : null}
            <div className="mt-2 text-left sm:text-right">
              <AssignmentInfo order={order} compact />
            </div>
          </div>
        ) : null}
      </div>

      {!isFeedbackActive && hasPrimaryActionBar ? (
        <div className="vi-order-action-bar mt-3 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          {pendingAccept && onConfirmDesignerAccept ? (
            <>
              <span className="w-full text-xs text-amber-800 sm:w-auto">
                请先确认接单，再推进量尺等后续流程。
              </span>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  runStatusAction("已确认接单", () =>
                    onConfirmDesignerAccept(order.id),
                  );
                }}
              >
                确认接单
              </Button>
            </>
          ) : showRefundPanel && canMarkRefund ? null : canAdvance ||
            canRevert ||
            canMarkRefund ||
            canConfirmRefund ||
            canDelete ? (
            <>
              {canAdvance ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={handleAdvanceClick}
                >
                  更新为「{nextStatus}」
                </Button>
              ) : null}
              {canRevert && previousStatus ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    runStatusAction(formatStatusRevertedLabel(previousStatus), () =>
                      onRevertStatus?.(order.id),
                    );
                  }}
                >
                  撤回更新
                </Button>
              ) : null}
              {canMarkRefund ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setShowRefundPanel(true)}
                >
                  标记待退单
                </Button>
              ) : null}
              {canConfirmRefund ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-red-200 text-red-700 hover:bg-red-50 sm:w-auto"
                  onClick={() => {
                    runStatusAction(formatStatusUpdatedLabel("已退单"), () =>
                      onConfirmRefund?.(order.id),
                    );
                  }}
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
            </>
          ) : readOnly ? (
            <p className="text-xs text-slate-400">仅查看，无操作权限</p>
          ) : order.status === "已安装" ? (
            <p className="text-sm text-slate-500">订单已完成安装</p>
          ) : order.status === "已验收" ? (
            <p className="text-sm text-slate-500">订单已验收，流程已完结</p>
          ) : order.status === "已退单" ? (
            <p className="text-sm text-red-600">订单已退单，流程已终止</p>
          ) : null}
        </div>
      ) : null}

      <dl className="mt-4 grid grid-cols-3 gap-x-3 gap-y-2.5 text-sm">
        <div className="min-w-0">
          <dt className="vi-dl-term">客户姓名</dt>
          <dd className="vi-dl-value">{customerNameLabel}</dd>
        </div>
        <div className="min-w-0">
          <dt className="vi-dl-term">联系电话</dt>
          <dd className="vi-dl-value break-all">{order.phone || "—"}</dd>
        </div>
        <div className="min-w-0">
          <dt className="vi-dl-term">定制空间</dt>
          <dd className="vi-dl-value">{formatSpaces(order.spaces)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="vi-dl-term">小区地址</dt>
          <dd className="vi-dl-value break-words">
            {order.address?.trim() || "—"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="vi-dl-term">预算</dt>
          <dd className="vi-dl-value">{formatBudget(order.budget)}</dd>
        </div>
        <div className="min-w-0">
          {onUpdateDeposit ? (
            <DepositEditor
              order={order}
              onSave={onUpdateDeposit}
              readOnly={readOnly}
              compact
            />
          ) : (
            <>
              <dt className="vi-dl-term">定金</dt>
              <dd
                className={`font-medium ${order.deposit <= 0 ? "text-amber-600" : "text-slate-800"}`}
              >
                {formatDeposit(order.deposit)}
              </dd>
            </>
          )}
        </div>
        <div className="min-w-0">
          <dt className="vi-dl-term">派单门店</dt>
          <dd className="vi-dl-value">{order.dispatchStore}</dd>
        </div>
        <div className="min-w-0">
          <dt className="vi-dl-term">派单人</dt>
          <dd className="vi-dl-value">{order.dispatcherName || "—"}</dd>
        </div>
        {hasOrderAmount ? (
          <div className="min-w-0">
            <dt className="vi-dl-term">下单金额</dt>
            <dd className="font-semibold text-indigo-700">
              {formatOrderAmount(order.orderAmount)}
            </dd>
          </div>
        ) : null}
        {intervals?.toMeasured != null ? (
          <div className="min-w-0">
            <dt className="vi-dl-term">量尺间隔</dt>
            <dd className="vi-dl-value text-zinc-600">
              {formatIntervalDays(intervals.toMeasured)}
            </dd>
          </div>
        ) : null}
        {intervals?.toDrawn != null ? (
          <div className="min-w-0">
            <dt className="vi-dl-term">出图间隔</dt>
            <dd className="vi-dl-value text-zinc-600">
              {formatIntervalDays(intervals.toDrawn)}
            </dd>
          </div>
        ) : null}
        {intervals?.toSigned != null ? (
          <div className="min-w-0">
            <dt className="vi-dl-term">签约间隔</dt>
            <dd className="vi-dl-value text-zinc-600">
              {formatIntervalDays(intervals.toSigned)}
            </dd>
          </div>
        ) : null}
        {intervals?.toOrdered != null ? (
          <div className="min-w-0">
            <dt className="vi-dl-term">下单间隔</dt>
            <dd className="vi-dl-value text-zinc-600">
              {formatIntervalDays(intervals.toOrdered)}
            </dd>
          </div>
        ) : null}
        {order.status === "已下单" || order.status === "已安装" ? (
          <div className="min-w-0">
            <dt className="vi-dl-term">耗时</dt>
            <dd className="vi-dl-value">{totalElapsed ?? "—"}</dd>
          </div>
        ) : null}
        {!showDesigner && hasBeenTransferred(order) ? (
          <div className="col-span-3 min-w-0 border-t border-slate-100 pt-2">
            <dt className="vi-dl-term">指派信息</dt>
            <dd>
              <AssignmentInfo order={order} />
            </dd>
          </div>
        ) : null}
        {showAfterSales && hasAfterSales(order) ? (
          <div className="col-span-3 min-w-0 border-t border-slate-100 pt-2">
            <dt className="vi-dl-term">售后金</dt>
            <dd className="font-semibold text-rose-700">
              {formatAfterSalesAmount(order.afterSalesAmount)}
            </dd>
            <p className="mt-0.5 text-xs text-slate-400">
              由设计经理登记 · 流程后续项
            </p>
          </div>
        ) : null}
      </dl>

      {supplementPane ? (
        <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/50 p-2.5">
          {supplementPane}
        </div>
      ) : null}

      {remarkSummary ? (
        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
          <p className="vi-label-caps">流程备注（按阶段）</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">
            {remarkSummary}
          </p>
        </div>
      ) : null}

      {canEditRemark && !isFeedbackActive ? (
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

      {!isFeedbackActive && order.status === "未派单" && showAssignDesigner && onAssignDesigner ? (
        <AssignDesignerPanel
          order={order}
          defaultDesigner={assignDesignerDefault}
          onAssign={(orderId, designer, forceOverCapacity) => {
            runStatusAction(formatStatusUpdatedLabel("待量尺"), () =>
              onAssignDesigner(orderId, designer, forceOverCapacity),
            );
          }}
        />
      ) : null}

      {!isFeedbackActive && showCustomerFlow && onInitiateContract && order.status === "待签约" ? (
        <ContractPanel
          order={order}
          onInitiate={(orderId, input) => {
            applyStatusFeedback("已发起签约");
            onInitiateContract(orderId, input);
          }}
          onOfflineSign={
            resolvedOfflineSign
              ? (orderId, depositPaid) => {
                  applyStatusFeedback(formatStatusUpdatedLabel("已签约"));
                  resolvedOfflineSign(orderId, depositPaid);
                }
              : undefined
          }
          readOnly={readOnly}
        />
      ) : null}

      {!isFeedbackActive && showCustomerFlow && onInitiateAcceptance ? (
        <AcceptancePanel
          order={order}
          onInitiateAcceptance={(orderId) => {
            applyStatusFeedback("已生成验收二维码");
            onInitiateAcceptance(orderId);
          }}
          onSkipElectronicAccept={
            onSkipElectronicAccept
              ? (orderId) => {
                  applyStatusFeedback(formatStatusUpdatedLabel("已验收"));
                  onSkipElectronicAccept(orderId);
                }
              : undefined
          }
          readOnly={readOnly}
        />
      ) : null}

      {!isFeedbackActive && (showSignedOrderForm || showOrderAmountForm) ? (
        <form
          onSubmit={handleOrderAmountSubmit}
          className="mt-4 space-y-3 border-t border-slate-100 pt-4"
        >
          <div className="rounded-lg border border-orange-200 bg-orange-50/60 px-3 py-2 text-sm text-orange-900">
            {showSignedOrderForm
              ? orderAmountInput
                ? "已签约：合同金额已带入下方下单金额，确认后进入已下单。"
                : "已签约：请填写实际下单金额后确认下单。"
              : "更新为「已下单」须填写实际下单金额，与预算范围区分。"}
          </div>
          <Input
            label="下单金额（元）"
            name="orderAmount"
            type="number"
            min={1}
            step={1}
            required
            autoFocus={showOrderAmountForm}
            placeholder="请输入合同/下单实际金额"
            value={orderAmountInput}
            onChange={(e) => {
              setOrderAmountInput(e.target.value);
              setAmountError("");
            }}
          />
          <p className="text-xs text-slate-500">
            当前预算参考：{formatBudget(order.budget)}
          </p>
          {amountError ? (
            <p className="text-sm text-red-600">{amountError}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit">确认下单</Button>
            {showOrderAmountForm ? (
              <Button type="button" variant="secondary" onClick={handleCancelOrderAmount}>
                取消
              </Button>
            ) : null}
          </div>
        </form>
      ) : !isFeedbackActive && showRefundPanel && canMarkRefund ? (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <p className="vi-label-caps">退单问题标签（可选）</p>
          <IssueTagsEditor value={refundTags} onChange={setRefundTags} />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const ok = onMarkPendingRefund?.(
                  order.id,
                  remarkDraft.trim() || undefined,
                  refundTags,
                );
                if (ok !== true) return;
                applyStatusFeedback(formatStatusUpdatedLabel("待退单"));
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
      ) : null}
    </article>
  );
}
