"use client";



import { OrderCard } from "@/components/orders/order-card";

import type { AdvanceOrderOptions } from "@/context/orders-context";

import {

  ORDER_STATUS_SUCCESS_CARD_CLASS,

  ORDER_STATUS_SUCCESS_MS,

  type OrderStatusTransitionPayload,

} from "@/lib/order-status-feedback";

import type { DesignerName, Order, OrderIssueTag } from "@/lib/types";
import { displayOrderNameColumn } from "@/lib/order-remark";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";



interface OrderListProps {

  orders: Order[];

  emptyMessage: string;

  showDesigner?: boolean;

  highlightCrossStore?: boolean;

  /** 深链定位：高亮并滚动到指定订单 */

  focusOrderId?: string | null;

  isOrderReadOnly?: (order: Order) => boolean;

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

  onInitiateContract?: (

    id: string,

    input: import("@/components/orders/contract-panel").InitiateContractInput,

  ) => void;

  onUpdateDeposit?: (id: string, deposit: number) => void;

  onOfflineSign?: (id: string, depositPaid?: number) => void;

  onSkipElectronicSign?: (id: string) => void;

  onConfirmContractOffline?: (id: string) => void;

  canConfirmContractOffline?: boolean;

  onInitiateAcceptance?: (id: string) => void;

  onSkipElectronicAccept?: (id: string) => void;

  /** 详情区单列铺满；默认 grid 双列卡片 */

  layout?: "grid" | "stack";

  headingMode?: "customer" | "address";

  supplementPane?: ReactNode;

  /** 为 false 时状态变更仅 toast，卡片保持可操作（如侧栏「全部」） */
  inlineStatusFeedback?: boolean;

  /** 状态变更成功时通知父级（如「全部」下列表位置冻结） */
  onStatusUpdated?: (payload: OrderStatusTransitionPayload) => void;

}



type PinnedStatusFeedback = {

  index: number;

  order: Order;

  resultLabel: string;

};



type OrderListItem =

  | { type: "order"; order: Order }

  | { type: "success"; order: Order; resultLabel: string };



function StatusSuccessPlaceholder({

  order,

  resultLabel,

  headingMode,

}: {

  order: Order;

  resultLabel: string;

  headingMode: "customer" | "address";

}) {

  return (

    <article
      className={`vi-order-card pointer-events-none flex min-h-[10rem] flex-col justify-center ${ORDER_STATUS_SUCCESS_CARD_CLASS}`}
      aria-live="polite"
    >
      <p className="text-base font-semibold tracking-tight text-emerald-900">
        ✓ {resultLabel}
      </p>
      <p className="mt-2 truncate text-sm text-emerald-800/75">

        {displayOrderNameColumn(order)}

      </p>

    </article>

  );

}



