"use client";

import { formatDispatchMoney } from "@/lib/dispatch-totals";
import type { ManagerAlertItem } from "@/lib/manager-alerts";

interface ManagerAlertPanelProps {
  alerts: ManagerAlertItem[];
  onSelectDesigner?: (designer: string) => void;
  embedded?: boolean;
}

export function ManagerAlertPanel({
  alerts,
  onSelectDesigner,
  embedded = false,
}: ManagerAlertPanelProps) {
  if (alerts.length === 0 && !embedded) return null;

  const byType = {
    量尺超时: alerts.filter((a) => a.alert === "量尺超时"),
    出图超时: alerts.filter((a) => a.alert === "出图超时"),
    签约超时: alerts.filter((a) => a.alert === "签约超时"),
    下单超时: alerts.filter((a) => a.alert === "下单超时"),
  };

  const wrapperClass = embedded
    ? ""
    : "rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-4";

  return (
    <div className={wrapperClass}>
      {!embedded ? (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-rose-900">
              需跟进（{alerts.length}）
            </h2>
            <p className="mt-0.5 text-xs text-rose-700/90">
              量尺 {byType.量尺超时.length} · 出图 {byType.出图超时.length} · 签约{" "}
              {byType.签约超时.length} · 下单 {byType.下单超时.length}
            </p>
          </div>
        </div>
      ) : (
        <p className="mb-2 text-xs text-slate-500">
          实时待办 · 量尺 {byType.量尺超时.length} · 出图 {byType.出图超时.length} · 签约{" "}
          {byType.签约超时.length} · 下单 {byType.下单超时.length}
        </p>
      )}

      {alerts.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          当前无流程超时待跟进
        </p>
      ) : (
        <ul className="mt-1 max-h-64 space-y-2 overflow-y-auto">
          {alerts.slice(0, 12).map((item) => (
            <li
              key={item.orderId}
              className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-rose-100/80 bg-white/90 px-3 py-2 text-xs"
            >
              <span className="rounded bg-rose-600 px-1.5 py-0.5 font-medium text-white">
                {item.alert}
              </span>
              <span className="font-semibold text-red-600">{item.customerName}</span>
              <span className="text-slate-500">{item.status}</span>
              {onSelectDesigner ? (
                <button
                  type="button"
                  onClick={() => onSelectDesigner(item.designer)}
                  className="font-medium text-sky-800 hover:underline"
                >
                  {item.designer}
                </button>
              ) : (
                <span className="text-sky-800">{item.designer}</span>
              )}
              <span className="text-slate-400">
                已停 {item.daysStuck} 天 · {formatDispatchMoney(item.budget)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {alerts.length > 12 ? (
        <p className="mt-2 text-[11px] text-rose-600">
          另有 {alerts.length - 12} 条，请用设计师筛选或搜索查看
        </p>
      ) : null}
    </div>
  );
}
