interface StarDisplayProps {
  value: number;
  max?: number;
  showDecimal?: boolean;
}

export function StarDisplay({ value, max = 5, showDecimal = false }: StarDisplayProps) {
  const label = showDecimal ? value.toFixed(1) : String(Math.round(value));
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-600" aria-label={`${label} 星`}>
      <span className="text-sm font-semibold tabular-nums">{label}</span>
      <span className="text-xs">★</span>
      <span className="sr-only">/{max}</span>
    </span>
  );
}
