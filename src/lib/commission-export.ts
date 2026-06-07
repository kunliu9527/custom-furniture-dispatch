import {
  formatContributionScore,
  getDesignerPerformanceRows,
  type DesignerPerformanceRow,
} from "./designer-performance";
import {
  getDispatcherPerformanceRows,
  type DispatcherPerformanceRow,
} from "./dispatcher-performance";
import { formatDispatchMoney } from "./dispatch-totals";
import { rowToCsvLine, downloadCsv, stampForFilename } from "./csv-utils";
import {
  formatPeriodLabel,
  periodFilenameSuffix,
  type PeriodSelection,
} from "./period-filter";
import type { StaffRecord } from "./staff-roster";
import type { Order, SupplementOrder } from "./types";

/** 提成底稿：派单人建议基数 = 签约额×0.3% + 定金×0.5% + 量尺前补定×200（可调） */
function dispatcherCommissionBase(row: DispatcherPerformanceRow): number {
  return Math.round(
    row.signedContractAmount * 0.003 +
      row.depositTotal * 0.005 +
      row.preMeasureDepositCount * 200,
  );
}

function designerSupplementAmount(
  row: DesignerPerformanceRow,
  orders: Order[],
  supplements: SupplementOrder[],
): number {
  let total = 0;
  for (const order of orders) {
    if (order.designer !== row.label) continue;
    for (const s of supplements) {
      if (s.parentOrderId === order.id && s.designer === row.label) {
        total += s.supplementAmount;
      }
    }
  }
  return total;
}

export function exportCommissionDraftCsv(
  orders: Order[],
  supplements: SupplementOrder[],
  staffRecords: StaffRecord[],
  period: PeriodSelection,
): void {
  const periodLabel = formatPeriodLabel(period);
  const suffix = periodFilenameSuffix(period);
  const stamp = stampForFilename();

  const dispatcherRows = getDispatcherPerformanceRows(
    orders,
    supplements,
    null,
    staffRecords,
    period,
  );
  const designerRows = getDesignerPerformanceRows(
    orders,
    supplements,
    null,
    undefined,
    staffRecords,
    period,
  );

  const lines: string[] = [
    `# 提成核算底稿 · ${periodLabel}`,
    `# 生成时间 ${new Date().toLocaleString("zh-CN")}`,
    `# 说明：建议提成基数为系统估算，实际比例请财务在 Excel 中调整`,
    "",
    "# 派单人",
    rowToCsvLine([
      "派单人",
      "门店",
      "新派单数",
      "定金合计",
      "签约金额",
      "下单金额",
      "量尺前补定",
      "签约超时",
      "贡献分",
      "建议提成基数(元)",
    ]),
    ...dispatcherRows.map((row) =>
      rowToCsvLine([
        row.label,
        row.subtitle ?? "",
        String(row.newDispatchCount),
        formatDispatchMoney(row.depositTotal),
        formatDispatchMoney(row.signedContractAmount),
        formatDispatchMoney(row.orderedAmount),
        String(row.preMeasureDepositCount),
        String(row.signTimeoutCount),
        String(row.contributionScore),
        String(dispatcherCommissionBase(row)),
      ]),
    ),
    "",
    "# 设计师",
    rowToCsvLine([
      "设计师",
      "门店",
      "在途单",
      "下单数",
      "下单金额",
      "增补金额",
      "转化率",
      "超时在途",
      "退单数",
      "贡献分",
      "建议提成基数(元)",
    ]),
    ...designerRows.map((row) =>
      rowToCsvLine([
        row.label,
        row.subtitle ?? "",
        String(row.inProgressCount),
        String(row.orderedCount),
        formatDispatchMoney(row.orderedAmount),
        formatDispatchMoney(
          designerSupplementAmount(row, orders, supplements),
        ),
        row.orderConversionRate != null
          ? `${row.orderConversionRate.toFixed(1)}%`
          : "",
        String(row.timeoutCount),
        String(row.refundCount),
        formatContributionScore(row.contributionScore),
        String(
          Math.round(
            row.orderedAmount * 0.0015 +
              designerSupplementAmount(row, orders, supplements) * 0.0012,
          ),
        ),
      ]),
    ),
  ];

  downloadCsv(`提成核算底稿-${suffix}-${stamp}.csv`, lines.join("\n"));
}
