"use client";

import { CommissionSettingsPanel } from "@/components/admin/commission-settings-panel";
import { useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useOrders } from "@/context/orders-context";
import { exportCommissionDraftCsv } from "@/lib/commission-export";
import { canViewCommissionExport } from "@/lib/commission-settings";
import { formatPeriodLabel, getCurrentYearMonth, type PeriodSelection } from "@/lib/period-filter";
import {
  exportAppBackup,
  exportDuplicateReportCsv,
  parseAppBackupFile,
  restoreAppBackup,
} from "@/lib/app-backup";
import {
  findDuplicateAddressGroups,
  formatDuplicateGroupSummary,
} from "@/lib/duplicate-orders-report";
import { exportOrdersToCsv } from "@/lib/order-list-export";
import { resolveOrderCustomerName } from "@/lib/order-remark";

export function DataToolsPanel() {
  const { user, staffRecords, commissionSettings } = useAuth();
  const { orders, supplements } = useOrders();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [restorePending, setRestorePending] = useState(false);
  const [commissionPeriod, setCommissionPeriod] = useState<PeriodSelection>({
    preset: "custom",
    yearMonth: getCurrentYearMonth(),
  });

  const canExportCommission = canViewCommissionExport(user, commissionSettings);

  const duplicateGroups = useMemo(
    () => findDuplicateAddressGroups(orders),
    [orders],
  );

  const duplicateOrderCount = useMemo(
    () => duplicateGroups.reduce((sum, group) => sum + group.orders.length, 0),
    [duplicateGroups],
  );

  function handleExportBackup() {
    exportAppBackup({ orders, supplements });
  }

  function handleExportAllOrders() {
    exportOrdersToCsv(orders, "全部订单");
  }

  function handleExportDuplicates() {
    exportDuplicateReportCsv(
      duplicateGroups.map((group) => ({
        displayAddress: group.displayAddress,
        orders: group.orders.map((order) => ({
          id: order.id,
          status: order.status,
          dispatcherName: order.dispatcherName,
          customerName: resolveOrderCustomerName(order),
        })),
      })),
    );
  }

  async function handleImportFile(file: File) {
    setImportError(null);
    try {
      const text = await file.text();
      const snapshot = parseAppBackupFile(text);
      if (!Array.isArray(snapshot.orders)) {
        throw new Error("备份文件缺少订单数据");
      }
      setRestorePending(true);
      restoreAppBackup(snapshot);
    } catch (error) {
      setRestoreError(error);
    }
  }

  function setRestoreError(error: unknown) {
    setRestorePending(false);
    setImportError(
      error instanceof Error ? error.message : "无法解析备份文件，请确认格式正确",
    );
  }

  return (
    <div className="space-y-4">
      <CommissionSettingsPanel />

      {canExportCommission ? (
        <section className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">提成核算底稿</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            按上方保存的比例导出派单人 + 设计师绩效与建议提成基数。
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-600">
              统计月份
              <input
                type="month"
                value={commissionPeriod.yearMonth ?? getCurrentYearMonth()}
                onChange={(event) =>
                  setCommissionPeriod({
                    preset: "custom",
                    yearMonth: event.target.value,
                  })
                }
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={() =>
                exportCommissionDraftCsv(
                  orders,
                  supplements,
                  staffRecords,
                  commissionPeriod,
                  commissionSettings,
                )
              }
              className="vi-btn vi-btn-primary text-sm"
            >
              导出{formatPeriodLabel(commissionPeriod)}提成底稿 CSV
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">数据备份与恢复</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          导出包含订单、增补单、人员名册与系统设置的完整 JSON 备份。恢复将覆盖本机浏览器中的全部业务数据，操作前请先导出当前备份。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="vi-btn vi-btn-primary text-sm"
          >
            导出完整备份 JSON
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="vi-btn vi-btn-secondary text-sm"
            disabled={restorePending}
          >
            {restorePending ? "正在恢复…" : "从备份文件恢复"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void handleImportFile(file);
            }}
          />
        </div>
        {importError ? (
          <p className="mt-2 text-xs text-red-600">{importError}</p>
        ) : null}
        <p className="mt-3 text-[11px] text-slate-400">
          当前：{orders.length} 笔订单 · {supplements.length} 笔增补单
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">订单数据导出</h2>
        <p className="mt-1 text-xs text-slate-500">
          导出全部订单为 CSV，可在 Excel 中做二次分析或存档。
        </p>
        <button
          type="button"
          onClick={handleExportAllOrders}
          className="vi-btn vi-btn-secondary mt-3 text-sm"
          disabled={orders.length === 0}
        >
          导出全部订单 CSV（{orders.length} 笔）
        </button>
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-amber-950">重复地址检测</h2>
            <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
              同一地址存在多笔未退单订单时列入下方清单，便于核对误录或撞单。
            </p>
          </div>
          {duplicateGroups.length > 0 ? (
            <button
              type="button"
              onClick={handleExportDuplicates}
              className="vi-btn vi-btn-secondary shrink-0 text-sm"
            >
              导出重复报告 CSV
            </button>
          ) : null}
        </div>

        {duplicateGroups.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-amber-200 bg-white/70 px-3 py-6 text-center text-sm text-amber-900/70">
            未发现重复地址订单
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-amber-900">
              {duplicateGroups.length} 组重复地址 · 涉及 {duplicateOrderCount} 笔订单
            </p>
            <ul className="max-h-[min(24rem,50vh)] space-y-2 overflow-y-auto">
              {duplicateGroups.map((group) => (
                <li
                  key={group.addressKey}
                  className="rounded-lg border border-amber-200/80 bg-white px-3 py-2.5 text-sm"
                >
                  <p className="font-medium text-slate-900">{group.displayAddress}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {formatDuplicateGroupSummary(group)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
