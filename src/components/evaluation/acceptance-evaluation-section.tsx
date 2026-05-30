"use client";

import { CustomerRatingTable } from "@/components/shared/customer-rating-table";
import { PersonRatingLeaderboard } from "@/components/shared/person-rating-leaderboard";
import { EvaluationSectionToggle } from "@/components/evaluation/evaluation-section-toggle";
import {
  getAcceptanceEvaluationSummary,
  getAcceptancePersonRanking,
  getAcceptanceRatingRecords,
  getAcceptanceStoreRows,
} from "@/lib/acceptance-evaluation-stats";
import type { EvaluationSubView } from "@/lib/evaluation-ui-persistence";
import type { Order, StoreName } from "@/lib/types";

interface AcceptanceEvaluationSectionProps {
  orders: Order[];
  storeNames: StoreName[] | null;
  scopeLabel: string | null;
  subView: EvaluationSubView;
  onSubViewChange: (view: EvaluationSubView) => void;
  hideNav?: boolean;
}

export function AcceptanceEvaluationSection({
  orders,
  storeNames,
  scopeLabel,
  subView,
  onSubViewChange,
  hideNav = false,
}: AcceptanceEvaluationSectionProps) {
  const summary = getAcceptanceEvaluationSummary(orders);
  const storeRows = getAcceptanceStoreRows(orders, storeNames);
  const ranking = getAcceptancePersonRanking(orders);
  const records = getAcceptanceRatingRecords(orders);
  const entries = records.flatMap((r) => r.entries);

  return (
    <section className="space-y-4">
      {!hideNav ? (
        <div className="flex flex-wrap items-start gap-3">
          <EvaluationSectionToggle
            title="验收归总"
            active={subView === "aggregate"}
            onSelect={() => onSubViewChange("aggregate")}
            suffix={
              <>
                {scopeLabel ? `所属：${scopeLabel} · ` : null}
                已评价 {summary.ratedCount} 单 · 均分 {summary.avgOverall.toFixed(1)} 星
              </>
            }
          />
          <EvaluationSectionToggle
            title="验收明细"
            active={subView === "workflow"}
            onSelect={() => onSubViewChange("workflow")}
            suffix={`${storeRows.filter((r) => r.ratedCount > 0).length} 个门店有评价`}
          />
          <EvaluationSectionToggle
            title="人员均分排名"
            active={subView === "ranking"}
            onSelect={() => onSubViewChange("ranking")}
          />
        </div>
      ) : null}

      {subView === "aggregate" ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="已评价" value={`${summary.ratedCount} 单`} />
          <Stat label="综合均分" value={`${summary.avgOverall.toFixed(1)} 星`} />
          <Stat
            label="电子验收率"
            value={`${Math.round(summary.electronicRate * 100)}%`}
          />
        </div>
      ) : null}

      {subView === "workflow" ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2">门店</th>
                <th className="px-3 py-2">已评价</th>
                <th className="px-3 py-2">待扫码</th>
                <th className="px-3 py-2">均分</th>
                <th className="px-3 py-2">电子验收率</th>
              </tr>
            </thead>
            <tbody>
              {storeRows.map((row) => (
                <tr key={row.key} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium">{row.label}</td>
                  <td className="px-3 py-2">{row.ratedCount}</td>
                  <td className="px-3 py-2">{row.pendingCount}</td>
                  <td className="px-3 py-2">
                    {row.ratedCount > 0 ? `${row.avgOverall.toFixed(1)} 星` : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {row.ratedCount > 0
                      ? `${Math.round(row.electronicRate * 100)}%`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {subView === "ranking" ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <PersonRatingLeaderboard title="派单人评价均分" items={ranking.dispatchers} />
            <PersonRatingLeaderboard title="设计师评价均分" items={ranking.designers} />
            <PersonRatingLeaderboard title="安装师评价均分" items={ranking.installers} />
          </div>
          <CustomerRatingTable entries={entries} mode="order" maxRows={30} />
        </div>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
