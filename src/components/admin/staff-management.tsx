"use client";

import { DesignManagerStoreSettings } from "@/components/admin/design-manager-store-settings";
import { StaffPositionConfig } from "@/components/admin/staff-position-config";
import { StaffStoreConfig } from "@/components/admin/staff-store-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import { canManageStaff } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/auth-users";
import {
  ACCESS_LEVEL_DESCRIPTIONS,
  ACCESS_LEVEL_LABELS,
  ACCESS_LEVEL_OPTIONS,
  defaultAccessLevelForPosition,
  type StaffAccessLevel,
} from "@/lib/staff-access";
import {
  getAddablePositionOptions,
  isDesignManagerDefaultPosition,
} from "@/lib/staff-positions";
import {
  ADMIN_STAFF_RECORD,
  BUILTIN_STAFF_RECORDS,
  getDefaultPasswordForStaff,
  type StaffPosition,
} from "@/lib/staff-roster";
import { isSystemAdminStaffRecord } from "@/lib/staff-visibility";
import { HEADQUARTERS_STORE, getStaffStoreSettingOptions } from "@/lib/stores";
import type { StoreName } from "@/lib/types";
import { FormEvent, useMemo, useState } from "react";

type StaffPanel = "roster" | "positions" | "stores";

const PANEL_TABS: { id: StaffPanel; label: string }[] = [
  { id: "roster", label: "人员名册" },
  { id: "positions", label: "配置岗位" },
  { id: "stores", label: "门店配置" },
];

const ADD_STAFF_ACCESS_OPTIONS = ACCESS_LEVEL_OPTIONS.filter(
  (o) => o.value !== "admin",
);

