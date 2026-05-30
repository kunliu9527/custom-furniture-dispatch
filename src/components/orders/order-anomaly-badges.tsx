"use client";

import {
  formatOrderAnomalySummary,
  getOrderAnomalyMarkers,
  getOrderDisplayNameClass,
  type OrderAnomalyMarker,
  type OrderAnomalyOptions,
  type OrderAnomalySeverity,
} from "@/lib/order-anomaly";
import type { Order } from "@/lib/types";
import type { ElementType, ReactNode } from "react";

const SEVERITY_CLASS: Record<OrderAnomalySeverity, string> = {
  danger: "bg-red-50 text-red-600 ring-red-200",
  mild: "bg-rose-50 text-rose-600 ring-rose-200",
  warn: "bg-amber-50 text-amber-800 ring-amber-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
};

interface OrderAnomalyBadgesProps extends OrderAnomalyOptions {
  order: Order;
  /** 紧凑模式用于表格/列表 */
  compact?: boolean;
  max?: number;
  className?: string;
}

export function OrderAnomalyBadges({
  order,
  compact = false,
  max,
  className = "",
  ...options
}: OrderAnomalyBadgesProps) {
  const markers = getOrderAnomalyMarkers(order, options);
  if (markers.length === 0) return null;

  const shown = max != null ? markers.slice(0, max) : markers;
  const hiddenCount = markers.length - shown.length;

  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      {shown.map((marker) => (
        <AnomalyBadge key={marker.id} marker={marker} compact={compact} />
      ))}
      {hiddenCount > 0 ? (
        <span className="text-[10px] text-slate-400">+{hiddenCount}</span>
      ) : null}
    </span>
  );
}

function AnomalyBadge({
  marker,
  compact,
}: {
  marker: OrderAnomalyMarker;
  compact: boolean;
}) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-md font-medium ring-1 ${SEVERITY_CLASS[marker.severity]} ${
        compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
      }`}
    >
      {marker.label}
    </span>
  );
}

export function orderHasDangerAnomaly(
  order: Order,
  options?: OrderAnomalyOptions,
): boolean {
  return getOrderAnomalyMarkers(order, options).some(
    (m) => m.severity === "danger",
  );
}

export function OrderAnomalyName({
  order,
  children,
  className = "",
  defaultClassName = "text-slate-900 font-medium",
  as: Component = "span",
  title,
  ...options
}: {
  order: Order;
  children: ReactNode;
  className?: string;
  defaultClassName?: string;
  as?: ElementType;
  title?: string;
} & OrderAnomalyOptions) {
  const displayClass = getOrderDisplayNameClass(order, options, defaultClassName);
  return (
    <Component
      className={[displayClass, className].filter(Boolean).join(" ")}
      title={title}
    >
      {children}
    </Component>
  );
}

export { getOrderDisplayNameClass, orderAnomalyHighlightLevel } from "@/lib/order-anomaly";

export function OrderAnomalySummaryLine({
  orders,
  className = "mt-1 text-xs text-rose-600",
  ...options
}: { orders: Order[]; className?: string } & OrderAnomalyOptions) {
  const text = formatOrderAnomalySummary(orders, options);
  if (!text) return null;
  return <p className={className}>{text}</p>;
}
