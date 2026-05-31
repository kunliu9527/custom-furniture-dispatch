import type {
  DesignerPerformanceRow,
  MonthlyReportOverview,
} from "./designer-performance";
import {
  formatAvgDays,
  formatContributionScore,
  formatPerformanceConversion,
} from "./designer-performance";
import { formatDispatchMoney } from "./dispatch-totals";
import { aggregateIssueTags } from "./issue-tag-stats";
import { periodFilenameSuffix, type PeriodSelection } from "./period-filter";
import type { Order } from "./types";

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rowToCsvLine(cells: string[]): string {
  return cells.map(escapeCsvCell).join(",");
}

function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([`\ufeff${content}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportMonthlyDesignerReport(
  overview: MonthlyReportOverview,
  rows: DesignerPerformanceRow[],
  period: PeriodSelection,
  orders: Order[] = [],
): void {
  const suffix = periodFilenameSuffix(period);
  const stamp = new Date().toISOString().slice(0, 10);

  const overviewLines = [
    "# 设计师绩效报告总览",
    rowToCsvLine(["指标", "数值"]),
    rowToCsvLine(["统计周期", overview.periodLabel]),
    rowToCsvLine(["周期内订单数", String(overview.orderCount)]),
    rowToCsvLine(["已下单数", String(overview.orderedCount)]),
    rowToCsvLine([
      "已下单金额",
      formatDispatchMoney(overview.orderedAmount),
    ]),
    rowToCsvLine(["退单数", String(overview.refundCount)]),
    rowToCsvLine([
      "增补金额",
      formatDispatchMoney(overview.supplementAmount),
    ]),
    rowToCsvLine(["当前超时在途", String(overview.activeTimeoutCount)]),
    rowToCsvLine(["当前在途合计", String(overview.inProgressCount)]),
  ];

  const headers = [
    "设计师",
    "门店",
    "在途单",
    "下单数",
    "下单金额",
    "转化率",
    "均出图天",
    "均总周期天",
    "当前超时",
    "转派出",
    "转派入",
    "月操作数",
    "月推进数",
    "退单数",
    "售后金额",
    "贡献分",
    "样本不足",
  ];

  const body = rows.map((row) =>
    rowToCsvLine([
      row.label,
      row.subtitle ?? "",
      String(row.inProgressCount),
      String(row.orderedCount),
      String(row.orderedAmount),
      formatPerformanceConversion(row.orderConversionRate),
      formatAvgDays(row.avgDrawDays),
      formatAvgDays(row.avgTotalDays),
      String(row.timeoutCount),
      String(row.transferOut),
      String(row.transferIn),
      String(row.activityTotal),
      String(row.activityAdvances),
      String(row.refundCount),
      row.afterSalesAmount > 0 ? formatDispatchMoney(row.afterSalesAmount) : "0",
      formatContributionScore(row.contributionScore),
      row.sampleTooSmall ? "是" : "否",
    ]),
  );

  const tagStats = aggregateIssueTags(orders, period);
  const tagSection =
    tagStats.length > 0
      ? [
          "",
          "# 问题标签分布",
          rowToCsvLine(["标签", "订单数"]),
          ...tagStats.map((t) => rowToCsvLine([t.tag, String(t.count)])),
        ].join("\n")
      : "";

  const content = [
    ...overviewLines,
    "",
    "# 设计师绩效明细",
    rowToCsvLine(headers),
    ...body,
    tagSection,
  ].join("\n");

  downloadCsv(`设计师绩效报告-${suffix}-${stamp}.csv`, content);
}
