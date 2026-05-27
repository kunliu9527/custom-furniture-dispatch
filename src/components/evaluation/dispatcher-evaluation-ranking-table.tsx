import type { DispatcherEvaluationRow } from "@/lib/evaluation-stats";
import {
  computeAggregateRowRankNumbers,
  computeDesignerExtendedRankNumbers,
  rankBadgeForPlace,
  sortRowsByTotalAmountRank,
  type MetricDualRank,
  type RankBadge,
} from "@/lib/evaluation-ranking";

interface DispatcherEvaluationRankingTableProps {
  nameColumnLabel: string;
  rows: DispatcherEvaluationRow[];
  emptyMessage?: string;
  footnote?: string;
  designerExtendedMetrics?: boolean;
}

const thClass =
  "px-3 py-2 text-xs font-medium text-slate-500 whitespace-nowrap text-center";
const tdClass = "px-3 py-2 text-sm text-slate-700 whitespace-nowrap";

const dualRankColumns = [
  { key: "notOrdered" as const, label: "未下单排名" },
  { key: "ordered" as const, label: "已下单排名" },
] as const;

const refundedColumn = { key: "refunded" as const, label: "已退单" };

const designerExtraRankColumns = [
  { key: "conversion" as const, label: "下单转化率排名" },
  { key: "average" as const, label: "平均下单额排名" },
  { key: "afterSales" as const, label: "售后金额排名" },
] as const;

function RankFlag({ badge }: { badge: RankBadge }) {
  const fill = badge === "red" ? "#dc2626" : "#9333ea";
  return (
    <svg
      className="inline-block h-[1em] w-[1em] shrink-0"
      viewBox="0 0 24 24"
      fill={fill}
      aria-hidden
    >
      <path d="M5 2v20M5 4h11l-2 3.5 2 3.5H5z" />
    </svg>
  );
}

function RankSlot({ place }: { place: number | null }) {
  const badge = rankBadgeForPlace(place);
  const isEmpty = place == null;

  return (
    <span className="inline-grid grid-cols-[1.25rem_1em] items-center gap-x-0.5">
      <span
        className={`text-right text-sm font-semibold tabular-nums leading-none ${
          isEmpty ? "font-normal text-slate-300" : "text-slate-800"
        }`}
      >
        {isEmpty ? "—" : place}
      </span>
      <span className="flex h-[1em] w-[1em] items-center justify-center">
        {badge ? <RankFlag badge={badge} /> : null}
      </span>
    </span>
  );
}

function DualRankCell({ dual }: { dual: MetricDualRank }) {
  return (
    <td className={`${tdClass} text-center align-middle`}>
      <div className="mx-auto inline-flex items-center justify-center gap-1 whitespace-nowrap py-0.5">
        <RankSlot place={dual.countPlace} />
        <span className="shrink-0 text-slate-300">/</span>
        <RankSlot place={dual.amountPlace} />
      </div>
    </td>
  );
}

function SingleRankCell({ place }: { place: number | null }) {
  return (
    <td className={`${tdClass} text-center align-middle`}>
      <div className="flex justify-center py-0.5">
        <RankSlot place={place} />
      </div>
    </td>
  );
}

function RefundedCell({ filled }: { filled: boolean }) {
  return (
    <td
      className={`${tdClass} text-center text-xs align-middle ${
        filled
          ? "bg-amber-100/80 font-medium text-amber-950"
          : "text-slate-300"
      }`}
    >
      {filled ? "●" : "—"}
    </td>
  );
}

export function DispatcherEvaluationRankingTable({
  nameColumnLabel,
  rows,
  emptyMessage = "暂无数据",
  footnote = "数量为左、金额为右，横向显示（如 3/3）· 第1名红旗 · 第2名紫旗 · 无旗保留空白对齐 · 退单仅填充标示",
  designerExtendedMetrics = false,
}: DispatcherEvaluationRankingTableProps) {
  const dataRows = rows.filter((row) => !row.isWorkflowSummary);
  const rankNumbers = computeAggregateRowRankNumbers(rows);
  const extendedRanks = designerExtendedMetrics
    ? computeDesignerExtendedRankNumbers(rows)
    : null;
  const sortedRows = sortRowsByTotalAmountRank(dataRows, rankNumbers);

  if (dataRows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  const emptyDual: MetricDualRank = { countPlace: null, amountPlace: null };
  const minWidth = designerExtendedMetrics ? "min-w-[960px]" : "min-w-[720px]";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className={`w-full ${minWidth} border-collapse text-left`}>
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th
                className={`${thClass} min-w-[120px] sticky left-0 bg-slate-50/95 text-left`}
              >
                {nameColumnLabel}
              </th>
              <th className={thClass}>合计排名</th>
              {dualRankColumns.map((col) => (
                <th key={col.key} className={thClass}>
                  {col.label}
                </th>
              ))}
              {designerExtendedMetrics
                ? designerExtraRankColumns.map((col) => (
                    <th key={col.key} className={thClass}>
                      {col.label}
                    </th>
                  ))
                : null}
              <th className={thClass}>{refundedColumn.label}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRows.map((row) => {
              const ranks = rankNumbers.get(row.key);
              const extended = extendedRanks?.get(row.key);
              return (
                <tr key={row.key} className="hover:bg-slate-50/50">
                  <td
                    className={`${tdClass} sticky left-0 bg-white font-medium text-slate-900`}
                  >
                    <div>{row.label}</div>
                    {row.subtitle ? (
                      <div className="text-xs font-normal text-slate-500">
                        {row.subtitle}
                      </div>
                    ) : null}
                  </td>
                  <DualRankCell dual={ranks?.total ?? emptyDual} />
                  <DualRankCell dual={ranks?.notOrdered ?? emptyDual} />
                  <DualRankCell dual={ranks?.ordered ?? emptyDual} />
                  {designerExtendedMetrics ? (
                    <>
                      <SingleRankCell
                        place={extended?.orderConversionRatePlace ?? null}
                      />
                      <SingleRankCell
                        place={extended?.averageOrderAmountPlace ?? null}
                      />
                      <SingleRankCell
                        place={extended?.afterSalesAmountPlace ?? null}
                      />
                    </>
                  ) : null}
                  <RefundedCell filled={ranks?.refundedFilled ?? false} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-400">
        共 {sortedRows.length} 条 · {footnote}
        {designerExtendedMetrics
          ? " · 扩展指标按数值从高到低排名"
          : ""}
      </p>
    </div>
  );
}