export function StaffManagement() {
  const {
    user,
    staffRecords,
    addStaffMember,
    updateStaffAccessLevel,
    updateStaffHomeStore,
    updateStaffExtraStores,
    resetStaffPassword,
    deleteStaffMember,
  } = useAuth();
  const [panel, setPanel] = useState<StaffPanel>("roster");
  const [configRevision, setConfigRevision] = useState(0);
  const [name, setName] = useState("");
  const [position, setPosition] = useState<StaffPosition>("派单人");
  const [homeStore, setHomeStore] = useState<StoreName>("东岸天冠");
  const [extraStores, setExtraStores] = useState<StoreName[]>([]);
  const [password, setPassword] = useState("1");
  const [accessLevel, setAccessLevel] = useState<StaffAccessLevel>(
    defaultAccessLevelForPosition("派单人"),
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [accessMessage, setAccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>(
    {},
  );
  const [resetMessage, setResetMessage] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");

  const positionOptions = useMemo(
    () => getAddablePositionOptions(),
    [configRevision],
  );

  const storeSettingOptions = useMemo(
    () => getStaffStoreSettingOptions(),
    [configRevision],
  );

  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return staffRecords;
    return staffRecords.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.position.toLowerCase().includes(q) ||
        row.homeStore.toLowerCase().includes(q) ||
        (row.extraStores ?? []).some((s) => s.toLowerCase().includes(q)) ||
        ACCESS_LEVEL_LABELS[row.accessLevel].toLowerCase().includes(q),
    );
  }, [staffRecords, searchQuery]);

  const customRecords = staffRecords.filter(
    (s) => !BUILTIN_STAFF_RECORDS.some((b) => b.id === s.id),
  );

  function bumpConfig() {
    setConfigRevision((n) => n + 1);
  }

  function handlePositionChange(next: StaffPosition) {
    setPosition(next);
    const nextLevel = defaultAccessLevelForPosition(next);
    setAccessLevel(nextLevel);
    if (isDesignManagerDefaultPosition(next)) {
      setHomeStore(HEADQUARTERS_STORE);
      setExtraStores([]);
    } else {
      setExtraStores([]);
      if (!storeSettingOptions.includes(homeStore)) {
        setHomeStore(storeSettingOptions[0]);
      }
    }
  }

  function handleExtraStoresChange(staffId: string, stores: StoreName[]) {
    const result = updateStaffExtraStores(staffId, stores);
    if (!result.ok) {
      setAccessMessage(result.error ?? "附加门店更新失败");
      return;
    }
    setAccessMessage("门店设置已更新");
    window.setTimeout(() => setAccessMessage(""), 2500);
  }

  function handleAccessLevelChange(next: StaffAccessLevel) {
    setAccessLevel(next);
    if (next === "design_manager") {
      setHomeStore(HEADQUARTERS_STORE);
      setExtraStores([]);
    } else {
      setExtraStores([]);
      if (!storeSettingOptions.includes(homeStore)) {
        setHomeStore(storeSettingOptions[0]);
      }
    }
  }

  function handleHomeStoreChange(staffId: string, store: StoreName) {
    const result = updateStaffHomeStore(staffId, store);
    if (!result.ok) {
      setAccessMessage(result.error ?? "门店设置更新失败");
      return;
    }
    setAccessMessage("门店设置已更新");
    window.setTimeout(() => setAccessMessage(""), 2500);
  }

  if (!canManageStaff(user)) {
    return (
      <p className="text-sm text-slate-500">仅管理员可添加人员与指定角色权限</p>
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const result = addStaffMember({
        name,
        position,
        homeStore,
        extraStores:
          accessLevel === "design_manager" ? extraStores : undefined,
        password,
        accessLevel,
      });
      if (!result.ok) {
        setError(result.error ?? "添加失败");
        return;
      }
      const addedName = name.trim();
      setMessage(
        `已添加「${addedName}」，账号 ${addedName}，权限 ${ACCESS_LEVEL_LABELS[accessLevel]}。请在下方「人员名册」中查看。`,
      );
      setName("");
      setPassword("1");
      setAccessLevel(defaultAccessLevelForPosition(position));
      setSearchQuery("");
      requestAnimationFrame(() => {
        document
          .getElementById("staff-roster-table")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : "未知错误";
      setError(`保存失败：${detail}（若使用 http 访问，请刷新后重试）`);
    }
  }

  function handleAccessChange(staffId: string, level: StaffAccessLevel) {
    const result = updateStaffAccessLevel(staffId, level);
    if (!result.ok) {
      setAccessMessage(result.error ?? "更新失败");
      return;
    }
    setAccessMessage("权限已更新");
    window.setTimeout(() => setAccessMessage(""), 2500);
  }

  function handleResetToDefault(staffId: string) {
    const result = resetStaffPassword(staffId);
    if (!result.ok) {
      setResetMessage(result.error ?? "重置失败");
      return;
    }
    const target = staffRecords.find((s) => s.id === staffId);
    setResetMessage(
      `已重置「${target?.name}」密码为默认（${target ? getDefaultPasswordForStaff(target) : "1"}）`,
    );
    window.setTimeout(() => setResetMessage(""), 3000);
  }

  function handleDeleteStaff(staffId: string) {
    const target = staffRecords.find((s) => s.id === staffId);
    if (!target) return;
    if (
      !window.confirm(
        `确定从名册中删除「${target.name}」？删除后该账号将无法登录（历史订单数据保留）。`,
      )
    ) {
      return;
    }
    const result = deleteStaffMember(staffId);
    if (!result.ok) {
      setDeleteMessage(result.error ?? "删除失败");
      return;
    }
    setDeleteMessage(`已删除「${target.name}」`);
    window.setTimeout(() => setDeleteMessage(""), 3000);
  }

  function handleResetCustom(staffId: string) {
    const value = resetPasswords[staffId]?.trim();
    if (!value) {
      setResetMessage("请先输入新密码");
      return;
    }
    const result = resetStaffPassword(staffId, value);
    if (!result.ok) {
      setResetMessage(result.error ?? "重置失败");
      return;
    }
    const target = staffRecords.find((s) => s.id === staffId);
    setResetMessage(`已更新「${target?.name}」密码`);
    setResetPasswords((prev) => ({ ...prev, [staffId]: "" }));
    window.setTimeout(() => setResetMessage(""), 3000);
  }

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {PANEL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setPanel(tab.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              panel === tab.id
                ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {panel === "positions" ? (
        <StaffPositionConfig onChanged={bumpConfig} />
      ) : null}

      {panel === "stores" ? (
        <StaffStoreConfig onChanged={bumpConfig} />
      ) : null}

      {panel === "roster" ? (
        <div className="space-y-8">
          <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              添加人员信息
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              录入姓名、岗位、门店设置、权限级别与登录密码；岗位与门店可在上方「配置岗位」「门店配置」中扩展
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-6 grid gap-4 sm:grid-cols-2"
            >
              <Input
                label="姓名（登录账号）"
                name="staffName"
                required
                placeholder="与登录时输入的姓名一致"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
              />
              <Select
                label="岗位"
                name="position"
                value={position}
                options={positionOptions.map((p) => ({ value: p, label: p }))}
                onChange={(e) =>
                  handlePositionChange(e.target.value as StaffPosition)
                }
              />
              <Select
                label="权限设置"
                name="accessLevel"
                value={accessLevel}
                options={ADD_STAFF_ACCESS_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                onChange={(e) =>
                  handleAccessLevelChange(e.target.value as StaffAccessLevel)
                }
              />
              {accessLevel === "design_manager" ? (
                <DesignManagerStoreSettings
                  homeStore={homeStore}
                  extraStores={extraStores}
                  onHomeStoreChange={(store) => {
                    setHomeStore(store);
                    if (store === HEADQUARTERS_STORE) setExtraStores([]);
                  }}
                  onExtraStoresChange={setExtraStores}
                />
              ) : (
                <Select
                  label="门店设置"
                  name="homeStore"
                  value={homeStore}
                  options={storeSettingOptions.map((s) => ({
                    value: s,
                    label: s,
                  }))}
                  onChange={(e) => setHomeStore(e.target.value as StoreName)}
                />
              )}
              <Input
                label="登录密码"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="sm:col-span-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                {ACCESS_LEVEL_DESCRIPTIONS[accessLevel]}
                {homeStore === "总部"
                  ? " · 总部：不受门店限制，可查看全部门店数据"
                  : accessLevel === "design_manager" && extraStores.length > 0
                    ? ` · 所属门店：${[homeStore, ...extraStores].join("、")}`
                    : ""}
              </div>
              <div className="sm:col-span-2 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit">保存人员</Button>
                </div>
                {message ? (
                  <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
                    {message}
                  </p>
                ) : null}
                {error ? (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800 ring-1 ring-red-200">
                    {error}
                  </p>
                ) : null}
              </div>
            </form>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  人员名册
                </h2>
                <p className="text-sm text-slate-500">
                  内置 {BUILTIN_STAFF_RECORDS.length} 人 + 已添加{" "}
                  {customRecords.length} 人 · 可搜索并重置密码
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[220px]">
                  <Input
                    label="搜索"
                    name="staffSearch"
                    placeholder="姓名、岗位、门店设置、权限…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {accessMessage ? (
                  <span className="text-sm text-emerald-600">
                    {accessMessage}
                  </span>
                ) : null}
                {resetMessage ? (
                  <span className="text-sm text-emerald-600">
                    {resetMessage}
                  </span>
                ) : null}
                {deleteMessage ? (
                  <span className="text-sm text-emerald-600">
                    {deleteMessage}
                  </span>
                ) : null}
              </div>
            </div>
            <div
              id="staff-roster-table"
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">姓名</th>
                      <th className="px-4 py-3">岗位</th>
                      <th className="px-4 py-3">门店设置</th>
                      <th className="px-4 py-3">权限设置</th>
                      <th className="px-4 py-3">说明</th>
                      <th className="px-4 py-3">来源</th>
                      <th className="px-4 py-3">重置密码</th>
                      <th className="px-4 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStaff.map((row) => {
                      const isSystemAdmin = isSystemAdminStaffRecord(row);
                      return (
                        <tr key={row.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {row.name}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {row.position}
                            <span className="ml-1 text-xs text-slate-400">
                              ({ROLE_LABELS[row.role]})
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {row.accessLevel === "design_manager" ? (
                              <DesignManagerStoreSettings
                                compact
                                homeStore={row.homeStore}
                                extraStores={row.extraStores}
                                onHomeStoreChange={(store) =>
                                  handleHomeStoreChange(row.id, store)
                                }
                                onExtraStoresChange={(stores) =>
                                  handleExtraStoresChange(row.id, stores)
                                }
                              />
                            ) : (
                              <select
                                value={row.homeStore}
                                onChange={(e) =>
                                  handleHomeStoreChange(
                                    row.id,
                                    e.target.value as StoreName,
                                  )
                                }
                                className="w-full min-w-[7rem] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                              >
                                {storeSettingOptions.map((store) => (
                                  <option key={store} value={store}>
                                    {store}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={row.accessLevel}
                              disabled={isSystemAdmin}
                              onChange={(e) =>
                                handleAccessChange(
                                  row.id,
                                  e.target.value as StaffAccessLevel,
                                )
                              }
                              className="w-full min-w-[7rem] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                            >
                              {ACCESS_LEVEL_OPTIONS.filter(
                                (opt) =>
                                  opt.value !== "admin" || isSystemAdmin,
                              ).map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="max-w-[220px] px-4 py-3 text-xs text-slate-600">
                            {ACCESS_LEVEL_DESCRIPTIONS[row.accessLevel]}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {BUILTIN_STAFF_RECORDS.some((b) => b.id === row.id) ||
                            row.id === ADMIN_STAFF_RECORD.id
                              ? "内置"
                              : "已添加"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex min-w-[240px] flex-wrap items-center gap-2">
                              <input
                                type="password"
                                placeholder="新密码"
                                value={resetPasswords[row.id] ?? ""}
                                onChange={(e) =>
                                  setResetPasswords((prev) => ({
                                    ...prev,
                                    [row.id]: e.target.value,
                                  }))
                                }
                                className="min-w-[100px] flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                className="shrink-0 px-2 py-1 text-xs"
                                onClick={() => handleResetCustom(row.id)}
                              >
                                应用
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                className="shrink-0 px-2 py-1 text-xs"
                                onClick={() => handleResetToDefault(row.id)}
                              >
                                默认
                              </Button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {isSystemAdmin ? (
                              <span className="text-xs text-slate-400">—</span>
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => handleDeleteStaff(row.id)}
                              >
                                删除
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredStaff.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-500">
                  未找到匹配的人员
                </p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