export function OrderList({

  orders,

  emptyMessage,

  showDesigner = true,

  highlightCrossStore = false,

  focusOrderId = null,

  isOrderReadOnly,

  onAdvanceStatus,

  onAddWorkflowRemark,

  onRevertStatus,

  onMarkPendingRefund,

  onConfirmRefund,

  onConfirmDesignerAccept,

  showAcceptAction = false,

  showAfterSales = false,

  canRevertOrder,

  canEditRemark,

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

  layout = "grid",

  headingMode = "address",

  supplementPane,

  inlineStatusFeedback = true,

  onStatusUpdated,

}: OrderListProps) {

  const [pinnedStatusFeedback, setPinnedStatusFeedback] =

    useState<PinnedStatusFeedback | null>(null);



  const handleStatusTransition = useCallback(

    ({ orderId, resultLabel, orderSnapshot }: OrderStatusTransitionPayload) => {

      if (!inlineStatusFeedback) return;

      const index = orders.findIndex((order) => order.id === orderId);

      const order = index >= 0 ? orders[index]! : orderSnapshot;

      setPinnedStatusFeedback({
        index: index >= 0 ? index : 0,
        order,
        resultLabel,
      });

      window.setTimeout(() => setPinnedStatusFeedback(null), ORDER_STATUS_SUCCESS_MS);

    },

    [orders, inlineStatusFeedback],

  );



  const hasStatusActions = Boolean(

    onAdvanceStatus ||

      onRevertStatus ||

      onMarkPendingRefund ||

      onConfirmRefund ||

      onConfirmDesignerAccept ||

      onAssignDesigner ||

      onOfflineSign ||

      onSkipElectronicSign ||

      onConfirmContractOffline ||

      onInitiateAcceptance ||

      onSkipElectronicAccept ||

      onInitiateContract,

  );



  const listItems = useMemo((): OrderListItem[] => {

    const items: OrderListItem[] = orders.map((order) => ({

      type: "order",

      order,

    }));



    if (!pinnedStatusFeedback) return items;



    const stillVisible = items.some(

      (item) =>

        item.type === "order" &&

        item.order.id === pinnedStatusFeedback.order.id,

    );

    if (stillVisible) return items;



    const insertAt = Math.min(pinnedStatusFeedback.index, items.length);

    items.splice(insertAt, 0, {

      type: "success",

      order: pinnedStatusFeedback.order,

      resultLabel: pinnedStatusFeedback.resultLabel,

    });

    return items;

  }, [orders, pinnedStatusFeedback]);



  useEffect(() => {

    if (!focusOrderId || !orders.some((o) => o.id === focusOrderId)) return;

    const frame = window.requestAnimationFrame(() => {

      document

        .getElementById(`order-card-${focusOrderId}`)

        ?.scrollIntoView({ behavior: "smooth", block: "center" });

    });

    return () => window.cancelAnimationFrame(frame);

  }, [focusOrderId, orders]);



  if (listItems.length === 0) {

    return (

      <div className="vi-empty-state">
        <p>{emptyMessage}</p>
      </div>

    );

  }



  const effectiveLayout = focusOrderId ? "stack" : layout;



  return (

    <div

      className={

        effectiveLayout === "stack"

          ? "grid grid-cols-1 gap-4"

          : "grid gap-4 sm:grid-cols-2"

      }

    >

      {listItems.map((item) =>

        item.type === "success" ? (

          <StatusSuccessPlaceholder

            key={`status-success-${item.order.id}`}

            order={item.order}

            resultLabel={item.resultLabel}

            headingMode={headingMode}

          />

        ) : (

          <OrderCard

            key={item.order.id}

            order={item.order}

            headingMode={headingMode}

            showDesigner={showDesigner}

            highlightCrossStore={highlightCrossStore}

            focused={focusOrderId === item.order.id}

            readOnly={isOrderReadOnly?.(item.order) ?? false}

            onAdvanceStatus={onAdvanceStatus}

            onAddWorkflowRemark={onAddWorkflowRemark}

            onRevertStatus={onRevertStatus}

            onMarkPendingRefund={onMarkPendingRefund}

            onConfirmRefund={onConfirmRefund}

            onConfirmDesignerAccept={onConfirmDesignerAccept}

            showAcceptAction={showAcceptAction}

            showAfterSales={showAfterSales}

            canRevertOrder={canRevertOrder}

            canEditRemark={canEditRemark}

            onDeleteOrder={onDeleteOrder}

            onAssignDesigner={onAssignDesigner}

            showAssignDesigner={showAssignDesigner}

            assignDesignerDefault={assignDesignerDefault}

            showCustomerFlow={showCustomerFlow}

            onInitiateContract={onInitiateContract}

            onUpdateDeposit={onUpdateDeposit}

            onOfflineSign={onOfflineSign}

            onSkipElectronicSign={onSkipElectronicSign}

            onConfirmContractOffline={onConfirmContractOffline}

            canConfirmContractOffline={canConfirmContractOffline}

            onInitiateAcceptance={onInitiateAcceptance}

            onSkipElectronicAccept={onSkipElectronicAccept}

            supplementPane={supplementPane}

            onStatusTransition={

              hasStatusActions && inlineStatusFeedback

                ? handleStatusTransition

                : undefined

            }

            inlineStatusFeedback={inlineStatusFeedback}

            onStatusUpdated={onStatusUpdated}

          />

        ),

      )}

    </div>

  );

}


