import { averageCustomerRating } from "./customer-flow";
import { getPeriodBounds, type PeriodSelection } from "./period-filter";
import type { CustomerRatings, Order } from "./types";

export const SKIPPED_ELECTRONIC_DEFAULT_STARS = 4 as const;

/** 低于此分数（不含）视为低评 */
export const BAD_REVIEW_STAR_THRESHOLD = 3 as const;

export const ACCEPTANCE_RATING_ROLE_LABELS: {
  key: keyof CustomerRatings;
  label: string;
}[] = [
  { key: "salesManager", label: "客户经理" },
  { key: "designer", label: "设计师" },
  { key: "installTeam", label: "安装师" },
  { key: "product", label: "整体" },
];

export function buildDefaultSkippedElectronicRatings(): CustomerRatings {
  return {
    salesManager: SKIPPED_ELECTRONIC_DEFAULT_STARS,
    designer: SKIPPED_ELECTRONIC_DEFAULT_STARS,
    installTeam: SKIPPED_ELECTRONIC_DEFAULT_STARS,
    product: SKIPPED_ELECTRONIC_DEFAULT_STARS,
  };
}

export function isSkippedElectronicAcceptance(order: Order): boolean {
  return (
    order.status === "已验收" &&
    Boolean(order.acceptance?.skippedElectronicAccept)
  );
}

export function isBadReviewStar(stars: number): boolean {
  return stars < BAD_REVIEW_STAR_THRESHOLD;
}

/** 已验收订单的有效四维评分（含无电子默认四星） */
export function getEffectiveAcceptanceRatings(
  order: Order,
): CustomerRatings | null {
  if (order.status !== "已验收") return null;
  if (order.acceptance?.ratings) return order.acceptance.ratings;
  if (isSkippedElectronicAcceptance(order)) {
    return buildDefaultSkippedElectronicRatings();
  }
  return null;
}

export function getEffectiveCompositeRating(order: Order): number | null {
  const ratings = getEffectiveAcceptanceRatings(order);
  if (!ratings) return null;
  return averageCustomerRating(ratings);
}

export function buildBadReviewLabelsFromRatings(
  ratings: CustomerRatings,
): string[] {
  const avg = averageCustomerRating(ratings);
  if (avg < BAD_REVIEW_STAR_THRESHOLD) return ["综合低评"];
  return ACCEPTANCE_RATING_ROLE_LABELS.filter(({ key }) =>
    isBadReviewStar(ratings[key]),
  ).map(({ label }) => `${label}低评`);
}

export function buildAcceptanceBadReviewLabels(order: Order): string[] {
  if (isSkippedElectronicAcceptance(order)) return [];
  const ratings = getEffectiveAcceptanceRatings(order);
  if (!ratings) return [];
  return buildBadReviewLabelsFromRatings(ratings);
}

export function buildAcceptanceBadReviewRemarks(
  ratings: CustomerRatings,
): string[] {
  return buildBadReviewLabelsFromRatings(ratings);
}

export function orderHasBadAcceptanceReview(order: Order): boolean {
  if (isSkippedElectronicAcceptance(order)) return false;
  const avg = getEffectiveCompositeRating(order);
  return avg != null && avg < BAD_REVIEW_STAR_THRESHOLD;
}

export function orderHasLowDimensionRating(order: Order): boolean {
  if (isSkippedElectronicAcceptance(order)) return false;
  const ratings = getEffectiveAcceptanceRatings(order);
  if (!ratings) return false;
  if (orderHasBadAcceptanceReview(order)) return false;
  return ACCEPTANCE_RATING_ROLE_LABELS.some(({ key }) =>
    isBadReviewStar(ratings[key]),
  );
}

export function countBadAcceptanceReviews(orders: Order[]): number {
  return orders.filter(orderHasBadAcceptanceReview).length;
}

export function countLowDimensionReviews(orders: Order[]): number {
  return orders.filter(orderHasLowDimensionRating).length;
}

/** 周期内新验收且含维度低评（按进入「已验收」时间） */
export function countLowDimensionReviewsInPeriod(
  orders: Order[],
  period: PeriodSelection,
  ref = new Date(),
): number {
  const bounds = getPeriodBounds(period, ref);
  if (!bounds) return countLowDimensionReviews(orders);
  return orders.filter((order) => {
    if (!orderHasLowDimensionRating(order)) return false;
    const at = order.statusEnteredAt?.["已验收"];
    if (!at) return false;
    const t = new Date(at).getTime();
    return (
      Number.isFinite(t) &&
      t >= bounds.start.getTime() &&
      t < bounds.end.getTime()
    );
  }).length;
}
