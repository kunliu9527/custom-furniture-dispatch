"use client";

import type { PersonRatingAggregate } from "@/lib/customer-ratings";
import { PERSON_RATING_RANKING } from "@/lib/performance-algorithm-copy";
import { StarDisplay } from "@/components/shared/star-display";

interface PersonRatingLeaderboardProps {
  title: string;
  items: PersonRatingAggregate[];
  emptyMessage?: string;
  maxItems?: number;
}

export function PersonRatingLeaderboard({
  title,
  items,
  emptyMessage = "暂无评价",
  maxItems = 8,
}: PersonRatingLeaderboardProps) {
  const visible = items.slice(0, maxItems);

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
        {PERSON_RATING_RANKING}
      </p>
      {visible.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {visible.map((item) => (
            <li
              key={`${item.role}-${item.personName}`}
              className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{item.personName}</p>
                <p className="text-xs text-slate-500">
                  {item.roleLabel} · {item.count} 单
                </p>
              </div>
              <StarDisplay value={item.avgStars} showDecimal />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
