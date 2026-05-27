"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ACCESS_LEVEL_DESCRIPTIONS,
  ACCESS_LEVEL_OPTIONS,
  type StaffAccessLevel,
} from "@/lib/staff-access";
import {
  BUILTIN_ADDABLE_POSITIONS,
  resolveDefaultAccessLevelForPosition,
} from "@/lib/staff-positions";
import {
  isReservedPositionName,
  loadCustomPositionDefinitions,
  saveCustomPositionDefinitions,
  type CustomPositionDefinition,
} from "@/lib/staff-config-storage";
import { FormEvent, useMemo, useState } from "react";

interface StaffPositionConfigProps {
  onChanged?: () => void;
}

export function StaffPositionConfig({ onChanged }: StaffPositionConfigProps) {
  const [definitions, setDefinitions] = useState<CustomPositionDefinition[]>(
    () => loadCustomPositionDefinitions(),
  );
  const [name, setName] = useState("");
  const [defaultAccessLevel, setDefaultAccessLevel] =
    useState<StaffAccessLevel>("personal");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const builtinRows = useMemo(
    () =>
      BUILTIN_ADDABLE_POSITIONS.map((position) => ({
        name: position,
        defaultAccessLevel: resolveDefaultAccessLevelForPosition(position),
        builtin: true,
      })),
    [],
  );

  function persist(next: CustomPositionDefinition[]) {
    saveCustomPositionDefinitions(next);
    setDefinitions(next);
    onChanged?.();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("请填写岗位名称");
      return;
    }
    if (isReservedPositionName(trimmed)) {
      setError("该岗位为系统内置，无需重复添加");
      return;
    }
    if (definitions.some((d) => d.name === trimmed)) {
      setError("该岗位已存在");
      return;
    }
    const next = [...definitions, { name: trimmed, defaultAccessLevel }];
    persist(next);
    setName("");
    setDefaultAccessLevel("personal");
    setError("");
    setMessage(`已添加岗位「${trimmed}」`);
    window.setTimeout(() => setMessage(""), 2500);
  }

  function handleRemove(positionName: string) {
    persist(definitions.filter((d) => d.name !== positionName));
    setMessage(`已移除岗位「${positionName}」`);
    window.setTimeout(() => setMessage(""), 2500);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">配置岗位</h2>
        <p className="mt-1 text-sm text-slate-500">
          在「添加人员」的岗位下拉中增加选项；内置岗位（含总经理）不可删除
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-4 sm:grid-cols-2"
        >
          <Input
            label="岗位名称"
            name="positionName"
            required
            placeholder="例如：区域经理"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
          />
          <Select
            label="默认权限"
            name="defaultAccessLevel"
            value={defaultAccessLevel}
            options={ACCESS_LEVEL_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            onChange={(e) =>
              setDefaultAccessLevel(e.target.value as StaffAccessLevel)
            }
          />
          <div className="sm:col-span-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {ACCESS_LEVEL_DESCRIPTIONS[defaultAccessLevel]}
          </div>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <Button type="submit">添加岗位</Button>
            {message ? (
              <span className="text-sm text-emerald-600">{message}</span>
            ) : null}
            {error ? (
              <span className="text-sm text-red-600">{error}</span>
            ) : null}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">岗位</th>
              <th className="px-4 py-3">默认权限</th>
              <th className="px-4 py-3">来源</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {builtinRows.map((row) => (
              <tr key={row.name}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {row.name}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {
                    ACCESS_LEVEL_OPTIONS.find(
                      (o) => o.value === row.defaultAccessLevel,
                    )?.label
                  }
                </td>
                <td className="px-4 py-3 text-slate-500">内置</td>
                <td className="px-4 py-3 text-slate-400">—</td>
              </tr>
            ))}
            {definitions.map((row) => (
              <tr key={row.name}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {row.name}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {
                    ACCESS_LEVEL_OPTIONS.find(
                      (o) => o.value === row.defaultAccessLevel,
                    )?.label
                  }
                </td>
                <td className="px-4 py-3 text-slate-500">已添加</td>
                <td className="px-4 py-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="px-2 py-1 text-xs text-red-600 hover:text-red-700"
                    onClick={() => handleRemove(row.name)}
                  >
                    移除
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {definitions.length === 0 ? (
          <p className="border-t border-slate-100 px-4 py-4 text-center text-xs text-slate-400">
            暂无自定义岗位，可在上方添加
          </p>
        ) : null}
      </section>
    </div>
  );
}
