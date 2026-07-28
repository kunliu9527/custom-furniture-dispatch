"use client";

import type {
  DesignerPeriodSummary,
  DesignerPersonInsight,
  MonthlyLeaderboards,
  RoleScoreEntry,
  StoreScoreEntry,
} from "@/lib/report-digest-extensions";
import type { DigestAcceptanceStats } from "@/lib/report-digest-extensions";
import type { WeeklyAnomalyItem } from "@/lib/order-anomaly";
import { formatDispatchMoney } from "@/lib/dispatch-totals";
import {
  ROLE_COMPOSITE_WEIGHTS,
  STORE_COMPOSITE_FORMULA,
  STORE_VALUE_FORMULA,
} from "@/lib/performance-algorithm-copy";
import { formatPerformanceConversion } from "@/lib/designer-performance";

interface MonthlyDigestExtrasProps {
  acceptanceStats: DigestAcceptanceStats;
  leaderboards: MonthlyLeaderboards;
  designerSummary: DesignerPeriodSummary;
  showLeaderboards?: boolean;
  showStoreRanks?: boolean;
  leaderboardHeading?: string;
  /** 门店汇总简报使用「维度低评」口径 */
  ratingSummaryMode?: "default" | "dimensionLow";
}

export function MonthlyDigestExtras({
  acceptanceStats,
  leaderboards,
  designerSummary,
  showLeaderboards = true,
  showStoreRanks = true,
  leaderboardHeading = "本期排行 · 综合前5",
  ratingSummaryMode = "default",
}: MonthlyDigestExtrasProps) {
  const hasPersonRanks =
    showLeaderboards &&
    (leaderboards.dispatcherTop5.length > 0 ||
      leaderboards.designerTop5.length > 0 ||
      leaderboards.installerTop5.length > 0);
  const hasStoreRanks =
    showStoreRanks &&
    showLeaderboards &&
    (leaderboards.storeCompositeTop5.length > 0 ||
      leaderboards.storeTotalAmountTop5.length > 0 ||
      leaderboards.storeOrderedAmountTop5.length > 0);

  return (
    <div className="mt-3 space-y-3 text-xs text-slate-700">
      {(ratingSummaryMode === "dimensionLow"
        ? acceptanceStats.lowDimensionCount > 0
        : acceptanceStats.badReviewCount > 0 ||
          acceptanceStats.lowDimensionCount > 0) && (
        <div className="rounded-lg border border-rose-200 bg-rose-50/90 px-3 py-2 shadow-[var(--vi-shadow-xs)]">
          <p className="font-medium text-rose-900">
            {ratingSummaryMode === "dimensionLow" ? "维度低评" : "验收异常"}
          </p>
          <p className="mt-0.5 text-rose-800">
            {ratingSummaryMode === "dimensionLow" ? (
              <>
                维度低评 {acceptanceStats.lowDimensionCount} 单
                <span className="text-rose-600/80">
                  （综合不低但单维 &lt; 3 星；无电子验收按默认 4 星不计）
                </span>
              </>
            ) : (
              <>
                差评 {acceptanceStats.badReviewCount} 单
                {acceptanceStats.lowDimensionCount > 0
                  ? ` · 低分维度 ${acceptanceStats.lowDimensionCount} 单`
                  : ""}
                <span className="text-rose-600/80">
                  （无电子验收按默认 4 星，不计差评）
                </span>
              </>
            )}
          </p>
        </div>
      )}

      {hasPersonRanks ? (
        <div className="rounded-lg border border-[var(--vi-border-strong)] bg-white px-3 py-2 shadow-[var(--vi-shadow-xs)]">
          <p className="font-medium text-slate-800">{leaderboardHeading}</p>
          <p className="mt-0.5 text-slate-500">{ROLE_COMPOSITE_WEIGHTS}</p>
          <div className="mt-2 -mx-1 overflow-x-auto px-1">
            <div className="grid min-w-[720px] grid-cols-3 gap-3">
              <RoleScoreColumn
                role="派单人"
                entries={leaderboards.dispatcherTop5}
              />
              <RoleScoreColumn
                role="设计师"
                entries={leaderboards.designerTop5}
              />
              <RoleScoreColumn
                role="安装师"
                entries={leaderboards.installerTop5}
              />
            </div>
          </div>
        </div>
      ) : null}

      {hasStoreRanks ? (
        <div className="rounded-lg border border-[var(--vi-border-strong)] bg-white px-3 py-2 shadow-[var(--vi-shadow-xs)]">
          <p className="font-medium text-slate-800">门店前5</p>
          <p className="mt-0.5 text-slate-500">
            {STORE_VALUE_FORMULA} · {STORE_COMPOSITE_FORMULA}
          </p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {leaderboards.storeCompositeTop5.length > 0 ? (
              <StoreRankList
                title="综合前5"
                entries={leaderboards.storeCompositeTop5}
                showComposite
              />
            ) : null}
            {leaderboards.storeTotalAmountTop5.length > 0 ? (
              <StoreRankList
                title="总订单额前5"
                entries={leaderboards.storeTotalAmountTop5}
                metric="total"
              />
            ) : null}
            {leaderboards.storeOrderedAmountTop5.length > 0 ? (
              <StoreRankList
                title="下单额前5"
                entries={leaderboards.storeOrderedAmountTop5}
                metric="ordered"
              />
            ) : null}
          </div>
        </div>
      ) : null}

      <DesignerSummaryBlock
        summary={designerSummary}
        ratingSummaryMode={ratingSummaryMode}
      />
    </div>
  );
}

