"use client";

import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SpaceMultiSelect } from "@/components/ui/space-multi-select";
import { useAuth } from "@/context/auth-context";
import { useOrders } from "@/context/orders-context";
import {
  countDesignerInProgress,
  formatDesignerLoadHint,
  isDispatchBlocked,
} from "@/lib/designer-load";
import {
  findDuplicateAddressOrder,
  formatDuplicateAddressMessage,
} from "@/lib/address-unique";
import {
  canChooseEntryOnlyMode,
  canForceDuplicateAddress,
  canOverrideDispatchLimit,
  isPersonalDispatcherLookup,
} from "@/lib/permissions";
import {
  canPersonalDispatcherAssignDesigner,
  crossStoreAssignBlockedMessage,
  filterDesignerRosterForPersonalDispatcher,
} from "@/lib/cross-store-dispatch";
import { CrossStoreAssignHint } from "@/components/shared/cross-store-assign-hint";
import { getDispatchStoreOptions } from "@/lib/stores";
import {
  getEffectiveDesignerHomeStore,
  getEffectiveDesignerRoster,
  getEffectiveDesignersInStores,
  type DesignerHomeStoreIndex,
} from "@/lib/designer-staff-store";
import {
  getDefaultDispatcherForStore,
  getDispatcherHomeStore,
  getEffectiveDispatcherRoster,
} from "@/lib/dispatchers";
import type { StaffRecord } from "@/lib/staff-roster";
import {
  sortByHomeStore,
  sortStoresByPreferred,
} from "@/lib/designers";
import type {
  DesignerName,
  DispatchFormData,
  DispatchMode,
  StoreName,
} from "@/lib/types";

const UNASSIGNED = "";

function addressContainsDigit(address: string): boolean {
  return /\d/.test(address);
}

type DispatchFormTab = "new_dispatch" | "new_customer";

interface DispatchFormProps {
  onSubmit: (data: DispatchFormData) => void;
  lockedDispatcherName?: string | null;
  lockedDesignerName?: string | null;
  /** 深链预填指派设计师（超额派单协调） */
  initialDesignerName?: string | null;
  preferredStore?: StoreName | null;
  readOnly?: boolean;
  /** 填满工作台右侧高度（与左侧导航栏对齐） */
  fillHeight?: boolean;
}

function FormSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`space-y-3 ${className}`}>
      <h3 className="vi-label-caps">{title}</h3>
      {children}
    </section>
  );
}

function resolveInitialStore(
  lockedDispatcher: string | null,
  lockedDesigner: string | null,
  preferredStore: StoreName | null,
  designerStoreIndex: DesignerHomeStoreIndex,
  staffRecords: StaffRecord[],
): StoreName {
  if (lockedDispatcher) {
    return getDispatcherHomeStore(
      lockedDispatcher,
      preferredStore ?? "东岸天冠",
      staffRecords,
    );
  }
  if (lockedDesigner) {
    return getEffectiveDesignerHomeStore(lockedDesigner, designerStoreIndex);
  }
  return preferredStore ?? "东岸天冠";
}

function buildInitial(
  lockedDispatcher: string | null,
  lockedDesigner: string | null,
  preferredStore: StoreName | null,
  designerStoreIndex: DesignerHomeStoreIndex,
  staffRecords: StaffRecord[],
  dispatchMode: DispatchMode = "direct_dispatch",
): DispatchFormData {
  const dispatchStore = resolveInitialStore(
    lockedDispatcher,
    lockedDesigner,
    preferredStore,
    designerStoreIndex,
    staffRecords,
  );
  const dispatcher =
    lockedDispatcher ?? getDefaultDispatcherForStore(dispatchStore, staffRecords);
  const designerRoster = getEffectiveDesignersInStores(
    [dispatchStore],
    designerStoreIndex,
    staffRecords,
  );
  const defaultDesigner = (designerRoster[0]?.name ??
    getEffectiveDesignerRoster(designerStoreIndex, staffRecords)[0]?.name ??
    null) as DesignerName | null;

  return {
    customerName: "",
    phone: "",
    address: "",
    spaces: ["全屋"],
    budget: 0,
    dispatchStore,
    deposit: 0,
    dispatcherName: dispatcher,
    designer:
      dispatchMode === "entry_only"
        ? null
        : ((lockedDesigner as DesignerName | null) ?? defaultDesigner),
    dispatchMode,
    dispatchRemark: "",
  };
}

