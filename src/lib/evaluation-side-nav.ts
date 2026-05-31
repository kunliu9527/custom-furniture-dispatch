import type { EvaluationViewMode } from "@/lib/evaluation-stats";
import type { EvaluationSubView } from "@/lib/evaluation-ui-persistence";
import type { SideNavGroup } from "@/components/evaluation/evaluation-side-nav";

export function getEvaluationSideNavGroups(
  viewMode: EvaluationViewMode,
  options?: { hideStoreRanking?: boolean },
): SideNavGroup[] {
  const groups = buildEvaluationSideNavGroups(viewMode);
  if (!options?.hideStoreRanking) return groups;
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.id !== "ranking"),
    }))
    .filter((group) => group.items.length > 0);
}

function buildEvaluationSideNavGroups(
  viewMode: EvaluationViewMode,
): SideNavGroup[] {
  switch (viewMode) {
    case "dispatcher":
      return [
        {
          label: "业绩统计",
          items: [
            { id: "aggregate", title: "派单人归总" },
            { id: "ranking", title: "派单人排名" },
          ],
        },
        {
          label: "流程明细",
          items: [{ id: "workflow", title: "派单人个人数据" }],
        },
        {
          label: "绩效报告",
          items: [{ id: "performance", title: "派单人绩效报告" }],
        },
      ];
    case "designer":
      return [
        {
          label: "业绩统计",
          items: [
            { id: "aggregate", title: "设计师归总" },
            { id: "ranking", title: "设计师排名" },
          ],
        },
        {
          label: "流程明细",
          items: [{ id: "workflow", title: "设计师个人数据" }],
        },
        {
          label: "绩效报告",
          items: [{ id: "performance", title: "设计师绩效报告" }],
        },
      ];
    case "store":
      return [
        {
          label: "业绩统计",
          items: [
            { id: "aggregate", title: "门店归总" },
            { id: "ranking", title: "门店排名" },
          ],
        },
        {
          label: "流程明细",
          items: [{ id: "workflow", title: "门店数据" }],
        },
      ];
    case "acceptance":
      return [
        {
          label: "验收评价",
          items: [
            { id: "aggregate", title: "验收归总" },
            { id: "workflow", title: "验收明细" },
            { id: "ranking", title: "人员均分排名" },
          ],
        },
      ];
  }
}

export function getSubViewTitle(
  viewMode: EvaluationViewMode,
  subView: EvaluationSubView,
): string {
  for (const group of getEvaluationSideNavGroups(viewMode)) {
    const item = group.items.find((i) => i.id === subView);
    if (item) return item.title;
  }
  return "汇总";
}

export function getActiveSubView(
  viewMode: EvaluationViewMode,
  subViews: {
    dispatcher: EvaluationSubView;
    designer: EvaluationSubView;
    store: EvaluationSubView;
    acceptance: EvaluationSubView;
  },
): EvaluationSubView {
  switch (viewMode) {
    case "dispatcher":
      return subViews.dispatcher;
    case "designer":
      return subViews.designer;
    case "store":
      return subViews.store;
    case "acceptance":
      return subViews.acceptance;
  }
}

export function setActiveSubView(
  viewMode: EvaluationViewMode,
  id: EvaluationSubView,
  setters: {
    setDispatcherSubView: (v: EvaluationSubView) => void;
    setDesignerSubView: (v: EvaluationSubView) => void;
    setStoreSubView: (v: EvaluationSubView) => void;
    setAcceptanceSubView: (v: EvaluationSubView) => void;
  },
): void {
  switch (viewMode) {
    case "dispatcher":
      setters.setDispatcherSubView(id);
      break;
    case "designer":
      setters.setDesignerSubView(id);
      break;
    case "store":
      setters.setStoreSubView(id);
      break;
    case "acceptance":
      setters.setAcceptanceSubView(id);
      break;
  }
}