export function WeeklyDigestExtras({
  weeklyAnomalies,
  designerSummary,
  showDesignerSummary = true,
}: {
  weeklyAnomalies: WeeklyAnomalyItem[];
  designerSummary: DesignerPeriodSummary;
  showDesignerSummary?: boolean;
}) {
  return (
    <div className="mt-3 space-y-3 text-xs text-slate-700">
      <WeeklyAnomalyBlock items={weeklyAnomalies} />
      {showDesignerSummary ? (
        <DesignerSummaryBlock summary={designerSummary} compact />
      ) : null}
    </div>
  );
}

export function WeeklyAnomalyBlock({ items }: { items: WeeklyAnomalyItem[] }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50/90 px-3 py-2 shadow-[var(--vi-shadow-xs)]">
      <p className="font-medium text-rose-900">本周已产生异常项</p>
      {items.length === 0 ? (
        <p className="mt-1 text-rose-800/80">本周暂无异常订单</p>
      ) : (
        <ul className="mt-1.5 space-y-1">
          {items.map((item) => (
            <li key={item.orderId} className="leading-relaxed text-rose-900/90">
              <span className="font-medium text-rose-950">{item.orderName}</span>
              <span className="text-rose-800"> · {item.labels.join("、")}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RoleScoreColumn({
  role,
  entries,
}: {
  role: string;
  entries: RoleScoreEntry[];
}) {
  return (
    <div className="min-w-0">
      <p className="border-b border-slate-200 pb-1 font-medium text-slate-800">{role}</p>
      {entries.length === 0 ? (
        <p className="mt-2 text-slate-400">暂无样本</p>
      ) : (
        <ul className="mt-1.5 space-y-2">
          {entries.map((entry, i) => (
            <li
              key={entry.name}
              className="rounded-md border border-[var(--vi-border-strong)] bg-white px-2 py-1.5 shadow-[var(--vi-shadow-xs)]"
            >
              <p className="font-medium leading-snug text-slate-800">
                {i + 1}. {entry.name}
                <span className="ml-1 text-rose-700">综合 {entry.compositeScore}</span>
              </p>
              <p className="text-slate-500">{entry.highlight}</p>
              <DimensionBars entry={entry} />
              <p className="mt-1 leading-snug text-slate-600">{entry.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DimensionBars({ entry }: { entry: RoleScoreEntry }) {
  const dims: { label: string; value: number; color: string }[] = [
    { label: "产值", value: entry.outputScore, color: "bg-emerald-500" },
    { label: "效率", value: entry.efficiencyScore, color: "bg-sky-500" },
    { label: "质量", value: entry.qualityScore, color: "bg-sky-500" },
  ].filter((d) => !(d.label === "产值" && entry.outputScore === 0));

  return (
    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
      {dims.map((d) => (
        <span key={d.label} className="inline-flex items-center gap-1 text-[10px] text-slate-500">
          {d.label}
          <span className="inline-block h-1.5 w-10 overflow-hidden rounded-full bg-slate-200">
            <span
              className={`block h-full ${d.color}`}
              style={{ width: `${d.value}%` }}
            />
          </span>
          {d.value}
        </span>
      ))}
    </div>
  );
}

function StoreRankList({
  title,
  entries,
  metric = "composite",
  showComposite = false,
}: {
  title: string;
  entries: StoreScoreEntry[];
  metric?: "total" | "ordered" | "composite";
  showComposite?: boolean;
}) {
  const metricHint =
    metric === "ordered"
      ? "按当期下单额降序"
      : metric === "total"
        ? "按合计金额（四桶之和）降序"
        : null;

  return (
    <div className="min-w-0">
      <p className="text-slate-500">{title}</p>
      {metricHint ? (
        <p className="text-[10px] text-slate-400">{metricHint}</p>
      ) : null}
      <ul className="mt-1 space-y-1.5">
        {entries.map((entry, i) => (
          <li
            key={`${title}-${entry.store}`}
            className="rounded-md border border-[var(--vi-border-strong)] bg-white px-2 py-1.5 shadow-[var(--vi-shadow-xs)]"
          >
            <p className="font-medium text-slate-800">
              {i + 1}. {entry.store}
              {showComposite ? (
                <span className="ml-1 text-rose-700">综合 {entry.compositeScore}</span>
              ) : null}
            </p>
            <p className="text-slate-600">
              {metric === "ordered"
                ? formatDispatchMoney(entry.orderedAmount)
                : metric === "total"
                  ? formatDispatchMoney(entry.grossTotalAmount)
                  : `${formatDispatchMoney(entry.grossTotalAmount)} · 下单 ${formatDispatchMoney(entry.orderedAmount)}`}
            </p>
            {(entry.pendingRefundCount > 0 ||
              entry.confirmedRefundCount > 0 ||
              entry.afterSalesAmount > 0) && (
              <p className="text-[11px] text-slate-500">
                {entry.pendingRefundCount > 0
                  ? `待退单 ${entry.pendingRefundCount} 单 · `
                  : ""}
                {entry.confirmedRefundCount > 0
                  ? `已退单 ${entry.confirmedRefundCount} 单 · `
                  : ""}
                {entry.afterSalesAmount > 0
                  ? `售后 ${formatDispatchMoney(entry.afterSalesAmount)}`
                  : ""}
              </p>
            )}
            <p className="mt-0.5 text-slate-500">{entry.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DesignerSummaryBlock({
  summary,
  compact = false,
  ratingSummaryMode = "default",
}: {
  summary: DesignerPeriodSummary;
  compact?: boolean;
  ratingSummaryMode?: "default" | "dimensionLow";
}) {
  const hasConversionRanks = compact && summary.topConversion.length > 0;
  const hasPortraits =
    summary.topPerformers.length > 0 || summary.needsImprovement.length > 0;

  return (
    <div className="rounded-lg border border-[var(--vi-border-strong)] bg-white px-3 py-2 shadow-[var(--vi-shadow-xs)]">
      <p className="font-medium text-slate-800">设计师环节</p>
      {summary.sectionSummary ? (
        <p className="mt-1 leading-relaxed text-slate-700">{summary.sectionSummary}</p>
      ) : null}
      <p className="mt-1 text-slate-600">
        在途 {summary.inProgressTotal} · 超时 {summary.timeoutTotal} · 退单{" "}
        {summary.refundTotal}
        {!compact && ratingSummaryMode === "dimensionLow"
          ? ` · 维度低评 ${summary.lowDimensionTotal}`
          : null}
        {!compact && ratingSummaryMode !== "dimensionLow"
          ? ` · 验收差评 ${summary.badReviewTotal}`
          : null}
        {summary.eligibleDesignerCount > 0
          ? ` · ${summary.eligibleDesignerCount} 人参与排名`
          : null}
      </p>
      {hasPortraits ? (
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DesignerPortraitList
            title="表现优秀"
            items={summary.topPerformers}
            tone="good"
          />
          <DesignerPortraitList
            title="待加强"
            items={summary.needsImprovement}
            tone="warn"
          />
        </div>
      ) : null}
      {hasConversionRanks ? (
        <div className="mt-2">
          <RankList
            title="转化前5"
            items={summary.topConversion.map(
              (r, i) =>
                `${i + 1}. ${r.name} · ${formatPerformanceConversion(r.rate)} · 下单 ${formatDispatchMoney(r.orderedAmount)}`,
            )}
          />
        </div>
      ) : null}
    </div>
  );
}

function DesignerPortraitList({
  title,
  items,
  tone,
}: {
  title: string;
  items: DesignerPersonInsight[];
  tone: "good" | "warn";
}) {
  if (items.length === 0) {
    return (
      <div className="min-w-0">
        <p className="text-slate-500">{title}</p>
        <p className="mt-1 text-slate-400">—</p>
      </div>
    );
  }

  const cardClass =
    tone === "good"
      ? "rounded-md bg-emerald-50/80 px-2 py-1.5 ring-1 ring-emerald-100"
      : "rounded-md bg-amber-50/80 px-2 py-1.5 ring-1 ring-amber-100";
  const nameClass = tone === "good" ? "text-emerald-950" : "text-amber-950";
  const metaClass = tone === "good" ? "text-emerald-800" : "text-amber-800";
  const summaryClass = tone === "good" ? "text-emerald-900/90" : "text-amber-900/90";

  return (
    <div className="min-w-0">
      <p className="text-slate-500">{title}</p>
      <ul className="mt-1 space-y-1.5">
        {items.map((r) => (
          <li key={r.name} className={cardClass}>
            <p className={`font-medium ${nameClass}`}>
              {r.name}
              <span className={`ml-1.5 font-normal ${metaClass}`}>
                第 {r.rank}/{r.totalRanked} · 综合 {r.compositeScore} · {r.highlight}
              </span>
            </p>
            <p className={`mt-0.5 leading-relaxed ${summaryClass}`}>{r.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RankList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="min-w-0">
      <p className="text-slate-500">{title}</p>
      <ul className="mt-0.5 space-y-0.5">
        {items.map((line) => (
          <li key={line} className="truncate text-slate-700" title={line}>
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
