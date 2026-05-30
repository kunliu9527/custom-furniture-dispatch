"use client";

interface StarRatingProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
}

export function StarRating({
  label,
  value,
  onChange,
  required = false,
}: StarRatingProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-800">
        {required ? <span className="text-rose-500">* </span> : null}
        {label}
      </p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-2xl transition ${
              star <= value ? "text-amber-400" : "text-slate-300"
            }`}
            aria-label={`${star} 星`}
          >
            ★
          </button>
        ))}
        {value >= 4 ? (
          <span className="ml-2 text-xs text-emerald-600">非常满意</span>
        ) : null}
      </div>
    </div>
  );
}
