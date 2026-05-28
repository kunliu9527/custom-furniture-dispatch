import { ORDER_STATUSES } from "./constants";
import {
  computeAggregateRowRankNumbers,
  computeDesignerExtendedRankNumbers,
  sortRowsByTotalAmountRank,
} from "./evaluation-ranking";
import {
  formatAfterSalesTotal,
  formatAverageOrderAmount,
  formatOrderConversionRate,
  type DispatcherEvaluationRow,
  type EvaluationViewMode,
  type WorkflowEvaluationRow,
} from "./evaluation-stats";

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rowToCsvLine(cells: string[]): string {
  return cells.map(escapeCsvCell).join(",");
}

function sectionToCsv(title: string, headers: string[], rows: string[][]): string {
  const lines = [`# ${title}`, rowToCsvLine(headers), ...rows.map(rowToCsvLine)];
  return lines.join("\n");
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

function dataRows(rows: DispatcherEvaluationRow[]): DispatcherEvaluationRow[] {
  return rows.filter((row) => !row.isWorkflowSummary);
}

function aggregateCsvSections(
  title: string,
  nameLabel: string,
  rows: DispatcherEvaluationRow[],
  designerExtended = false,
): string[] {
  const headers = [
    nameLabel,
    "合计数量",
    "合计金额",
    "未下单数量",
    "未下单金额",
    "已下单数量",
    "已下单金额",
    "已退单数量",
    "已退单金额",
    ...(designerExtended
      ? ["下单转化率", "平均下单额", "售后金额"]
      : []),
  ];

  const body = dataRows(rows).map((row) => [
    row.label,
    String(row.total),
    String(row.totalAmount),
    String(row.notOrdered.count),
    String(row.notOrdered.amount),
    String(row.ordered.count),
    String(row.ordered.amount),
    String(row.refunded.count),
    String(row.refunded.amount),
    ...(designerExtended
      ? [
          formatOrderConversionRate(row.orderConversionRate),
          formatAverageOrderAmount(row.averageOrderAmount),
          formatAfterSalesTotal(row.afterSalesAmount),
        ]
      : []),
  ]);

  const workflow = rows.find((row) => row.isWorkflowSummary);
  if (workflow) {
    body.push([
      workflow.label,
      String(workflow.total),
      String(workflow.totalAmount),
      String(workflow.notOrdered.count),
      String(workflow.notOrdered.amount),
      String(workflow.ordered.count),
      String(workflow.ordered.amount),
      String(workflow.refunded.count),
      String(workflow.refunded.amount),
      ...(designerExtended
        ? [
            formatOrderConversionRate(workflow.orderConversionRate),
            formatAverageOrderAmount(workflow.averageOrderAmount),
            formatAfterSalesTotal(workflow.afterSalesAmount),
          ]
        : []),
    ]);
  }

  return [sectionToCsv(title, headers, body)];
}

function rankingCsvSection(
  title: string,
  nameLabel: string,
  rows: DispatcherEvaluationRow[],
  designerExtended = false,
): string {
  const rankNumbers = computeAggregateRowRankNumbers(rows);
  const extendedRanks = designerExtended
    ? computeDesignerExtendedRankNumbers(rows)
    : null;
  const sorted = sortRowsByTotalAmountRank(dataRows(rows), rankNumbers);

  const formatDual = (count: number | null, amount: number | null) => {
    const c = count == null ? "—" : String(count);
    const a = amount == null ? "—" : String(amount);
    return `${c}/${a}`;
  };

  const headers = [
    nameLabel,
    "合计排名(数量/金额)",
    "未下单排名(数量/金额)",
    "已下单排名(数量/金额)",
    ...(designerExtended
      ? ["下单转化率排名", "平均下单额排名", "售后金额排名"]
      : []),
    "已退单",
  ];

  const body = sorted.map((row) => {
    const ranks = rankNumbers.get(row.key);
    const extended = extendedRanks?.get(row.key);
    return [
      row.label,
      formatDual(ranks?.total.countPlace ?? null, ranks?.total.amountPlace ?? null),
      formatDual(
        ranks?.notOrdered.countPlace ?? null,
        ranks?.notOrdered.amountPlace ?? null,
      ),
      formatDual(
        ranks?.ordered.countPlace ?? null,
        ranks?.ordered.amountPlace ?? null,
      ),
      ...(designerExtended
        ? [
            extended?.orderConversionRatePlace != null
              ? String(extended.orderConversionRatePlace)
              : "—",
            extended?.averageOrderAmountPlace != null
              ? String(extended.averageOrderAmountPlace)
              : "—",
            extended?.afterSalesAmountPlace != null
              ? String(extended.afterSalesAmountPlace)
              : "—",
          ]
        : []),
      ranks?.refundedFilled ? "●" : "—",
    ];
  });

  return sectionToCsv(title, headers, body);
}

function workflowCsvSection(
  title: string,
  nameLabel: string,
  rows: WorkflowEvaluationRow[],
): string {
  const visibleStatuses = ORDER_STATUSES.filter(
    (status) =>
      rows.some((row) => row.byStatus[status] > 0) ||
      rows.some((row) => row.byStatusAmount[status] > 0),
  );
  const columns =
    visibleStatuses.length > 0 ? visibleStatuses : [...ORDER_STATUSES];

  const headers = [
    nameLabel,
    "合计数量",
    "合计金额",
    ...columns.flatMap((status) => [`${status}数量`, `${status}金额`]),
  ];

  const data = rows.filter((row) => !row.isWorkflowSummary);
  const mapped = data.map((row) => [
    row.label,
    String(row.total),
    String(row.totalAmount),
    ...columns.flatMap((status) => [
      String(row.byStatus[status]),
      String(row.byStatusAmount[status]),
    ]),
  ]);

  const workflow = rows.find((row) => row.isWorkflowSummary);
  if (workflow) {
    mapped.push([
      workflow.label,
      String(workflow.total),
      String(workflow.totalAmount),
      ...columns.flatMap((status) => [
        String(workflow.byStatus[status]),
        String(workflow.byStatusAmount[status]),
      ]),
    ]);
  }

  return sectionToCsv(title, headers, mapped);
}

export interface EvaluationExportPayload {
  viewMode: EvaluationViewMode;
  periodLabel?: string;
  dispatcherRows: DispatcherEvaluationRow[];
  designerAmountRows: DispatcherEvaluationRow[];
  designerWorkflowRows: WorkflowEvaluationRow[];
  storeDispatcherAmountRows: DispatcherEvaluationRow[];
  storeWorkflowRows: WorkflowEvaluationRow[];
}

export function exportEvaluationData(payload: EvaluationExportPayload): void {
  const stamp = new Date().toISOString().slice(0, 10);
  const periodPart = payload.periodLabel
    ? `-${payload.periodLabel.replace(/\s/g, "")}`
    : "";
  const sections: string[] = [];

  if (payload.viewMode === "dispatcher") {
    sections.push(
      ...aggregateCsvSections(
        "派单人归总",
        "派单人",
        payload.dispatcherRows,
      ),
      rankingCsvSection(
        "派单人排名",
        "派单人",
        payload.dispatcherRows,
      ),
    );
    downloadCsv(
      `评价看板-派单人数据${periodPart}-${stamp}.csv`,
      sections.join("\n\n"),
    );
    return;
  }

  if (payload.viewMode === "designer") {
    sections.push(
      ...aggregateCsvSections(
        "设计师归总",
        "设计师",
        payload.designerAmountRows,
        true,
      ),
      workflowCsvSection(
        "设计师个人数据",
        "设计师",
        payload.designerWorkflowRows,
      ),
      rankingCsvSection(
        "设计师排名",
        "设计师",
        payload.designerAmountRows,
        true,
      ),
    );
    downloadCsv(
      `评价看板-设计师数据${periodPart}-${stamp}.csv`,
      sections.join("\n\n"),
    );
    return;
  }

  sections.push(
    ...aggregateCsvSections(
      "门店归总",
      "门店名称",
      payload.storeDispatcherAmountRows,
    ),
    workflowCsvSection("门店数据", "门店名称", payload.storeWorkflowRows),
    rankingCsvSection(
      "门店排名",
      "门店名称",
      payload.storeDispatcherAmountRows,
    ),
  );
  downloadCsv(
    `评价看板-门店数据${periodPart}-${stamp}.csv`,
    sections.join("\n\n"),
  );
}
