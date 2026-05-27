import type { ViewMode } from "@/lib/manager-stats";

const tabs: { id: ViewMode; label: string; description: string }[] = [
  {
    id: "status",
    label: "按状态查找",
    description: "按订单状态查找，结果区展示对应统计",
  },
  {
    id: "dispatcher",
    label: "按派单人查找",
    description: "按派单人姓名查找，结果区展示对应统计",
  },
  {
    id: "designer",
    label: "按设计师查找",
    description: "按设计师姓名查找，结果区展示各状态统计",
  },
  {
    id: "store",
    label: "按门店汇总",
    description: "按设计师所在门店汇总订单数与明细",
  },
];

interface ViewTabsProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewTabs({ value, onChange }: ViewTabsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-xl border px-4 py-4 text-left transition ${
            value === tab.id
              ? "border-indigo-300 bg-indigo-50 shadow-sm ring-1 ring-indigo-200"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <p
            className={`text-sm font-semibold ${
              value === tab.id ? "text-indigo-900" : "text-slate-900"
            }`}
          >
            {tab.label}
          </p>
          <p
            className={`mt-1 text-xs ${
              value === tab.id ? "text-indigo-700" : "text-slate-500"
            }`}
          >
            {tab.description}
          </p>
        </button>
      ))}
    </div>
  );
}
