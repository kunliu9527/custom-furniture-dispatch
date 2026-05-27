import type { AdminViewMode } from "@/lib/admin-stats";

const tabs: { id: AdminViewMode; label: string; description: string }[] = [
  {
    id: "dispatch",
    label: "派单录入",
    description: "录入客户信息并指派设计师",
  },
  {
    id: "dispatcher",
    label: "按派单人查找",
    description: "按派单人姓名查找订单并查看统计",
  },
  {
    id: "designer",
    label: "按设计师查找",
    description: "按本店订单关联的设计师查找并查看统计",
  },
  {
    id: "store",
    label: "按门店汇总",
    description: "按派单人所属门店汇总订单数与明细",
  },
  {
    id: "staff",
    label: "人员管理",
    description: "人员名册、配置岗位与门店配置",
  },
];

interface AdminViewTabsProps {
  value: AdminViewMode;
  onChange: (mode: AdminViewMode) => void;
  allowedModes: AdminViewMode[];
}

export function AdminViewTabs({
  value,
  onChange,
  allowedModes,
}: AdminViewTabsProps) {
  const visibleTabs = tabs.filter((t) => allowedModes.includes(t.id));

  return (
    <div className="flex flex-wrap items-stretch gap-3">
      {visibleTabs.map((tab) => (
        <div key={tab.id} className="flex flex-wrap items-stretch gap-2">
          <button
            type="button"
            onClick={() => onChange(tab.id)}
            className={`min-w-[8.5rem] rounded-xl border px-4 py-4 text-left transition ${
              value === tab.id
                ? "border-emerald-300 bg-emerald-50 shadow-sm ring-1 ring-emerald-200"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                value === tab.id ? "text-emerald-900" : "text-slate-900"
              }`}
            >
              {tab.label}
            </p>
            <p
              className={`mt-1 text-xs ${
                value === tab.id ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              {tab.description}
            </p>
          </button>
          {tab.id === "dispatch" ? (
            <div className="flex max-w-[220px] items-center rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-xs leading-snug text-amber-900">
              此页面仅用于派单和查找定单
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
