"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import {
  isReservedStoreName,
  loadCustomStoreNames,
  saveCustomStoreNames,
} from "@/lib/staff-config-storage";
import {
  HEADQUARTERS_STORE,
  isBuiltinPhysicalStore,
  PHYSICAL_STORES,
} from "@/lib/stores";
import { FormEvent, useMemo, useState } from "react";

interface StaffStoreConfigProps {
  onChanged?: () => void;
}

export function StaffStoreConfig({ onChanged }: StaffStoreConfigProps) {
  const { staffRecords } = useAuth();
  const [customStores, setCustomStores] = useState<string[]>(() =>
    loadCustomStoreNames(),
  );
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const allRows = useMemo(() => {
    const builtin = [...PHYSICAL_STORES].map((store) => ({
      name: store,
      builtin: true,
    }));
    const custom = customStores.map((store) => ({
      name: store,
      builtin: false,
    }));
    return [...builtin, ...custom, { name: HEADQUARTERS_STORE, builtin: true }];
  }, [customStores]);

  function persist(next: string[]) {
    saveCustomStoreNames(next);
    setCustomStores(next);
    onChanged?.();
  }

  function storeInUse(storeName: string): boolean {
    return staffRecords.some(
      (s) =>
        s.homeStore === storeName ||
        (s.extraStores ?? []).includes(storeName as typeof s.homeStore),
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("请填写门店名称");
      return;
    }
    if (isReservedStoreName(trimmed)) {
      setError("「总部」为系统保留，不可作为自定义门店添加");
      return;
    }
    if (
      isBuiltinPhysicalStore(trimmed) ||
      customStores.includes(trimmed)
    ) {
      setError("该门店已存在");
      return;
    }
    persist([...customStores, trimmed]);
    setName("");
    setError("");
    setMessage(`已添加门店「${trimmed}」`);
    window.setTimeout(() => setMessage(""), 2500);
  }

  function handleRemove(storeName: string) {
    if (storeInUse(storeName)) {
      setError(`「${storeName}」仍有关联人员，请先调整其门店设置`);
      return;
    }
    persist(customStores.filter((s) => s !== storeName));
    setError("");
    setMessage(`已移除门店「${storeName}」`);
    window.setTimeout(() => setMessage(""), 2500);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">门店配置</h2>
        <p className="mt-1 text-sm text-slate-500">
          在「门店设置」下拉中增加实体门店名称；内置门店与「总部」不可删除
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1">
            <Input
              label="门店名称"
              name="storeName"
              required
              placeholder="例如：河西天冠"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
            />
          </div>
          <Button type="submit">添加门店</Button>
          {message ? (
            <span className="text-sm text-emerald-600">{message}</span>
          ) : null}
          {error ? (
            <span className="text-sm text-red-600">{error}</span>
          ) : null}
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">门店</th>
              <th className="px-4 py-3">来源</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allRows.map((row) => (
              <tr key={row.name}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {row.name}
                  {row.name === HEADQUARTERS_STORE ? (
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      人员管理专用
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {row.builtin ? "内置" : "已添加"}
                </td>
                <td className="px-4 py-3">
                  {row.builtin ? (
                    <span className="text-slate-400">—</span>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-2 py-1 text-xs text-red-600 hover:text-red-700"
                      onClick={() => handleRemove(row.name)}
                    >
                      移除
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
