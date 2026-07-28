import type { StaffAccessLevel } from "./staff-access";
import { ACCESS_LEVEL_LABELS } from "./staff-access";
import type { DispatcherPerformanceRow } from "./dispatcher-performance";
import type { DesignerPerformanceRow } from "./designer-performance";
import type { SessionUser } from "./permissions";
import { isAdminAccess } from "./permissions";

/** 提成比例（百分数，如 3 表示 3%） */
export interface CommissionRateConfig {
  dispatcherSignedPercent: number;
  dispatcherDepositPercent: number;
  dispatcherPreMeasureBonus: number;
  dispatcherOrderedPercent: number;
  designerOrderedPercent: number;
  designerSupplementPercent: number;
}

/** 可向管理员申请开放提成底稿的权限级别（不含 admin） */
export const COMMISSION_VISIBILITY_LEVELS: StaffAccessLevel[] = [
  "store_manager",
  "design_manager",
  "general_manager",
];

export interface CommissionSettings {
  rates: CommissionRateConfig;
  /** 各权限级别是否可见提成底稿导出；默认全部关闭 */
  visibleFor: Partial<Record<StaffAccessLevel, boolean>>;
}

export const DEFAULT_COMMISSION_RATES: CommissionRateConfig = {
  dispatcherSignedPercent: 3,
  dispatcherDepositPercent: 0,
  dispatcherPreMeasureBonus: 0,
  dispatcherOrderedPercent: 0,
  designerOrderedPercent: 3,
  designerSupplementPercent: 1.2,
};

export const DEFAULT_COMMISSION_SETTINGS: CommissionSettings = {
  rates: { ...DEFAULT_COMMISSION_RATES },
  visibleFor: {},
};

function clampPercent(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, Math.round(n * 100) / 100));
}

function clampBonus(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.round(n));
}

export function normalizeCommissionRates(
  raw: Partial<CommissionRateConfig> | undefined,
): CommissionRateConfig {
  const d = DEFAULT_COMMISSION_RATES;
  return {
    dispatcherSignedPercent: clampPercent(
      raw?.dispatcherSignedPercent,
      d.dispatcherSignedPercent,
    ),
    dispatcherDepositPercent: clampPercent(
      raw?.dispatcherDepositPercent,
      d.dispatcherDepositPercent,
    ),
    dispatcherPreMeasureBonus: clampBonus(
      raw?.dispatcherPreMeasureBonus,
      d.dispatcherPreMeasureBonus,
    ),
    dispatcherOrderedPercent: clampPercent(
      raw?.dispatcherOrderedPercent,
      d.dispatcherOrderedPercent,
    ),
    designerOrderedPercent: clampPercent(
      raw?.designerOrderedPercent,
      d.designerOrderedPercent,
    ),
    designerSupplementPercent: clampPercent(
      raw?.designerSupplementPercent,
      d.designerSupplementPercent,
    ),
  };
}

export function normalizeCommissionSettings(
  raw: Partial<CommissionSettings> | undefined,
): CommissionSettings {
  const visibleFor: Partial<Record<StaffAccessLevel, boolean>> = {};
  if (raw?.visibleFor && typeof raw.visibleFor === "object") {
    for (const level of COMMISSION_VISIBILITY_LEVELS) {
      if (raw.visibleFor[level] === true) {
        visibleFor[level] = true;
      }
    }
  }
  return {
    rates: normalizeCommissionRates(raw?.rates),
    visibleFor,
  };
}

export function commissionRatesEqual(
  a: CommissionRateConfig,
  b: CommissionRateConfig,
): boolean {
  return (
    a.dispatcherSignedPercent === b.dispatcherSignedPercent &&
    a.dispatcherDepositPercent === b.dispatcherDepositPercent &&
    a.dispatcherPreMeasureBonus === b.dispatcherPreMeasureBonus &&
    a.dispatcherOrderedPercent === b.dispatcherOrderedPercent &&
    a.designerOrderedPercent === b.designerOrderedPercent &&
    a.designerSupplementPercent === b.designerSupplementPercent
  );
}

export function commissionSettingsEqual(
  a: CommissionSettings,
  b: CommissionSettings,
): boolean {
  if (!commissionRatesEqual(a.rates, b.rates)) return false;
  for (const level of COMMISSION_VISIBILITY_LEVELS) {
    if (Boolean(a.visibleFor[level]) !== Boolean(b.visibleFor[level])) {
      return false;
    }
  }
  return true;
}

export function canViewCommissionExport(
  user: SessionUser | null,
  settings: CommissionSettings,
): boolean {
  if (!user) return false;
  if (isAdminAccess(user)) return true;
  return settings.visibleFor[user.accessLevel] === true;
}

export function canManageCommissionSettings(
  user: SessionUser | null,
): boolean {
  return isAdminAccess(user);
}

export function formatCommissionRatesSummary(rates: CommissionRateConfig): string {
  return [
    `派单：签约×${rates.dispatcherSignedPercent}%`,
    `定金×${rates.dispatcherDepositPercent}%`,
    rates.dispatcherPreMeasureBonus > 0
      ? `量尺前补定+${rates.dispatcherPreMeasureBonus}元/笔`
      : null,
    rates.dispatcherOrderedPercent > 0
      ? `下单×${rates.dispatcherOrderedPercent}%`
      : null,
    `设计：下单×${rates.designerOrderedPercent}%`,
    `增补×${rates.designerSupplementPercent}%`,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function commissionVisibilityLabel(level: StaffAccessLevel): string {
  return ACCESS_LEVEL_LABELS[level];
}

export function computeDispatcherCommissionBase(
  row: DispatcherPerformanceRow,
  rates: CommissionRateConfig,
): number {
  return Math.round(
    row.signedContractAmount * (rates.dispatcherSignedPercent / 100) +
      row.depositTotal * (rates.dispatcherDepositPercent / 100) +
      row.preMeasureDepositCount * rates.dispatcherPreMeasureBonus +
      row.orderedAmount * (rates.dispatcherOrderedPercent / 100),
  );
}

export function computeDesignerCommissionBase(
  row: DesignerPerformanceRow,
  supplementAmount: number,
  rates: CommissionRateConfig,
): number {
  return Math.round(
    row.orderedAmount * (rates.designerOrderedPercent / 100) +
      supplementAmount * (rates.designerSupplementPercent / 100),
  );
}
