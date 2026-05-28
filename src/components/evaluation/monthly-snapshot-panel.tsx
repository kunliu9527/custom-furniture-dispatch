"use client";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/client-api";
import { compareMonthlyOverview } from "@/lib/monthly-snapshot-build";
import { buildMonthlyMetricsSnapshot } from "@/lib/monthly-snapshot-build";
import { formatDispatchMoney } from "@/lib/dispatch-totals";
import { formatPeriodLabel, type PeriodSelection } from "@/lib/period-filter";
import type { MonthlyMetricsSnapshot } from "@/lib/monthly-snapshot-types";
import type { Order, SupplementOrder } from "@/lib/types";
import type { StaffRecord } from "@/lib/staff-roster";
import { useCallback, useEffect, useMemo, useState } from "react";

interface MonthlySnapshotPanelProps {
  orders: Order[];
  supplements: SupplementOrder[];
  period: PeriodSelection;
  designerNames: string[] | null;
  staffRecords: StaffRecord[];
  scopeLabel?: string;
  savedBy?: string;
}

function prevMonthYm(ym: string): string | null {
  const m = /^(\d{4})-(\d{2})$/.exec(ym);
  if (!m) return null;
  let y = Number(m[1]);
  let mo = Number(m[2]) - 1;
  if (mo < 1) {
    mo = 12;
    y -= 1;
  }
  return `${y}-${String(mo).padStart(2, "0")}`;
}

export function MonthlySnapshotPanel({
  orders,
  supplements,
  period,
  designerNames,
  staffRecords,
  scopeLabel,
  savedBy,
}: MonthlySnapshotPanelProps) {
  const [savedSnapshot, setSavedSnapshot] =
    useState<MonthlyMetricsSnapshot | null>(null);
  const [prevSnapshot, setPrevSnapshot] =
    useState<MonthlyMetricsSnapshot | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "ok" | "err">(
    "idle",
  );
  const [indexMonths, setIndexMonths] = useState<string[]>([]);

  const liveSnapshot = useMemo(
    () =>
      buildMonthlyMetricsSnapshot(orders, supplements, period, {
        savedBy,
        scopeLabel,
        designerNames,
        staffRecords,
      }),
    [
      orders,
      supplements,
      period,
      savedBy,
      scopeLabel,
      designerNames,
      staffRecords,
    ],
  );

  const yearMonth = liveSnapshot.yearMonth;
  const prevYm = prevMonthYm(yearMonth);

  const loadSnapshots = useCallback(async () => {
    try {
      const indexRes = await apiFetch("/api/monthly-snapshots");
      if (indexRes.ok) {
        const index = (await indexRes.json()) as {
          items: { yearMonth: string }[];
        };
        setIndexMonths(index.items?.map((i) => i.yearMonth) ?? []);
      }
      const curRes = await apiFetch(
        `/api/monthly-snapshots?month=${encodeURIComponent(yearMonth)}`,
      );
      if (curRes.ok) {
        setSavedSnapshot((await curRes.json()) as MonthlyMetricsSnapshot);
      } else {
        setSavedSnapshot(null);
      }
      if (prevYm) {
        const prevRes = await apiFetch(
          `/api/monthly-snapshots?month=${encodeURIComponent(prevYm)}`,
        );
        if (prevRes.ok) {
          setPrevSnapshot((await prevRes.json()) as MonthlyMetricsSnapshot);
        } else {
          setPrevSnapshot(null);
        }
      }
    } catch {
      /* 本地无 API 时静默 */
    }
  }, [yearMonth, prevYm]);

  useEffect(() => {
    void loadSnapshots();
  }, [loadSnapshots]);

  const compare = useMemo(
    () => compareMonthlyOverview(liveSnapshot, prevSnapshot),
    [liveSnapshot, prevSnapshot],
  );

  async function handleSave() {
    setSaveState("saving");
    try {
      const res = await apiFetch("/api/monthly-snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(liveSnapshot),
      });
      if (!res.ok) {
        setSaveState("err");
        return;
      }
      setSavedSnapshot(await res.json());
      setSaveState("ok");
      void loadSnapshots();
    } catch {
      setSaveState("err");
    }
  }

  const periodLabel = formatPeriodLabel(period);

  return (
    <section className="rounded-xl border border-slate-200 bg-white px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">月度快照对比</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {periodLabel} 实时数据
            {savedSnapshot
              ? ` · 已存档 ${new Date(savedSnapshot.savedAt).toLocaleDateString("zh-CN")}`
              : " · 尚未存档"}
            {prevSnapshot ? ` · 对比 ${prevYm}` : ""}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={saveState === "saving"}
          onClick={handleSave}
        >
          {saveState === "saving"
            ? "保存中…"
            : saveState === "ok"
              ? "已保存"
              : "保存本月快照"}
        </Button>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {compare.map((row) => (
          <div
            key={row.label}
            className="rounded-lg border border-slate-100 bg-slate-50/80 px-2 py-2"
          >
            <dt className="text-[10px] text-slate-500">{row.label}</dt>
            <dd className="text-sm font-semibold tabular-nums text-slate-900">
              {row.label === "下单金额"
                ? formatDispatchMoney(row.current)
                : row.current}
            </dd>
            {row.delta != null ? (
              <dd
                className={`text-[11px] tabular-nums ${
                  row.delta > 0
                    ? "text-emerald-600"
                    : row.delta < 0
                      ? "text-rose-600"
                      : "text-slate-400"
                }`}
              >
                {row.delta > 0 ? "+" : ""}
                {row.label === "下单金额"
                  ? formatDispatchMoney(row.delta)
                  : row.delta}{" "}
                vs 上月存档
              </dd>
            ) : (
              <dd className="text-[11px] text-slate-400">无上月存档</dd>
            )}
          </div>
        ))}
      </dl>

      {indexMonths.length > 0 ? (
        <p className="mt-2 text-[11px] text-slate-400">
          历史存档：{indexMonths.slice(0, 6).join("、")}
          {indexMonths.length > 6 ? " …" : ""}
        </p>
      ) : null}

      {saveState === "err" ? (
        <p className="mt-2 text-xs text-rose-600">
          保存失败（纯静态部署无服务端时，请导出 CSV 代替）
        </p>
      ) : null}
    </section>
  );
}
