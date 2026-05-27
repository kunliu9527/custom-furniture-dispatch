import { CUSTOM_SPACES } from "./constants";
import type { CustomSpace } from "./types";

export function formatBudget(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "—";
  return formatCurrency(amount);
}

export function normalizeBudget(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    const direct = Number(trimmed);
    if (Number.isFinite(direct) && direct >= 0) return direct;
    const legacyRanges: Record<string, number> = {
      "5万以下": 30000,
      "5-10万": 75000,
      "10-20万": 150000,
      "20-30万": 250000,
      "30万以上": 350000,
    };
    if (legacyRanges[trimmed]) return legacyRanges[trimmed];
  }
  return 0;
}

export function formatAfterSalesAmount(
  amount: number | null | undefined,
): string {
  if (amount == null || amount <= 0) return "—";
  return formatCurrency(amount);
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString("zh-CN")}`;
}

export function formatOrderAmount(amount: number | null | undefined): string {
  if (amount == null || amount <= 0) return "—";
  return formatCurrency(amount);
}

export function formatSpaces(spaces: CustomSpace[]): string {
  if (!spaces.length) return "—";
  return spaces.join("、");
}

export function normalizeSpaces(
  value: unknown,
  legacySingle?: unknown,
): CustomSpace[] {
  const valid = new Set(CUSTOM_SPACES);
  if (Array.isArray(value)) {
    const picked = value.filter((s): s is CustomSpace =>
      valid.has(s as CustomSpace),
    );
    return picked.length > 0 ? picked : ["全屋"];
  }
  if (typeof legacySingle === "string" && valid.has(legacySingle as CustomSpace)) {
    return [legacySingle as CustomSpace];
  }
  if (typeof value === "string" && valid.has(value as CustomSpace)) {
    return [value as CustomSpace];
  }
  return ["全屋"];
}
