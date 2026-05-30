import {
  DEFAULT_PERIOD,
  isValidPeriodPreset,
  type PeriodSelection,
} from "./period-filter";

function storageKey(username: string) {
  return `custom-furniture-dispatch-workbench-period:${username}`;
}

function parsePeriod(raw: unknown): PeriodSelection {
  if (!raw || typeof raw !== "object") return DEFAULT_PERIOD;
  const p = raw as Partial<PeriodSelection>;
  if (isValidPeriodPreset(p.preset)) {
    return {
      preset: p.preset,
      yearMonth: typeof p.yearMonth === "string" ? p.yearMonth : undefined,
    };
  }
  return DEFAULT_PERIOD;
}

/** 综合看板 / 项目节点 / 验收与交付 / 设计师工作台 共享统计周期 */
export function loadWorkbenchPeriod(
  username: string | undefined,
): PeriodSelection | null {
  if (!username || typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(username));
    if (!raw) return null;
    return parsePeriod(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveWorkbenchPeriod(
  username: string,
  period: PeriodSelection,
): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(storageKey(username), JSON.stringify(period));
}
