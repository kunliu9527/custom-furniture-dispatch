import {
  buildGlobalMonthlyDigest,
  buildGlobalWeeklyDigest,
  formatGlobalMonthlyDigestText,
  formatGlobalWeeklyDigestText,
} from "./global-report";
import {
  buildMonthlyDigest,
  formatMonthlyDigestText,
  type MonthlyDigest,
} from "./monthly-report";
import { toYearMonth, shiftYearMonth, type PeriodSelection } from "./period-filter";
import type { ReportPersonScope } from "./evaluation-scope";
import type { ReportScope } from "./report-hub-config";
import type { StaffRecord } from "./staff-roster";
import type { Order, SupplementOrder } from "./types";
import {
  buildWeeklyDigest,
  formatWeeklyDigestText,
  type WeeklyDigest,
} from "./weekly-report";

export type DigestHistoryKind = "weekly" | "monthly";

export interface DigestHistoryRecord {
  id: string;
  kind: DigestHistoryKind;
  label: string;
  text: string;
  archivedAt: string;
  stats: {
    newDispatchCount: number;
    orderedCount: number;
    orderedAmount: number;
  };
}

const STORAGE_PREFIX = "custom-furniture-dispatch-digest-history:";

function storageKey(username: string, scope: ReportScope) {
  return `${STORAGE_PREFIX}${scope}:${username}`;
}

function recordKey(kind: DigestHistoryKind, id: string) {
  return `${kind}:${id}`;
}

export function weeklyDigestToHistoryRecord(
  digest: WeeklyDigest,
  scope: ReportScope = "manager",
): DigestHistoryRecord {
  const text =
    scope === "global" && "workflow" in digest
      ? formatGlobalWeeklyDigestText(digest as ReturnType<typeof buildGlobalWeeklyDigest>)
      : formatWeeklyDigestText(digest);
  return {
    id: digest.weekId,
    kind: "weekly",
    label: digest.weekLabel,
    text,
    archivedAt: new Date().toISOString(),
    stats: {
      newDispatchCount: digest.newDispatchCount,
      orderedCount: digest.orderedCount,
      orderedAmount: digest.orderedAmount,
    },
  };
}

export function monthlyDigestToHistoryRecord(
  digest: MonthlyDigest,
  scope: ReportScope = "manager",
): DigestHistoryRecord {
  const id =
    digest.period.preset === "custom" && digest.period.yearMonth
      ? digest.period.yearMonth
      : toYearMonth(new Date(digest.generatedAt));
  const text =
    scope === "global" && "workflow" in digest
      ? formatGlobalMonthlyDigestText(
          digest as ReturnType<typeof buildGlobalMonthlyDigest>,
        )
      : formatMonthlyDigestText(digest);
  return {
    id,
    kind: "monthly",
    label: digest.periodLabel,
    text,
    archivedAt: new Date().toISOString(),
    stats: {
      newDispatchCount: digest.newDispatchCount,
      orderedCount: digest.orderedCount,
      orderedAmount: digest.orderedAmount,
    },
  };
}

export function loadDigestHistory(
  username: string | undefined,
  scope: ReportScope = "manager",
): DigestHistoryRecord[] {
  if (!username || typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(username, scope));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DigestHistoryRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function upsertDigestHistory(
  username: string,
  record: DigestHistoryRecord,
  scope: ReportScope = "manager",
): void {
  if (typeof window === "undefined") return;
  const existing = loadDigestHistory(username, scope);
  const key = recordKey(record.kind, record.id);
  const next = [
    record,
    ...existing.filter((r) => recordKey(r.kind, r.id) !== key),
  ];
  localStorage.setItem(storageKey(username, scope), JSON.stringify(next));
}

export function buildPastDigestHistory(
  orders: Order[],
  supplements: SupplementOrder[],
  staffRecords: StaffRecord[] = [],
  options: {
    maxWeeks?: number;
    maxMonths?: number;
    scope?: ReportScope;
    personScope?: ReportPersonScope;
  } = {},
): DigestHistoryRecord[] {
  const scope = options.scope ?? "manager";
  const personScope = options.personScope;
  const maxWeeks = options.maxWeeks ?? 12;
  const maxMonths = options.maxMonths ?? 12;
  const records: DigestHistoryRecord[] = [];
  const now = new Date();

  for (let weeksAgo = 1; weeksAgo <= maxWeeks; weeksAgo += 1) {
    const ref = new Date(now);
    ref.setDate(ref.getDate() - weeksAgo * 7);
    const digest =
      scope === "global"
        ? buildGlobalWeeklyDigest(
            orders,
            supplements,
            weeksAgo === 1
              ? { preset: "lastWeek" }
              : { preset: "thisWeek" },
            staffRecords,
            ref,
            personScope,
          )
        : buildWeeklyDigest(
            orders,
            supplements,
            staffRecords,
            personScope?.designerNames ?? null,
            ref,
          );
    records.push(weeklyDigestToHistoryRecord(digest, scope));
  }

  let ym = toYearMonth(now);
  for (let monthsAgo = 1; monthsAgo <= maxMonths; monthsAgo += 1) {
    const prev = shiftYearMonth(ym, -1);
    if (!prev) break;
    ym = prev;
    const period: PeriodSelection = { preset: "custom", yearMonth: ym };
    const digest =
      scope === "global"
        ? buildGlobalMonthlyDigest(
            orders,
            supplements,
            period,
            staffRecords,
            now,
            personScope,
          )
        : buildMonthlyDigest(
            orders,
            supplements,
            period,
            staffRecords,
            personScope?.designerNames ?? null,
            now,
            personScope?.dispatcherNames ?? null,
          );
    records.push(monthlyDigestToHistoryRecord(digest, scope));
  }

  return records;
}

export function mergeDigestHistoryRecords(
  saved: DigestHistoryRecord[],
  generated: DigestHistoryRecord[],
): DigestHistoryRecord[] {
  const map = new Map<string, DigestHistoryRecord>();
  for (const record of generated) {
    map.set(recordKey(record.kind, record.id), record);
  }
  for (const record of saved) {
    map.set(recordKey(record.kind, record.id), record);
  }
  return [...map.values()].sort((a, b) => {
    if (a.kind !== b.kind) {
      return a.kind === "monthly" ? -1 : 1;
    }
    return b.id.localeCompare(a.id);
  });
}
