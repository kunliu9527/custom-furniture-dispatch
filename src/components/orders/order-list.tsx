import { OrderCard } from "@/components/orders/order-card";
import type { AdvanceOrderOptions } from "@/context/orders-context";
import type { Order, OrderIssueTag } from "@/lib/types";

interface OrderListProps {
  orders: Order[];
  emptyMessage: string;
  showDesigner?: boolean;
  highlightCrossStore?: boolean;
  isOrderReadOnly?: (order: Order) => boolean;
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

export function OrderList({
  orders,
  emptyMessage,
  showDesigner = true,
  highlightCrossStore = false,
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
}: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          showDesigner={showDesigner}
          highlightCrossStore={highlightCrossStore}
          readOnly={isOrderReadOnly?.(order) ?? false}
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
        />
      ))}
    </div>
  );
}
