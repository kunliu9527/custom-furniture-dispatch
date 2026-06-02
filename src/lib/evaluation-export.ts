import { ORDER_STATUSES } from "./constants";
import {
  buildRankingPresentation,
} from "./evaluation-ranking";
import {
  formatAfterSalesTotal,
  formatAverageOrderAmount,
  formatOrderConversionRate,
  type DispatcherEvaluationRow,
  type EvaluationViewMode,
  type WorkflowEvaluationRow,
} from "./evaluation-stats";
import type {
  AcceptanceEvaluationSummary,
  AcceptanceStoreRow,
} from "./acceptance-evaluation-stats";
import type {
  OrderCustomerRatingRecord,
  PersonRatingAggregate,
} from "./customer-ratings";
import type { DispatcherPerformanceRow } from "./dispatcher-performance";
import { formatDispatchMoney } from "./dispatch-totals";

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
    "待退单数量",
    "待退单金额",
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
    String(row.pendingRefund.count),
    String(row.pendingRefund.amount),
    String(row.confirmedRefund.count),
    String(row.confirmedRefund.amount),
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
      String(workflow.pendingRefund.count),
      String(workflow.pendingRefund.amount),
      String(workflow.confirmedRefund.count),
      String(workflow.confirmedRefund.amount),
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
  options: {
    rankAgainstRows?: DispatcherEvaluationRow[];
    designerExtended?: boolean;
  } = {},
): string {
  const { rankNumbers, extendedRanks, sortedRows } = buildRankingPresentation(
    rows,
    options,
  );
  const designerExtended = options.designerExtended ?? false;

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
    "待退单",
    "已退单",
  ];

  const body = sortedRows.map((row) => {
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
      ranks?.pendingRefundFilled ? "●" : "—",
      ranks?.confirmedRefundFilled ? "●" : "—",
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

function personRatingCsvSection(
  title: string,
  items: PersonRatingAggregate[],
): string {
  const headers = ["姓名", "评价单数", "均分", "涉及订单"];
  const body = items.map((item) => [
    item.personName,
    String(item.count),
    item.avgStars.toFixed(1),
    item.orderIds.join("、"),
  ]);
  return sectionToCsv(title, headers, body);
}

function acceptanceAggregateCsvSection(
  summary: AcceptanceEvaluationSummary,
): string {
  return sectionToCsv(
    "验收归总",
    ["指标", "数值"],
    [
      ["已评价", `${summary.ratedCount} 单`],
      ["综合均分", `${summary.avgOverall.toFixed(1)} 星`],
      ["电子验收率", `${Math.round(summary.electronicRate * 100)}%`],
    ],
  );
}

function acceptanceStoreCsvSection(rows: AcceptanceStoreRow[]): string {
  const headers = ["门店", "已评价", "待扫码", "均分", "电子验收率"];
  const body = rows.map((row) => [
    row.label,
    String(row.ratedCount),
    String(row.pendingCount),
    row.ratedCount > 0 ? row.avgOverall.toFixed(1) : "—",
    row.ratedCount > 0 ? `${Math.round(row.electronicRate * 100)}%` : "—",
  ]);
  return sectionToCsv("验收明细（门店）", headers, body);
}

function acceptanceOrderCsvSection(records: OrderCustomerRatingRecord[]): string {
  const headers = [
    "订单号",
    "客户",
    "门店",
    "验收时间",
    "综合均分",
    "备注",
  ];
  const body = records.map((r) => [
    r.orderId,
    r.customerName,
    r.dispatchStore,
    r.acceptedAt,
    r.avgRating.toFixed(1),
    r.comment ?? "",
  ]);
  return sectionToCsv("按订单汇总", headers, body);
}

function dispatcherPerformanceCsvSection(
  rows: DispatcherPerformanceRow[],
): string {
  const headers = [
    "派单人",
    "归属",
    "新派单",
    "定金合计",
    "签约金额",
    "下单金额",
    "预量定金单",
    "退单预算",
    "签约超时",
    "贡献分",
    "预量奖金",
  ];
  const body = rows.map((row) => [
    row.label,
    row.subtitle ?? "",
    String(row.newDispatchCount),
    formatDispatchMoney(row.depositTotal),
    formatDispatchMoney(row.signedContractAmount),
    formatDispatchMoney(row.orderedAmount),
    String(row.preMeasureDepositCount),
    formatDispatchMoney(row.refundBudget),
    String(row.signTimeoutCount),
    String(row.contributionScore),
    formatDispatchMoney(row.preMeasureBonus),
  ]);
  return sectionToCsv("派单人绩效", headers, body);
}

export interface EvaluationExportPayload {
  viewMode: EvaluationViewMode;
  periodLabel?: string;
  dispatcherRows: DispatcherEvaluationRow[];
  dispatcherWorkflowRows: WorkflowEvaluationRow[];
  designerAmountRows: DispatcherEvaluationRow[];
  designerWorkflowRows: WorkflowEvaluationRow[];
  storeDispatcherAmountRows: DispatcherEvaluationRow[];
  storeWorkflowRows: WorkflowEvaluationRow[];
  /** 门店排名：展示行（权限内） */
  storeRankingDisplayRows?: DispatcherEvaluationRow[];
  /** 门店排名：全部门店数据（用于名次） */
  storeRankingRankSource?: DispatcherEvaluationRow[];
  /** 客户验收：归总 */
  acceptanceSummary?: AcceptanceEvaluationSummary;
  /** 客户验收：门店明细 */
  acceptanceStoreRows?: AcceptanceStoreRow[];
  /** 客户验收：人员均分排名 */
  acceptancePersonRanking?: {
    dispatchers: PersonRatingAggregate[];
    designers: PersonRatingAggregate[];
    installers: PersonRatingAggregate[];
  };
  /** 客户验收：按订单汇总 */
  acceptanceRatingRecords?: OrderCustomerRatingRecord[];
  /** 派单人绩效（周报数据） */
  dispatcherPerformanceRows?: DispatcherPerformanceRow[];
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
      workflowCsvSection(
        "派单人个人数据",
        "派单人",
        payload.dispatcherWorkflowRows,
      ),
      rankingCsvSection(
        "派单人排名",
        "派单人",
        payload.dispatcherRows,
      ),
    );
    if (payload.dispatcherPerformanceRows?.length) {
      sections.push(
        dispatcherPerformanceCsvSection(payload.dispatcherPerformanceRows),
      );
    }
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
        { designerExtended: true },
      ),
    );
    downloadCsv(
      `评价看板-设计师数据${periodPart}-${stamp}.csv`,
      sections.join("\n\n"),
    );
    return;
  }

  if (payload.viewMode === "acceptance") {
    if (payload.acceptanceSummary) {
      sections.push(acceptanceAggregateCsvSection(payload.acceptanceSummary));
    }
    if (payload.acceptanceStoreRows?.length) {
      sections.push(acceptanceStoreCsvSection(payload.acceptanceStoreRows));
    }
    const ranking = payload.acceptancePersonRanking;
    if (ranking) {
      if (ranking.dispatchers.length) {
        sections.push(
          personRatingCsvSection("派单人评价均分", ranking.dispatchers),
        );
      }
      if (ranking.designers.length) {
        sections.push(
          personRatingCsvSection("设计师评价均分", ranking.designers),
        );
      }
      if (ranking.installers.length) {
        sections.push(
          personRatingCsvSection("安装师评价均分", ranking.installers),
        );
      }
    }
    if (payload.acceptanceRatingRecords?.length) {
      sections.push(
        acceptanceOrderCsvSection(payload.acceptanceRatingRecords),
      );
    }
    downloadCsv(
      `评价看板-客户验收评价${periodPart}-${stamp}.csv`,
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
      payload.storeRankingDisplayRows ?? payload.storeDispatcherAmountRows,
      { rankAgainstRows: payload.storeRankingRankSource },
    ),
  );
  downloadCsv(
    `评价看板-门店数据${periodPart}-${stamp}.csv`,
    sections.join("\n\n"),
  );
}
