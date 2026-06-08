"use client";

import {
  EvaluationTableScroll,
  EVAL_DATA_TABLE_CLASS,
  TABLE_FOOTER_CLASS,
  TABLE_HEAD_STICKY_CLASS,
  TABLE_NAME_TD_CLASS,
  TABLE_NAME_TH_CLASS,
  TABLE_TD_CLASS,
  TABLE_TH_CLASS,
} from "@/components/evaluation/evaluation-table-scroll";
import { SortableTh } from "@/components/shared/sortable-table-header";
import { TableAlgorithmCaption } from "@/components/shared/table-algorithm-caption";
import type { DispatcherEvaluationRow } from "@/lib/evaluation-stats";
import {
  defaultRankingSortDirection,
  sortRankingDisplayRows,
  type RankingSortColumn,
} from "@/lib/evaluation-table-sort";
import {
  DESIGNER_EXTENDED_RANK_RULES,
  EVALUATION_AMOUNT_RULES,
  EVALUATION_RANKING_RULES,
} from "@/lib/performance-algorithm-copy";
import {
  buildRankingPresentation,
  rankBadgeForPlace,
  type MetricDualRank,
  type RankBadge,
} from "@/lib/evaluation-ranking";
import { nextTableSortState, type TableSortState } from "@/lib/table-sort";
import type { BoardSnapshotConfig } from "@/lib/board-snapshot-types";
import { useMemo, useState } from "react";

interface DispatcherEvaluationRankingTableProps {
  nameColumnLabel: string;
  rows: DispatcherEvaluationRow[];
  /** 全量数据集，用于计算名次；未传则与 rows 相同 */
  rankAgainstRows?: DispatcherEvaluationRow[];
  emptyMessage?: string;
  footnote?: string;
  designerExtendedMetrics?: boolean;
  snapshot?: BoardSnapshotConfig;
}

const thClass = `${TABLE_TH_CLASS} text-center`;
const tdClass = TABLE_TD_CLASS;

import {
  AGGREGATE_KPI_LABEL,
  AGGREGATE_RANK_FOOTNOTE,
} from "@/lib/metric-display-labels";

const dualRankColumns: { key: RankingSortColumn; label: string }[] = [
  { key: "notOrderedRank", label: `${AGGREGATE_KPI_LABEL.notOrdered}排名` },
  { key: "orderedRank", label: `${AGGREGATE_KPI_LABEL.ordered}排名` },
];

const refundedColumns: { key: RankingSortColumn; label: string }[] = [
  { key: "pendingRefund", label: AGGREGATE_KPI_LABEL.pendingRefund },
  { key: "confirmedRefund", label: AGGREGATE_KPI_LABEL.confirmedRefund },
];

const designerExtraRankColumns: { key: RankingSortColumn; label: string }[] = [
  { key: "conversionRank", label: "下单转化率排名" },
  { key: "averageRank", label: "平均下单额排名" },
  { key: "afterSalesRank", label: "售后金额排名" },
];

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
  rankAgainstRows,
  emptyMessage = "暂无数据",
  footnote = EVALUATION_RANKING_RULES,
  designerExtendedMetrics = false,
  snapshot,
}: DispatcherEvaluationRankingTableProps) {
  const [sort, setSort] = useState<TableSortState<RankingSortColumn>>({
    column: "totalRank",
    direction: "asc",
  });

  const { rankNumbers, extendedRanks, sortedRows: defaultSortedRows } =
    useMemo(
      () =>
        buildRankingPresentation(rows, {
          rankAgainstRows,
          designerExtended: designerExtendedMetrics,
        }),
      [rows, rankAgainstRows, designerExtendedMetrics],
    );

  const sortedRows = useMemo(() => {
    if (sort.column === "totalRank" && sort.direction === "asc") {
      return defaultSortedRows;
    }
    return sortRankingDisplayRows(
      rows.filter((row) => !row.isWorkflowSummary),
      sort,
      rankNumbers,
      extendedRanks,
    );
  }, [defaultSortedRows, rows, sort, rankNumbers, extendedRanks]);

  const handleSort = (column: string) => {
    const col = column as RankingSortColumn;
    setSort((current) =>
      nextTableSortState(current, col, defaultRankingSortDirection(col)),
    );
  };

  if (sortedRows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  const emptyDual: MetricDualRank = { countPlace: null, amountPlace: null };

  return (
    <EvaluationTableScroll
      snapshot={snapshot}
      footer={
        <p className={TABLE_FOOTER_CLASS}>
          共 {sortedRows.length} 条 · 点击列标题排序（排名优先金额名次） · {EVALUATION_AMOUNT_RULES} · {AGGREGATE_RANK_FOOTNOTE} · {footnote}
          {designerExtendedMetrics ? ` · ${DESIGNER_EXTENDED_RANK_RULES}` : ""}
        </p>
      }
    >
      <table className={EVAL_DATA_TABLE_CLASS}>
        <thead>
          <TableAlgorithmCaption>
            {EVALUATION_AMOUNT_RULES} · {AGGREGATE_RANK_FOOTNOTE} · {footnote}
            {designerExtendedMetrics ? ` · ${DESIGNER_EXTENDED_RANK_RULES}` : ""}
          </TableAlgorithmCaption>
          <tr className={`vi-table-head-row ${TABLE_HEAD_STICKY_CLASS}`}>
              <SortableTh
                label={nameColumnLabel}
                column="label"
                activeColumn={sort.column}
                direction={sort.direction}
                onSort={handleSort}
                align="left"
                className={`${TABLE_NAME_TH_CLASS} sticky left-0 z-20 vi-table-head-cell text-left shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]`}
              />
              <SortableTh
                label="合计排名"
                column="totalRank"
                activeColumn={sort.column}
                direction={sort.direction}
                onSort={handleSort}
                className={thClass}
              />
              {dualRankColumns.map((col) => (
                <SortableTh
                  key={col.key}
                  label={col.label}
                  column={col.key}
                  activeColumn={sort.column}
                  direction={sort.direction}
                  onSort={handleSort}
                  className={thClass}
                />
              ))}
              {designerExtendedMetrics
                ? designerExtraRankColumns.map((col) => (
                    <SortableTh
                      key={col.key}
                      label={col.label}
                      column={col.key}
                      activeColumn={sort.column}
                      direction={sort.direction}
                      onSort={handleSort}
                      className={thClass}
                    />
                  ))
                : null}
              {refundedColumns.map((col) => (
                <SortableTh
                  key={col.key}
                  label={col.label}
                  column={col.key}
                  activeColumn={sort.column}
                  direction={sort.direction}
                  onSort={handleSort}
                  className={thClass}
                />
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRows.map((row) => {
              const ranks = rankNumbers.get(row.key);
              const extended = extendedRanks?.get(row.key);
              return (
                <tr key={row.key} className="hover:bg-slate-50/50">
                  <td
                    className={`${TABLE_NAME_TD_CLASS} sticky left-0 z-[1] bg-white font-medium text-slate-900 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.04)]`}
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
                  {refundedColumns.map((col) => (
                    <RefundedCell
                      key={col.key}
                      filled={
                        col.key === "pendingRefund"
                          ? (ranks?.pendingRefundFilled ?? false)
                          : (ranks?.confirmedRefundFilled ?? false)
                      }
                    />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
    </EvaluationTableScroll>
  );
}
