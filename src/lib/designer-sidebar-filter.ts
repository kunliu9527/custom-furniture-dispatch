import type { OrderStatus } from "./types";

export type DesignerSidebarFilter = OrderStatus | "全部" | "增补单";

export function isDesignerSupplementView(
  filter: DesignerSidebarFilter,
): filter is "增补单" {
  return filter === "增补单";
}
