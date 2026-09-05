"use client";

import { OrderCard } from "@/components/orders/order-card";
import { useAuth } from "@/context/auth-context";
import { useOrders } from "@/context/orders-context";
import {
  canEditWorkflowRemarkOnOrder,
  canModifyOrderInUserScope,
  canOfflineSignContract,
  canUserRevertOrderStatus,
} from "@/lib/permissions";
import { useEffect } from "react";

interface OrderCardDialogProps {
  /** 当前打开的订单 id；null 表示关闭 */
  orderId: string | null;
  onClose: () => void;
}

/**
 * manager 页订单详情/操作浮层：直接渲染完整 OrderCard。
 * 卡内操作不限制管理员——凡在当前登录数据范围内的订单即可编辑
 * （行首点开的弹框用于完整处理;矩阵点格的快捷更新仍仅限管理员）。
 * 动作回调来自 orders-context，成功后 context 自动落盘，order 每次渲染实时取最新。
 */
export function OrderCardDialog({ orderId, onClose }: OrderCardDialogProps) {
  const { user } = useAuth();
  const {
    orders,
    advanceOrderStatus,
    addWorkflowRemark,
    revertOrderStatus,
    markPendingRefund,
    confirmRefund,
    confirmDesignerAccept,
    assignDesignerToOrder,
    initiateContract,
    updateOrderDeposit,
    offlineSignContract,
    initiateAcceptance,
    skipElectronicAcceptance,
  } = useOrders();

  const order = orderId
    ? (orders.find((o) => o.id === orderId) ?? null)
    : null;

  useEffect(() => {
    if (!orderId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [orderId, onClose]);

  if (!order) return null;

  // 点击行首打开的订单卡:操作不限制管理员——凡在当前登录数据范围内(scopeOrdersForUser
  // 已过滤)即可编辑;离线签约等仍按 canOfflineSignContract 等角色权限函数执行。
  const editable = canModifyOrderInUserScope(user, order);
  const readOnly = !editable;
  const offlineAllowed = editable && canOfflineSignContract(user);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-3 sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`订单详情：${order.address || order.customerName}`}
        className="flex w-full max-w-3xl flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1.5 flex items-center justify-end gap-3">
          <span
            className="min-w-0 truncate text-[13px]"
            style={{ color: "var(--label-secondary)" }}
          >
            {order.address || order.customerName}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg px-2 py-1 text-[13px] font-medium transition-colors hover:bg-[var(--fill-quaternary)]"
            style={{ color: "var(--label-primary)" }}
          >
            关闭 ✕
          </button>
        </div>
        <div className="max-h-[85vh] overflow-y-auto rounded-xl">
          <OrderCard
            order={order}
            headingMode="address"
            showDesigner
            highlightCrossStore
            readOnly={readOnly}
            inlineStatusFeedback
            canRevertOrder={(o) =>
              canUserRevertOrderStatus(user, o) &&
              canModifyOrderInUserScope(user, o)
            }
            canEditRemark={(o) =>
              canModifyOrderInUserScope(user, o) &&
              canEditWorkflowRemarkOnOrder(user, o)
            }
            showAcceptAction={editable}
            showMeasureAction={editable}
            showAfterSales
            showCustomerFlow={editable}
            showAssignDesigner={editable}
            onAdvanceStatus={editable ? advanceOrderStatus : undefined}
            onAddWorkflowRemark={editable ? addWorkflowRemark : undefined}
            onRevertStatus={editable ? revertOrderStatus : undefined}
            onMarkPendingRefund={editable ? markPendingRefund : undefined}
            onConfirmRefund={editable ? confirmRefund : undefined}
            onConfirmDesignerAccept={
              editable ? confirmDesignerAccept : undefined
            }
            onAssignDesigner={editable ? assignDesignerToOrder : undefined}
            onInitiateContract={editable ? initiateContract : undefined}
            onUpdateDeposit={editable ? updateOrderDeposit : undefined}
            onOfflineSign={offlineAllowed ? offlineSignContract : undefined}
            onInitiateAcceptance={
              editable ? initiateAcceptance : undefined
            }
            onSkipElectronicAccept={
              editable ? skipElectronicAcceptance : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