export function DispatchForm({
  onSubmit,
  lockedDispatcherName = null,
  lockedDesignerName = null,
  initialDesignerName = null,
  preferredStore = null,
  readOnly = false,
  fillHeight = false,
}: DispatchFormProps) {
  const { designerHomeStoreIndex, staffRecords, user } = useAuth();
  const { orders } = useOrders();
  const entryOnlyAllowed = canChooseEntryOnlyMode(user);
  const showCustomerTab = entryOnlyAllowed && !lockedDesignerName;
  const [activeTab, setActiveTab] = useState<DispatchFormTab>("new_dispatch");
  const effectiveTab = showCustomerTab ? activeTab : "new_dispatch";
  const isDirectMode = effectiveTab === "new_dispatch";

  const resetFormForTab = (tab: DispatchFormTab) => {
    const mode: DispatchMode =
      tab === "new_customer" ? "entry_only" : "direct_dispatch";
    setForm(
      buildInitial(
        lockedDispatcherName,
        lockedDesignerName,
        preferredStore,
        designerHomeStoreIndex,
        staffRecords,
        mode,
      ),
    );
    setBudgetInput("");
    setForceOverCapacity(false);
    setForceDuplicateAddress(false);
    setDispatchError("");
  };

  const [form, setForm] = useState<DispatchFormData>(() =>
    buildInitial(
      lockedDispatcherName,
      lockedDesignerName,
      preferredStore,
      designerHomeStoreIndex,
      staffRecords,
      "direct_dispatch",
    ),
  );
  const [submitted, setSubmitted] = useState(false);
  const [lastSubmitWasDispatch, setLastSubmitWasDispatch] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [forceOverCapacity, setForceOverCapacity] = useState(false);
  const [forceDuplicateAddress, setForceDuplicateAddress] = useState(false);
  const [dispatchError, setDispatchError] = useState("");

  useEffect(() => {
    if (!initialDesignerName || lockedDesignerName) return;
    setActiveTab("new_dispatch");
    setForm((prev) => ({
      ...prev,
      designer: initialDesignerName as DesignerName,
      dispatchMode: "direct_dispatch",
    }));
    setForceOverCapacity(true);
  }, [initialDesignerName, lockedDesignerName]);

  const dispatcherValue = lockedDispatcherName ?? form.dispatcherName;
  const designerValue = lockedDesignerName ?? form.designer;
  /** 新建客户页选了设计师时，按派单处理 */
  const willDispatch = isDirectMode || Boolean(form.designer);

  const sortedDispatchers = useMemo(
    () => sortByHomeStore(getEffectiveDispatcherRoster(staffRecords), preferredStore),
    [staffRecords, preferredStore],
  );
  const personalDispatcher = isPersonalDispatcherLookup(user);

  const sortedDesigners = useMemo(
    () => {
      const roster = sortByHomeStore(
        getEffectiveDesignerRoster(designerHomeStoreIndex, staffRecords),
        preferredStore,
      );
      return filterDesignerRosterForPersonalDispatcher(
        user,
        form.dispatchStore,
        roster,
      );
    },
    [designerHomeStoreIndex, staffRecords, preferredStore, user, form.dispatchStore],
  );
  const sortedStores = useMemo(
    () => sortStoresByPreferred(getDispatchStoreOptions(), preferredStore),
    [preferredStore],
  );

  const salesOptions = useMemo(
    () =>
      sortedDispatchers.map((d) => ({
        value: d.name,
        label: `${d.name}（${d.homeStore}）`,
      })),
    [sortedDispatchers],
  );

  const designerLoadHint = useMemo(() => {
    if (!designerValue) return "";
    return formatDesignerLoadHint(
      designerValue,
      countDesignerInProgress(orders, designerValue),
    );
  }, [orders, designerValue]);

  const inProgressCount = useMemo(
    () => (designerValue ? countDesignerInProgress(orders, designerValue) : 0),
    [orders, designerValue],
  );

  const dispatchBlocked = designerValue ? isDispatchBlocked(inProgressCount) : false;
  const canOverride = canOverrideDispatchLimit(user);
  const canForceDup = canForceDuplicateAddress(user);
  const duplicateOrder = useMemo(() => {
    const addr = form.address.trim();
    if (!addr) return undefined;
    return findDuplicateAddressOrder(orders, addr);
  }, [orders, form.address]);
  const duplicateBlocked = Boolean(duplicateOrder) && !(canForceDup && forceDuplicateAddress);
  const crossStoreBlocked =
    personalDispatcher &&
    willDispatch &&
    Boolean(designerValue) &&
    !canPersonalDispatcherAssignDesigner(
      user,
      form.dispatchStore,
      designerValue!,
      designerHomeStoreIndex,
    );
  const submitBlocked =
    (willDispatch && dispatchBlocked && !(canOverride && forceOverCapacity)) ||
    duplicateBlocked ||
    crossStoreBlocked;

  const designerOptions = useMemo(() => {
    const roster = sortedDesigners.map((d) => ({
      value: d.name,
      label: `${d.name}（${d.homeStore}）`,
    }));
    if (entryOnlyAllowed && !lockedDesignerName && !isDirectMode) {
      return [{ value: UNASSIGNED, label: "不指派（待派单）" }, ...roster];
    }
    return roster;
  }, [sortedDesigners, entryOnlyAllowed, lockedDesignerName, isDirectMode]);

  useEffect(() => {
    resetFormForTab(effectiveTab);
  }, [
    lockedDispatcherName,
    lockedDesignerName,
    preferredStore,
    designerHomeStoreIndex,
    staffRecords,
  ]);

  function switchTab(tab: DispatchFormTab) {
    if (tab === activeTab) return;
    setActiveTab(tab);
    resetFormForTab(tab);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (readOnly) return;

    const address = form.address.trim();
    if (!address) {
      setDispatchError("请填写小区地址");
      return;
    }
    if (!addressContainsDigit(address)) {
      setDispatchError("地址须包含楼栋、门牌等数字信息");
      return;
    }

    const customerName = form.customerName.trim();
    if (!customerName) {
      setDispatchError("请填写客户姓名");
      return;
    }

    const phone = form.phone.trim();
    if (!phone) {
      setDispatchError("请填写联系电话");
      return;
    }

    const budget = Number(budgetInput);
    if (!Number.isFinite(budget) || budget <= 0) {
      setDispatchError("请填写有效预算金额");
      return;
    }

    let designer: DesignerName | null;

    if (willDispatch) {
      designer = (lockedDesignerName ?? form.designer) as DesignerName | null;
      if (!designer) {
        setDispatchError("直接派单须选择设计师");
        return;
      }
      if (
        !canPersonalDispatcherAssignDesigner(
          user,
          form.dispatchStore,
          designer,
          designerHomeStoreIndex,
        )
      ) {
        setDispatchError(
          crossStoreAssignBlockedMessage(designer, designerHomeStoreIndex),
        );
        return;
      }
      if (submitBlocked) {
        if (duplicateOrder && !forceDuplicateAddress) {
          setDispatchError(
            `${formatDuplicateAddressMessage(duplicateOrder)}${canForceDup ? " 可勾选经理确认后继续。" : ""}`,
          );
        } else {
          setDispatchError(
            `设计师在途已达 ${inProgressCount} 单，无法继续派单。${canOverride ? "请勾选经理确认超额派单。" : "请联系设计经理协调。"}`,
          );
        }
        return;
      }
    } else {
      designer = null;
      if (duplicateOrder && !forceDuplicateAddress) {
        setDispatchError(
          `${formatDuplicateAddressMessage(duplicateOrder)}${canForceDup ? " 可勾选经理确认后继续。" : ""}`,
        );
        return;
      }
    }

    onSubmit({
      ...form,
      customerName,
      phone,
      address,
      budget,
      deposit: Number.isFinite(form.deposit) ? Math.max(0, form.deposit) : 0,
      spaces: form.spaces.length > 0 ? form.spaces : ["全屋"],
      dispatcherName: dispatcherValue,
      designer,
      dispatchMode: willDispatch ? "direct_dispatch" : "entry_only",
      forceOverCapacity: willDispatch && canOverride && forceOverCapacity,
      forceDuplicateAddress: canForceDup && forceDuplicateAddress,
    });
    setForceOverCapacity(false);
    setForceDuplicateAddress(false);
    setDispatchError("");
    setLastSubmitWasDispatch(willDispatch);
    resetFormForTab(effectiveTab);
    setSubmitted(true);
    window.setTimeout(() => setSubmitted(false), 3000);
  }

  function update<K extends keyof DispatchFormData>(
    key: K,
    value: DispatchFormData[K],
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "dispatcherName" && typeof value === "string") {
        next.dispatchStore = getDispatcherHomeStore(
          value,
          prev.dispatchStore,
          staffRecords,
        );
      }
      if (key === "dispatchStore" && typeof value === "string") {
        const store = value as StoreName;
        if (!lockedDispatcherName) {
          next.dispatcherName = getDefaultDispatcherForStore(store, staffRecords);
        }
        if (!lockedDesignerName && isDirectMode) {
          next.designer = (getEffectiveDesignersInStores(
            [store],
            designerHomeStoreIndex,
            staffRecords,
          )[0]?.name ??
            getEffectiveDesignerRoster(designerHomeStoreIndex, staffRecords)[0]
              ?.name ??
            null) as DesignerName | null;
        }
      }
      if (key === "designer") {
        next.designer =
          value === UNASSIGNED || value === "" ? null : (value as DesignerName);
      }
      return next;
    });
  }

  if (readOnly) {
    return (
      <div
        className={`rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500 ${
          fillHeight ? "flex min-h-0 flex-1 items-center justify-center" : ""
        }`}
      >
        当前账号无新建派单/客户权限
      </div>
    );
  }

  const alerts = (
    <>
      {personalDispatcher ? <CrossStoreAssignHint /> : null}
      {designerLoadHint ? (
        <div
          className={`rounded-lg border px-3 py-2 text-xs ${
            dispatchBlocked
              ? "border-rose-200 bg-rose-50 text-rose-900"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {designerLoadHint}
        </div>
      ) : null}
      {duplicateOrder ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {formatDuplicateAddressMessage(duplicateOrder)}
        </div>
      ) : null}
      {duplicateOrder && canForceDup ? (
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={forceDuplicateAddress}
            onChange={(e) => setForceDuplicateAddress(e.target.checked)}
            className="mt-0.5"
          />
          <span>经理/店长确认：已知地址重复，仍要录入</span>
        </label>
      ) : null}
      {dispatchBlocked && canOverride && willDispatch ? (
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={forceOverCapacity}
            onChange={(e) => setForceOverCapacity(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            设计经理确认：已知在途超限，仍要派给「{designerValue}」
          </span>
        </label>
      ) : null}
      {effectiveTab === "new_customer" && willDispatch ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-950">
          已选择设计师「{designerValue}」，提交将按
          <span className="font-semibold">确认派单</span>
          处理。若只想录入客户、暂不指派，请清空设计师。
        </div>
      ) : null}
      {dispatchBlocked && !canOverride && willDispatch ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
          在途已满，无法继续派单。请联系设计经理在「项目进程管理」协调，或由其勾选超额确认后再派。
        </div>
      ) : null}
    </>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col overflow-hidden vi-workbench-card shadow-[var(--vi-shadow-sm)] ${
        fillHeight ? "min-h-0 flex-1 max-lg:flex-none" : ""
      }`}
    >
      <div className="shrink-0 border-b border-[var(--vi-border)] bg-gradient-to-r from-zinc-50/90 to-blue-50/30 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="vi-segmented">
              <button
                type="button"
                onClick={() => switchTab("new_dispatch")}
                className={`vi-segmented-item px-4 py-2 text-sm ${
                  effectiveTab === "new_dispatch" ? "vi-segmented-item-active" : ""
                }`}
              >
                新建派单
              </button>
              {showCustomerTab ? (
                <button
                  type="button"
                  onClick={() => switchTab("new_customer")}
                  className={`vi-segmented-item px-4 py-2 text-sm ${
                    effectiveTab === "new_customer" ? "vi-segmented-item-active" : ""
                  }`}
                >
                  新建客户
                </button>
              ) : null}
            </div>
            <span className="text-xs text-slate-500">增补单由设计师添加</span>
          </div>
          <p className="text-xs text-slate-500">
            {isDirectMode
              ? "录入客户信息并直接指派设计师"
              : "仅录入客户信息，待后续指派设计师"}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 max-lg:flex-none max-lg:overflow-visible">
        <div className="space-y-5">
          <FormSection title="客户信息">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Input
                label="客户姓名"
                name="customerName"
                required
                placeholder="联系人姓名"
                value={form.customerName}
                onChange={(e) => update("customerName", e.target.value)}
              />
              <Input
                label="联系电话"
                name="phone"
                required
                type="tel"
                placeholder="11 位手机号"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
              <Input
                label="定金（元）"
                name="deposit"
                type="number"
                min={0}
                step={1}
                placeholder="0 表示未交定金"
                value={form.deposit === 0 ? "" : String(form.deposit)}
                onChange={(e) =>
                  update(
                    "deposit",
                    e.target.value === "" ? 0 : Number(e.target.value),
                  )
                }
              />
              <div className="sm:col-span-2 xl:col-span-3">
                <Input
                  label="小区地址"
                  name="address"
                  required
                  placeholder="小区名 + 楼栋门牌（须含数字，作为订单名称）"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="派单信息">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Select
                label="派单人（销售名单）"
                name="dispatcherName"
                required
                disabled={Boolean(lockedDispatcherName)}
                value={dispatcherValue}
                options={salesOptions}
                onChange={(e) => update("dispatcherName", e.target.value)}
              />
              <Select
                label="派单门店"
                name="dispatchStore"
                value={form.dispatchStore}
                options={sortedStores}
                onChange={(e) =>
                  update("dispatchStore", e.target.value as StoreName)
                }
              />
              <Input
                label="预算（元）"
                name="budget"
                type="number"
                min={1}
                step={1}
                required
                placeholder="请输入具体预算金额"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
              />
              <div className="sm:col-span-2 xl:col-span-3">
                <SpaceMultiSelect
                  value={form.spaces}
                  onChange={(spaces) => update("spaces", spaces)}
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="指派设计师">
            {lockedDesignerName ? (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-3.5 py-2.5">
                <p className="text-sm font-medium text-slate-700">指派设计师</p>
                <p className="mt-1 text-sm font-semibold text-emerald-800">
                  {lockedDesignerName}（固定为自己，不可更改）
                </p>
              </div>
            ) : isDirectMode ? (
              <Select
                label="指派设计师"
                name="designer"
                required
                value={form.designer ?? UNASSIGNED}
                options={designerOptions.filter((o) => o.value !== UNASSIGNED)}
                onChange={(e) =>
                  update("designer", e.target.value as DesignerName)
                }
              />
            ) : (
              <Select
                label="指派设计师（可选）"
                name="designer"
                value={form.designer ?? UNASSIGNED}
                options={designerOptions}
                onChange={(e) =>
                  update("designer", e.target.value as DesignerName)
                }
              />
            )}
          </FormSection>

          <div className="space-y-3">
            <Textarea
              label="录单备注"
              name="dispatchRemark"
              placeholder="录入客户需求等（将按「派单录入」阶段记入备注）"
              value={form.dispatchRemark ?? ""}
              onChange={(e) => update("dispatchRemark", e.target.value)}
            />
          </div>

          {(personalDispatcher ||
            designerLoadHint ||
            duplicateOrder ||
            (dispatchBlocked && canOverride && willDispatch)) && (
            <div className="space-y-2">{alerts}</div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-[var(--vi-border)] bg-zinc-50/50 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={submitBlocked}>
            {willDispatch ? "确认派单" : "保存客户"}
          </Button>
          {dispatchError ? (
            <span className="text-sm text-rose-600">{dispatchError}</span>
          ) : null}
          {submitted ? (
            <span className="text-sm text-emerald-600">
              {lastSubmitWasDispatch
                ? "派单成功，已加入列表"
                : "客户已保存，待指派设计师"}
            </span>
          ) : null}
        </div>
      </div>
    </form>
  );
}
