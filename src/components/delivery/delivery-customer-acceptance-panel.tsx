"use client";

import { CustomerRatingTable } from "@/components/shared/customer-rating-table";
import { PersonRatingLeaderboard } from "@/components/shared/person-rating-leaderboard";
import {
  aggregatePersonRatings,
  buildCustomerRatingEntries,
  filterOrdersByAcceptanceLookup,
  summarizeCustomerRatings,
  type AcceptanceLookupFilter,
} from "@/lib/customer-ratings";
import type { Order } from "@/lib/types";

interface DeliveryCustomerAcceptancePanelProps {
  orders: Order[];
  filter?: AcceptanceLookupFilter;
  showLeaderboards?: boolean;
}

export function DeliveryCustomerAcceptancePanel({
  orders,
  filter = "全部",
  showLeaderboards = true,
}: DeliveryCustomerAcceptancePanelProps) {
  const scoped = filterOrdersByAcceptanceLookup(orders, filter);
  const summary = summarizeCustomerRatings(orders);
  const ratingOrders =
    filter === "待扫码"
      ? []
      : scoped.filter((o) => o.status === "已验收");
  const entries = buildCustomerRatingEntries(ratingOrders);
  const dispatchers = aggregatePersonRatings(orders, "dispatcher");
  const designers = aggregatePersonRatings(orders, "designer");
  const installers = aggregatePersonRatings(orders, "installer");

  return (
    <section className="space-y-4">
      {summary.ratedCount === 0 && filter !== "待扫码" ? (
        <p className="text-sm text-slate-500">
          {filter === "无电子验收"
            ? "当前筛选下暂无无电子验收记录"
            : "暂无扫码评价记录；订单进入「已安装」并生成验收码后，客户提交评价将显示在此。"}
        </p>
      ) : null}

      {entries.length > 0 ? (
        <>
          {showLeaderboards ? (
            <div className="grid gap-4 lg:grid-cols-3">
              <PersonRatingLeaderboard title="派单人评价均分" items={dispatchers} />
              <PersonRatingLeaderboard title="设计师评价均分" items={designers} />
              <PersonRatingLeaderboard title="安装师评价均分" items={installers} />
            </div>
          ) : null}

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">按订单汇总</h3>
            <CustomerRatingTable entries={entries} mode="order" />
          </div>
        </>
      ) : null}

      {filter === "无电子验收" || (filter === "全部" && summary.skippedCount > 0) ? (
        <p className="text-xs text-slate-500">
          另有 {summary.skippedCount} 单为「无电子验收」，统计与排行按默认 4 星计入（不计入差评）。
        </p>
      ) : null}
    </section>
  );
}
