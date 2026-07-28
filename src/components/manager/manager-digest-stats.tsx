import { formatDispatchMoney } from "@/lib/dispatch-totals";

interface DigestStatsProps {
  items: { label: string; value: string; hint?: string }[];
  tone?: "blue" | "teal" | "rose";
}

const tileToneClass: Record<
  NonNullable<DigestStatsProps["tone"]>,
  string
> = {
  teal: "vi-stat-tile-violet",
  blue: "vi-stat-tile-indigo",
  rose: "vi-stat-tile-rose",
};

const labelClass: Record<NonNullable<DigestStatsProps["tone"]>, string> = {
  teal: "text-sky-800",
  blue: "text-blue-700",
  rose: "text-rose-700",
};

const valueClass: Record<NonNullable<DigestStatsProps["tone"]>, string> = {
  teal: "text-slate-900",
  blue: "text-slate-900",
  rose: "text-rose-950",
};

export function ManagerDigestStats({
  items,
  tone = "teal",
  className = "",
}: DigestStatsProps & { className?: string }) {
  return (
    <dl className={`mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 ${className}`}>
      {items.map((item) => (
        <div
          key={item.label}
          className={`vi-stat-tile ${tileToneClass[tone]}`}
        >
          <dt className={`text-[10px] font-semibold ${labelClass[tone]}`}>
            {item.label}
          </dt>
          <dd
            className={`mt-0.5 text-[0.9375rem] font-bold tabular-nums leading-tight ${valueClass[tone]}`}
          >
            {item.value}
          </dd>
          {item.hint ? (
            <p className="mt-0.5 text-[10px] text-slate-500">{item.hint}</p>
          ) : null}
        </div>
      ))}
    </dl>
  );
}

export function formatMoneyStat(count: number, amount: number): string {
  return `${count} / ${formatDispatchMoney(amount)}`;
}
