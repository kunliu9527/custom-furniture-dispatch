import { formatDispatchMoney } from "@/lib/dispatch-totals";

interface DigestStatsProps {
  items: { label: string; value: string; hint?: string }[];
  tone?: "violet" | "indigo" | "rose";
}

export function ManagerDigestStats({
  items,
  tone = "violet",
  className = "",
}: DigestStatsProps & { className?: string }) {
  const labelClass =
    tone === "violet"
      ? "text-violet-600"
      : tone === "rose"
        ? "text-rose-600"
        : "text-indigo-600";
  const valueClass =
    tone === "violet"
      ? "text-violet-950"
      : tone === "rose"
        ? "text-rose-950"
        : "text-indigo-950";
  const cardClass =
    tone === "violet"
      ? "bg-white/70"
      : tone === "rose"
        ? "bg-rose-50/80"
        : "bg-slate-50/90";

  return (
    <dl className={`mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 ${className}`}>
      {items.map((item) => (
        <div key={item.label} className={`rounded-lg px-2 py-1.5 ${cardClass}`}>
          <dt className={`text-[10px] ${labelClass}`}>{item.label}</dt>
          <dd className={`text-sm font-semibold tabular-nums ${valueClass}`}>
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
