"use client";

import { AfterSalesCell } from "@/components/manager/after-sales-cell";
import { AssignmentInfo } from "@/components/orders/assignment-info";
import { DeleteOrderButton } from "@/components/orders/delete-order-button";
import { OrderAnomalyBadges, OrderAnomalyName } from "@/components/orders/order-anomaly-badges";
import { StatusBadge } from "@/components/orders/status-badge";
import { useAuth } from "@/context/auth-context";
import { DESIGNER_ROSTER } from "@/lib/designers";
import {
  displayCustomerAddressColumn,
  displayCustomerNameColumn,
  displayCustomerPhoneColumn,
  formatWorkflowRemark,
} from "@/lib/order-remark";
import {
  formatBudget,
  formatAfterSalesAmount,
  formatCurrency,
  formatOrderAmount,
  formatSpaces,
} from "@/lib/order-format";
import { formatOrderDateDay } from "@/lib/order-utils";
import {
  getCombinedOrderAmount,
  getSupplementsForOrder,
  sumSupplementAmount,
} from "@/lib/supplement-utils";
import { OrderIssueTagsCell } from "@/components/manager/order-issue-tags-cell";
import type {
  DesignerName,
  Order,
  OrderIssueTag,
  StoreName,
  SupplementOrder,
} from "@/lib/types";

const thClass =
  "px-2.5 py-2 text-xs font-bold uppercase tracking-wide text-slate-600";
const tdClass = "px-2.5 py-2 align-top text-slate-700";

interface ManagerOrderTableProps {
  orders: Order[];
  supplements: SupplementOrder[];
  emptyMessage: string;
  showDesigner?: boolean;
  readOnly?: boolean;
  /** 单笔地址定位时展示全部字段 */
  detailMode?: boolean;
  isOrderReadOnly?: (order: Order) => boolean;
  onReassign?: (orderId: string, designer: DesignerName) => void;
  onSetAfterSalesAmount?: (orderId: string, amount: number | null) => void;
  onSetIssueTags?: (orderId: string, tags: OrderIssueTag[]) => void;
  /** 管理员删除订单 */
  onDeleteOrder?: (orderId: string) => void;
  /** 转派下拉可选设计师（默认全员名册） */
  designerRoster?: readonly { name: string; homeStore: StoreName }[];
}

