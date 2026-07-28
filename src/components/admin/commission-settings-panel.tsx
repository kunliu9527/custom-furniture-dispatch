"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import {
  COMMISSION_VISIBILITY_LEVELS,
  DEFAULT_COMMISSION_RATES,
  DEFAULT_COMMISSION_SETTINGS,
  canManageCommissionSettings,
  commissionVisibilityLabel,
  formatCommissionRatesSummary,
  type CommissionRateConfig,
  type CommissionSettings,
} from "@/lib/commission-settings";
import { FormEvent, useEffect, useState } from "react";

function RateField({
  label,
  hint,
  value,
  onChange,
  step = "0.1",
  suffix = "%",
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (n: number) => void;
  step?: string;
  suffix?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-700">{label}</span>
      {hint ? <span className="block text-[11px] text-slate-400">{hint}</span> : null}
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={0}
          max={suffix === "%" ? 100 : undefined}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full max-w-[8rem] rounded-md border border-slate-200 px-2 py-1.5 text-sm"
        />
        <span className="text-xs text-slate-500">{suffix}</span>
      </div>
    </label>
  );
}

export function CommissionSettingsPanel() {
  const { user, commissionSettings, updateCommissionSettings } = useAuth();
  const [rates, setRates] = useState<CommissionRateConfig>(
    commissionSettings.rates,
  );
  const [visibleFor, setVisibleFor] = useState<CommissionSettings["visibleFor"]>(
    commissionSettings.visibleFor,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRates(commissionSettings.rates);
    setVisibleFor(commissionSettings.visibleFor);
  }, [commissionSettings]);

  if (!canManageCommissionSettings(user)) {
    return null;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const result = updateCommissionSettings({
      rates,
      visibleFor,
    });
    if (!result.ok) {
      setError(result.error ?? "保存失败");
      return;
    }
    setMessage("提成比例与可见权限已保存，各端云端同步后生效");
    window.setTimeout(() => setMessage(null), 3500);
  }

  function handleReset() {
    setRates({ ...DEFAULT_COMMISSION_RATES });
    setVisibleFor({ ...DEFAULT_COMMISSION_SETTINGS.visibleFor });
    setMessage(null);
    setError(null);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50/60 to-white p-5 shadow-sm"
    >
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-900">提成比例与开放权限</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          管理员可随时调整核算比例；下方开关控制各权限角色是否能看到「提成底稿」导出（默认全部关闭，仅管理员始终可见）。
        </p>
        <p className="mt-2 text-[11px] text-sky-800/80">
          当前：{formatCommissionRatesSummary(commissionSettings.rates)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-3 rounded-lg border border-slate-200/80 bg-white/80 p-3">
          <p className="text-xs font-semibold text-slate-800">派单人</p>
          <RateField
            label="签约金额"
            value={rates.dispatcherSignedPercent}
            onChange={(n) =>
              setRates((r) => ({ ...r, dispatcherSignedPercent: n }))
            }
          />
          <RateField
            label="定金合计"
            value={rates.dispatcherDepositPercent}
            onChange={(n) =>
              setRates((r) => ({ ...r, dispatcherDepositPercent: n }))
            }
          />
          <RateField
            label="量尺前补定"
            hint="按笔数奖励（元）"
            suffix="元/笔"
            step="1"
            value={rates.dispatcherPreMeasureBonus}
            onChange={(n) =>
              setRates((r) => ({ ...r, dispatcherPreMeasureBonus: n }))
            }
          />
          <RateField
            label="下单金额"
            value={rates.dispatcherOrderedPercent}
            onChange={(n) =>
              setRates((r) => ({ ...r, dispatcherOrderedPercent: n }))
            }
          />
        </div>

        <div className="space-y-3 rounded-lg border border-slate-200/80 bg-white/80 p-3">
          <p className="text-xs font-semibold text-slate-800">设计师</p>
          <RateField
            label="下单金额"
            value={rates.designerOrderedPercent}
            onChange={(n) =>
              setRates((r) => ({ ...r, designerOrderedPercent: n }))
            }
          />
          <RateField
            label="增补金额"
            value={rates.designerSupplementPercent}
            onChange={(n) =>
              setRates((r) => ({ ...r, designerSupplementPercent: n }))
            }
          />
        </div>

        <div className="space-y-2 rounded-lg border border-slate-200/80 bg-white/80 p-3 sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-semibold text-slate-800">开放提成底稿可见</p>
          <p className="text-[11px] text-slate-500">
            开启后，对应权限在「综合系统看板」可导出提成 CSV
          </p>
          <ul className="mt-2 space-y-2">
            {COMMISSION_VISIBILITY_LEVELS.map((level) => (
              <li key={level}>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={visibleFor[level] === true}
                    onChange={(e) =>
                      setVisibleFor((prev) => ({
                        ...prev,
                        [level]: e.target.checked,
                      }))
                    }
                    className="size-4 rounded border-slate-300"
                  />
                  {commissionVisibilityLabel(level)}
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-slate-400">
            管理员始终可见本设置与提成导出
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="submit" className="text-sm">
          保存提成设置
        </Button>
        <Button type="button" variant="outline" className="text-sm" onClick={handleReset}>
          恢复默认比例
        </Button>
        {message ? (
          <span className="text-xs text-emerald-700">{message}</span>
        ) : null}
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
      </div>
    </form>
  );
}
