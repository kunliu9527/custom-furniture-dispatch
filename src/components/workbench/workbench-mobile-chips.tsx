"use client";

export interface WorkbenchMobileChipItem {
  id: string;
  label: string;
  hint?: string;
  badge?: number | string;
}

interface WorkbenchMobileChipsProps {
  items: WorkbenchMobileChipItem[];
  value: string;
  onChange: (id: string) => void;
  /** scroll = horizontal chips; wrap = flex-wrap grid (2-up when 2–4 items) */
  layout?: "scroll" | "wrap";
}

export function WorkbenchMobileChips({
  items,
  value,
  onChange,
  layout = "scroll",
}: WorkbenchMobileChipsProps) {
  if (layout === "wrap") {
    const wrapClass =
      items.length <= 2
        ? "flex flex-wrap gap-1.5"
        : "grid grid-cols-2 gap-1.5";
    return (
      <div className={wrapClass}>
        {items.map((item) => {
          const active = value === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`vi-filter-chip justify-center py-2 ${
                items.length <= 2 ? "min-w-0 flex-1" : ""
              } ${active ? "vi-filter-chip-active" : ""}`}
            >
              <span className="font-semibold">{item.label}</span>
              {item.hint ? (
                <span className="text-xs font-normal text-slate-500">
                  {" "}
                  · {item.hint}
                </span>
              ) : null}
              {item.badge != null && Number(item.badge) > 0 ? (
                <span className="vi-filter-chip-badge">{item.badge}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="-mx-0.5 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`vi-filter-chip shrink-0 flex-col items-start gap-0.5 py-2 ${
              active ? "vi-filter-chip-active" : ""
            }`}
          >
            <span className="text-xs font-semibold leading-tight">{item.label}</span>
            {item.hint ? (
              <span
                className={`text-[10px] leading-tight ${
                  active ? "opacity-95" : "text-slate-500"
                }`}
              >
                {item.hint}
              </span>
            ) : null}
            {item.badge != null ? (
              <span
                className={`text-[10px] font-medium tabular-nums leading-tight ${
                  active ? "opacity-95" : "text-slate-500"
                }`}
              >
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