export function ManagerOrderTable({
  orders,
  supplements,
  emptyMessage,
  showDesigner = true,
  readOnly = false,
  detailMode = false,
  isOrderReadOnly,
  onReassign,
  onSetAfterSalesAmount,
  onSetIssueTags,
  onDeleteOrder,
  designerRoster = DESIGNER_ROSTER,
}: ManagerOrderTableProps) {
  const { designerHomeStoreIndex } = useAuth();
  const anomalyOptions = {
    highlightCrossStore: true,
    designerHomeStoreIndex,
  };
  const canReassign = !readOnly && Boolean(onReassign);
  const canEditAfterSales = !readOnly && Boolean(onSetAfterSalesAmount);
  const canEditIssueTags = !readOnly && Boolean(onSetIssueTags);
  const canDelete = Boolean(onDeleteOrder);
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table
          className={`vi-data-table w-full border-collapse text-left text-sm ${detailMode ? "min-w-[1280px]" : "min-w-[960px]"}`}
        >
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className={`${thClass} min-w-[140px]`}>客户地址</th>
              {showDesigner ? (
                <th className={`${thClass} min-w-[100px]`}>
                  {canReassign ? "设计师（可转派）" : "设计师"}
                </th>
              ) : null}
              <th className={`${thClass} w-[84px]`}>派单门店</th>
              <th className={`${thClass} w-[68px]`}>状态</th>
              <th className={`${thClass} w-[68px]`}>派单人</th>
              {detailMode ? (
                <th className={`${thClass} w-[60px]`}>定金</th>
              ) : null}
              <th className={`${thClass} w-[72px]`}>预算</th>
              <th className={`${thClass} w-[76px]`}>主单下单</th>
              <th className={`${thClass} min-w-[80px]`}>增补单</th>
              <th className={`${thClass} w-[84px]`}>有效总派单</th>
              <th className={`${thClass} w-[76px]`}>售后金</th>
              {detailMode ? (
                <th className={`${thClass} w-[68px]`}>定制空间</th>
              ) : null}
              {canEditIssueTags ? (
                <th className={`${thClass} min-w-[140px]`}>问题标签</th>
              ) : null}
              <th className={`${thClass} min-w-[100px]`}>备注</th>
              {detailMode ? (
                <>
                  <th className={`${thClass} w-[72px]`}>客户姓名</th>
                  <th className={`${thClass} w-[96px]`}>客户电话</th>
                </>
              ) : null}
              <th className={`${thClass} w-[80px] whitespace-nowrap`}>
                派单时间
              </th>
              {canDelete ? (
                <th className={`${thClass} w-[72px] whitespace-nowrap`}>
                  操作
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => {
              const orderSupplements = getSupplementsForOrder(
                supplements,
                order.id,
              );
              const supplementTotal = sumSupplementAmount(supplements, order.id);
              const combined = getCombinedOrderAmount(order, supplements);
              const remarkText = formatWorkflowRemark(order);
              const customerName = displayCustomerNameColumn(order);
              const customerPhone = displayCustomerPhoneColumn(order);
              const rowReadOnly =
                readOnly || (isOrderReadOnly?.(order) ?? false);
              const rowCanReassign = canReassign && !rowReadOnly;
              const rowCanEditAfterSales = canEditAfterSales && !rowReadOnly;

              return (
                <tr key={order.id} className="hover:bg-slate-50/50">
                  <td className={tdClass}>
                    <OrderAnomalyName
                      order={order}
                      as="p"
                      className="max-w-[200px] text-sm leading-snug"
                      defaultClassName="text-sm font-medium text-slate-900"
                      title={displayCustomerAddressColumn(order)}
                      {...anomalyOptions}
                    >
                      {displayCustomerAddressColumn(order) || "—"}
                    </OrderAnomalyName>
                  </td>
                  {showDesigner ? (
                    <td className={tdClass}>
                      {rowCanReassign && onReassign && order.designer ? (
                        <div className="space-y-1.5">
                          <select
                            value={order.designer}
                            onChange={(e) =>
                              onReassign(
                                order.id,
                                e.target.value as DesignerName,
                              )
                            }
                            className="w-full min-w-[92px] rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                          >
                            {designerRoster.map((d) => (
                              <option key={d.name} value={d.name}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                          <AssignmentInfo order={order} compact />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="font-medium text-slate-800">
                            {order.designer ?? "未指派"}
                          </span>
                          <AssignmentInfo order={order} compact />
                        </div>
                      )}
                    </td>
                  ) : null}
                  <td className={`${tdClass} text-xs`}>{order.dispatchStore}</td>
                  <td className={tdClass}>
                    <div className="space-y-1">
                      <StatusBadge status={order.status} />
                      <OrderAnomalyBadges
                        order={order}
                        compact
                        {...anomalyOptions}
                      />
                    </div>
                  </td>
                  <td className={`${tdClass} text-xs`}>
                    {order.dispatcherName || "—"}
                  </td>
                  {detailMode ? (
                    <td
                      className={`${tdClass} text-xs ${order.deposit <= 0 ? "text-amber-600" : ""}`}
                    >
                      {order.deposit > 0
                        ? `¥${order.deposit.toLocaleString("zh-CN")}`
                        : "未交"}
                    </td>
                  ) : null}
                  <td className={`${tdClass} text-xs`}>
                    {formatBudget(order.budget)}
                  </td>
                  <td className={`${tdClass} text-xs font-medium text-indigo-700`}>
                    {formatOrderAmount(order.orderAmount)}
                  </td>
                  <td className={`${tdClass} text-xs`}>
                    {orderSupplements.length > 0 ? (
                      <div className="space-y-0.5">
                        <p className="font-medium text-teal-700">
                          {orderSupplements.length} 笔 ·{" "}
                          {formatCurrency(supplementTotal)}
                        </p>
                        {detailMode ? (
                          <ul className="text-[11px] text-slate-500">
                            {orderSupplements.map((s) => (
                              <li key={s.id}>
                                {formatCurrency(s.supplementAmount)}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={`${tdClass} text-xs font-semibold text-violet-700`}>
                    {combined > 0 ? formatCurrency(combined) : "—"}
                  </td>
                  <td className={tdClass}>
                    {rowCanEditAfterSales && onSetAfterSalesAmount ? (
                      <AfterSalesCell
                        orderId={order.id}
                        amount={order.afterSalesAmount}
                        onSave={onSetAfterSalesAmount}
                      />
                    ) : (
                      <span className="text-xs">
                        {formatAfterSalesAmount(order.afterSalesAmount)}
                      </span>
                    )}
                  </td>
                  {detailMode ? (
                    <td className={`${tdClass} text-xs`}>
                      {formatSpaces(order.spaces)}
                    </td>
                  ) : null}
                  {canEditIssueTags && onSetIssueTags ? (
                    <td className={`${tdClass} min-w-[140px]`}>
                      <OrderIssueTagsCell
                        tags={order.issueTags ?? []}
                        onSave={(tags) => onSetIssueTags(order.id, tags)}
                      />
                    </td>
                  ) : null}
                  <td
                    className={`${tdClass} max-w-[180px] text-xs leading-snug text-slate-600`}
                    title={remarkText}
                  >
                    {remarkText || "—"}
                  </td>
                  {detailMode ? (
                    <>
                      <td className={tdClass}>
                        <OrderAnomalyName
                          order={order}
                          defaultClassName="text-xs text-slate-800"
                          {...anomalyOptions}
                        >
                          {customerName || "—"}
                        </OrderAnomalyName>
                      </td>
                      <td className={`${tdClass} text-xs text-slate-800`}>
                        {customerPhone || "—"}
                      </td>
                    </>
                  ) : null}
                  <td className={`${tdClass} whitespace-nowrap text-xs text-slate-500`}>
                    {formatOrderDateDay(order.createdAt)}
                  </td>
                  {canDelete && onDeleteOrder ? (
                    <td className={tdClass}>
                      <DeleteOrderButton
                        orderId={order.id}
                        customerLabel={displayCustomerAddressColumn(order)}
                        onDelete={onDeleteOrder}
                        compact
                      />
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-400">
        共 {orders.length} 笔订单
        {detailMode ? " · 单笔地址详情（完整字段）" : " · 精简列表"}
        {detailMode ? "" : " · 可用查找框按姓名/电话检索"}
        {readOnly ? " · 只读" : ""}
      </p>
    </div>
  );
}
