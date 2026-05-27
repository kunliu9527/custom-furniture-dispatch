import { OrderCard } from "@/components/orders/order-card";
import type { AdvanceOrderOptions } from "@/context/orders-context";
import type { Order } from "@/lib/types";

interface OrderListProps {
  orders: Order[];
  emptyMessage: string;
  showDesigner?: boolean;
  highlightCrossStore?: boolean;
  isOrderReadOnly?: (order: Order) => boolean;
  onAdvanceStatus?: (id: string, options?: number | AdvanceOrderOptions) => void;
  onAddWorkflowRemark?: (id: string, text: string) => void;
  onRevertStatus?: (id: string) => void;
  onMarkPendingRefund?: (id: string) => void;
  onConfirmRefund?: (id: string) => void;
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
          showAfterSales={showAfterSales}
          canRevertOrder={canRevertOrder}
          canEditRemark={canEditRemark}
          onDeleteOrder={onDeleteOrder}
        />
      ))}
    </div>
  );
}
