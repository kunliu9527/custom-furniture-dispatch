import type { CustomerRatingAttribution } from "@/lib/customer-ratings";
import { StarDisplay } from "@/components/shared/star-display";

interface OrderRatingAttributionProps {
  attributions: CustomerRatingAttribution[];
  compact?: boolean;
}

export function OrderRatingAttribution({
  attributions,
  compact = false,
}: OrderRatingAttributionProps) {
  if (attributions.length === 0) return null;

  if (compact) {
    return (
      <ul className="space-y-1 text-sm text-slate-700">
        {attributions.map((item) => (
          <li key={item.role} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-slate-500">{item.roleLabel}</span>
            {item.personName ? (
              <span className="font-medium text-slate-800">{item.personName}</span>
            ) : null}
            <StarDisplay value={item.stars} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {attributions.map((item) => (
        <div
          key={item.role}
          className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2"
        >
          <dt className="text-xs text-slate-500">{item.roleLabel}</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-2">
            {item.personName ? (
              <span className="text-sm font-medium text-slate-900">{item.personName}</span>
            ) : (
              <span className="text-sm text-slate-600">—</span>
            )}
            <StarDisplay value={item.stars} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
