export type ReportTab = "weekly" | "monthly" | "history" | "pending" | "alerts";

export type ReportScope = "manager" | "global";

export interface ReportHubScopeOptions {
  /** 非总部 / 非全公司时展示所属门店（如「东岸天冠」或「A、B」） */
  storeScopeLabel?: string | null;
}

export function getReportTabs(
  scope: ReportScope,
  options?: ReportHubScopeOptions,
): { id: ReportTab; label: string }[] {
  const storeScoped = Boolean(options?.storeScopeLabel);
  if (scope === "global") {
    return [
      {
        id: "weekly",
        label: storeScoped ? "本周门店简报" : "本周全局简报",
      },
      {
        id: "monthly",
        label: storeScoped ? "本月门店简报" : "本月全局简报",
      },
      { id: "history", label: storeScoped ? "门店历史简报" : "历史简报" },
      { id: "pending", label: "待确认" },
      { id: "alerts", label: "需跟进" },
    ];
  }
  return [
    { id: "pending", label: "待确认" },
    { id: "alerts", label: "需跟进" },
  ];
}

export function getReportAccentClass(scope: ReportScope): {
  activeTab: string;
  inactiveTab: string;
} {
  if (scope === "global") {
    return {
      activeTab: "border-rose-600 text-rose-900",
      inactiveTab: "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800",
    };
  }
  return {
    activeTab: "border-indigo-600 text-indigo-900",
    inactiveTab: "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800",
  };
}
