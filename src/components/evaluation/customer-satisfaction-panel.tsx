"use client";

import { CustomerRatingTable } from "@/components/shared/customer-rating-table";
import { PersonRatingLeaderboard } from "@/components/shared/person-rating-leaderboard";
import {
  aggregatePersonRatings,
  buildCustomerRatingEntries,
  summarizeCustomerRatings,
} from "@/lib/customer-ratings";
import type { Order } from "@/lib/types";

interface CustomerSatisfactionPanelProps {
  orders: Order[];
}

export function CustomerSatisfactionPanel({
  orders,
}: CustomerSatisfactionPanelProps) {
  const summary = summarizeCustomerRatings(orders);
  const entries = buildCustomerRatingEntries(orders);
  const dispatchers = aggregatePersonRatings(orders, "dispatcher");
  const designers = aggregatePersonRatings(orders, "designer");
  const installers = aggregatePersonRatings(orders, "installer");

  return (
    <section className="space-y-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">客户验收评价</h2>
        <p className="mt-1 text-xs text-slate-500">
          星级与订单、被评价人一一对应（派单人 / 设计师 / 安装师 / 整体满意度）
          · 无电子验收按默认 4 星计入统计
        </p>
      </div>

      {summary.ratedCount === 0 ? (
        <p className="text-sm text-slate-500">暂无已验收评价数据</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="已评价" value={`${summary.ratedCount} 单`} />
            <Stat label="均分" value={`${summary.avgOverall.toFixed(1)} 星`} />
            <Stat label="派单人" value={`${summary.avgByRole.dispatcher.toFixed(1)} 星`} />
            <Stat label="设计师" value={`${summary.avgByRole.designer.toFixed(1)} 星`} />
            <Stat label="安装师" value={`${summary.avgByRole.installer.toFixed(1)} 星`} />
            <Stat
              label="整体满意度"
              value={`${summary.avgOverallSatisfaction.toFixed(1)} 星`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <PersonRatingLeaderboard title="派单人评价均分" items={dispatchers} />
            <PersonRatingLeaderboard title="设计师评价均分" items={designers} />
            <PersonRatingLeaderboard title="安装师评价均分" items={installers} />
          </div>

          <CustomerRatingTable entries={entries} mode="order" maxRows={20} />
        </>
      )}
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
