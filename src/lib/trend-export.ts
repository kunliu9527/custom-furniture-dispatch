import type { IssueTagMonthPoint } from "./issue-tag-trend";
import type { TrendMonthPoint } from "./trend-series";
import { TREND_METRIC_OPTIONS } from "./trend-series";

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

export function exportTrendSeriesCsv(
  points: TrendMonthPoint[],
  periodLabel?: string,
): void {
  const headers = [
    "月份",
    "新派单",
    "签约额",
    "下单额",
    "下单笔数",
    "退单笔数",
    "退单金额",
    "验收均分",
    "流程超时",
    "签约超时",
    "待扫码验收",
  ];
  const rows = points.map((p) => [
    p.yearMonth,
    String(p.newDispatchCount),
    String(p.signedContractAmount),
    String(p.orderedAmount),
    String(p.orderedCount),
    String(p.refundCount),
    String(p.refundAmount),
    p.acceptanceAvg != null ? p.acceptanceAvg.toFixed(1) : "",
    String(p.flowTimeoutCount),
    String(p.signTimeoutCount),
    String(p.pendingAcceptanceCount),
  ]);
  const stamp = new Date().toISOString().slice(0, 10);
  const part = periodLabel ? `-${periodLabel.replace(/\s/g, "")}` : "";
  downloadCsv(
    `经营趋势${part}-${stamp}.csv`,
    [rowToCsvLine(headers), ...rows.map(rowToCsvLine)].join("\n"),
  );
}

export function exportIssueTagTrendCsv(
  points: IssueTagMonthPoint[],
  periodLabel?: string,
): void {
  const headers = ["月份", "标签订单数", "Top1标签", "Top1占比%", "Top2标签", "Top2占比%", "Top3标签", "Top3占比%"];
  const rows = points.map((p) => {
    const t = (i: number) => p.tags[i];
    return [
      p.yearMonth,
      String(p.totalTagged),
      t(0)?.tag ?? "",
      t(0) ? String(t(0)!.share) : "",
      t(1)?.tag ?? "",
      t(1) ? String(t(1)!.share) : "",
      t(2)?.tag ?? "",
      t(2) ? String(t(2)!.share) : "",
    ];
  });
  const stamp = new Date().toISOString().slice(0, 10);
  const part = periodLabel ? `-${periodLabel.replace(/\s/g, "")}` : "";
  downloadCsv(
    `问题标签趋势${part}-${stamp}.csv`,
    [rowToCsvLine(headers), ...rows.map(rowToCsvLine)].join("\n"),
  );
}

export function trendMetricLabels(): string {
  return TREND_METRIC_OPTIONS.map((o) => o.label).join("、");
}
