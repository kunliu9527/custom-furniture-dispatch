export type ReportTab = "weekly" | "monthly" | "allSummary" | "history" | "pending" | "alerts";

export type ReportScope = "manager" | "global";

export interface ReportHubScopeOptions {
  /** 非总部 / 非全公司时展示所属门店（如「东岸天冠」或「A、B」） */
  storeScopeLabel?: string | null;
}

/** 全部汇总 Tab 文案：门店/分管 vs 总部全公司 */
export function getAllSummaryBriefLabel(
  storeScopeLabel?: string | null,
): string {
  return storeScopeLabel ? "门店汇总简报" : "全局汇总简报";
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
      {
        id: "allSummary",
        label: getAllSummaryBriefLabel(
          storeScoped ? options?.storeScopeLabel : null,
        ),
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
      activeTab: "text-rose-900",
      inactiveTab: "text-slate-600 hover:text-slate-900",
    };
  }
  return {
    activeTab: "text-indigo-900",
    inactiveTab: "text-slate-600 hover:text-slate-900",
  };
}
