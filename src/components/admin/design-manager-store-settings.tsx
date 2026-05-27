"use client";

import {
  getPhysicalStoreOptions,
  MAX_DESIGN_MANAGER_STORES,
} from "@/lib/assigned-stores";
import { HEADQUARTERS_STORE, getStaffStoreSettingOptions } from "@/lib/stores";
import type { StoreName } from "@/lib/types";

interface DesignManagerStoreSettingsProps {
  homeStore: StoreName;
  extraStores?: StoreName[];
  compact?: boolean;
  onHomeStoreChange: (store: StoreName) => void;
  onExtraStoresChange: (stores: StoreName[]) => void;
}

const selectClass =
  "w-full min-w-[7rem] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100";

export function DesignManagerStoreSettings({
  homeStore,
  extraStores = [],
  compact = false,
  onHomeStoreChange,
  onExtraStoresChange,
}: DesignManagerStoreSettingsProps) {
  const primaryOptions = getStaffStoreSettingOptions();
  const physicalOptions = getPhysicalStoreOptions();
  const maxExtra = MAX_DESIGN_MANAGER_STORES - 1;
  const isHeadquarters = homeStore === HEADQUARTERS_STORE;

  function usedStores(excludeIndex?: number): Set<StoreName> {
    const used = new Set<StoreName>([homeStore]);
    extraStores.forEach((store, index) => {
      if (index !== excludeIndex) used.add(store);
    });
    return used;
  }

  function handleExtraChange(index: number, store: StoreName) {
    const next = [...extraStores];
    next[index] = store;
    onExtraStoresChange(next.filter(Boolean));
  }

  function handleAddStore() {
    if (extraStores.length >= maxExtra) return;
    const taken = usedStores();
    const nextStore = physicalOptions.find((s) => !taken.has(s));
    if (!nextStore) return;
    onExtraStoresChange([...extraStores, nextStore]);
  }

  function handleRemoveStore(index: number) {
    onExtraStoresChange(extraStores.filter((_, i) => i !== index));
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <select
          value={homeStore}
          onChange={(e) => onHomeStoreChange(e.target.value as StoreName)}
          className={selectClass}
        >
          {primaryOptions.map((store) => (
            <option key={store} value={store}>
              {store === HEADQUARTERS_STORE ? store : `主门店 · ${store}`}
            </option>
          ))}
        </select>
        {!isHeadquarters ? (
          <div className="space-y-1.5">
            {extraStores.map((store, index) => (
              <div key={`${index}-${store}`} className="flex items-center gap-1">
                <select
                  value={store}
                  onChange={(e) =>
                    handleExtraChange(index, e.target.value as StoreName)
                  }
                  className={`${selectClass} min-w-0 flex-1`}
                >
                  {physicalOptions
                    .filter(
                      (option) =>
                        option === store || !usedStores(index).has(option),
                    )
                    .map((option) => (
                      <option key={option} value={option}>
                        第{index + 2}门店 · {option}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleRemoveStore(index)}
                  className="shrink-0 rounded-md px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  title="移除门店"
                >
                  移除
                </button>
              </div>
            ))}
            {extraStores.length < maxExtra ? (
              <button
                type="button"
                onClick={handleAddStore}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
              >
                + 添加门店
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          主门店
        </label>
        <select
          value={homeStore}
          onChange={(e) => onHomeStoreChange(e.target.value as StoreName)}
          className={selectClass}
        >
          {primaryOptions.map((store) => (
            <option key={store} value={store}>
              {store}
            </option>
          ))}
        </select>
      </div>
      {!isHeadquarters ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            可再添加最多 {maxExtra} 个门店，权限与汇总范围覆盖全部所属门店
          </p>
          {extraStores.map((store, index) => (
            <div key={`${index}-${store}`} className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  第 {index + 2} 门店
                </label>
                <select
                  value={store}
                  onChange={(e) =>
                    handleExtraChange(index, e.target.value as StoreName)
                  }
                  className={selectClass}
                >
                  {physicalOptions
                    .filter(
                      (option) =>
                        option === store || !usedStores(index).has(option),
                    )
                    .map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveStore(index)}
                className="mb-0.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
              >
                移除
              </button>
            </div>
          ))}
          {extraStores.length < maxExtra ? (
            <button
              type="button"
              onClick={handleAddStore}
              className="rounded-lg border border-dashed border-emerald-200 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
            >
              + 添加第 {extraStores.length + 2} 门店
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
