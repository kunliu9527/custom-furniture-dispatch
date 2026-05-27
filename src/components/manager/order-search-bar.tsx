"use client";

interface OrderSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  resultCount?: number;
  placeholder?: string;
}

export function OrderSearchBar({
  value,
  onChange,
  resultCount,
  placeholder = "客户姓名、电话、地址、设计师、派单人、门店…",
}: OrderSearchBarProps) {
  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-slate-900">
          查找订单
          {value.trim() ? (
            <span className="font-normal text-slate-500">
              {" "}
              · {resultCount ?? 0} 笔
            </span>
          ) : null}
        </span>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </label>
    </section>
  );
}
