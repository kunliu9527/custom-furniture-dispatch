"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
import { canOverrideDispatchLimit } from "@/lib/permissions";
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
import type { DesignerName, DispatchFormData, StoreName } from "@/lib/types";

interface DispatchFormProps {
  onSubmit: (data: DispatchFormData) => void;
  lockedDispatcherName?: string | null;
  lockedDesignerName?: string | null;
  preferredStore?: StoreName | null;
  readOnly?: boolean;
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
  const designer = (lockedDesigner ??
    designerRoster[0]?.name ??
    getEffectiveDesignerRoster(designerStoreIndex, staffRecords)[0]?.name ??
    "汤雷") as DesignerName;

  return {
    customerName: "",
    phone: "",
    address: "",
    spaces: ["全屋"],
    budget: 0,
    dispatchStore,
    deposit: 0,
    dispatcherName: dispatcher,
    designer,
    dispatchRemark: "",
  };
}

export function DispatchForm({
  onSubmit,
  lockedDispatcherName = null,
  lockedDesignerName = null,
  preferredStore = null,
  readOnly = false,
}: DispatchFormProps) {
  const { designerHomeStoreIndex, staffRecords, user } = useAuth();
  const { orders } = useOrders();
  const [form, setForm] = useState<DispatchFormData>(() =>
    buildInitial(
      lockedDispatcherName,
      lockedDesignerName,
      preferredStore,
      designerHomeStoreIndex,
      staffRecords,
    ),
  );
  const [submitted, setSubmitted] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [forceOverCapacity, setForceOverCapacity] = useState(false);
  const [dispatchError, setDispatchError] = useState("");

  const dispatcherValue = lockedDispatcherName ?? form.dispatcherName;
  const designerValue = (lockedDesignerName ?? form.designer) as DesignerName;

  const sortedDispatchers = useMemo(
    () => sortByHomeStore(getEffectiveDispatcherRoster(staffRecords), preferredStore),
    [staffRecords, preferredStore],
  );
  const sortedDesigners = useMemo(
    () =>
      sortByHomeStore(
        getEffectiveDesignerRoster(designerHomeStoreIndex, staffRecords),
        preferredStore,
      ),
    [designerHomeStoreIndex, staffRecords, preferredStore],
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

  const designerLoadHint = useMemo(
    () =>
      formatDesignerLoadHint(
        designerValue,
        countDesignerInProgress(orders, designerValue),
      ),
    [orders, designerValue],
  );

  const inProgressCount = useMemo(
    () => countDesignerInProgress(orders, designerValue),
    [orders, designerValue],
  );

  const dispatchBlocked = isDispatchBlocked(inProgressCount);
  const canOverride = canOverrideDispatchLimit(user);
  const submitBlocked = dispatchBlocked && !(canOverride && forceOverCapacity);

  const designerOptions = useMemo(
    () =>
      sortedDesigners.map((d) => ({
        value: d.name,
        label: `${d.name}（${d.homeStore}）`,
      })),
    [sortedDesigners],
  );

  useEffect(() => {
    setForm(
      buildInitial(
        lockedDispatcherName,
        lockedDesignerName,
        preferredStore,
        designerHomeStoreIndex,
        staffRecords,
      ),
    );
  }, [lockedDispatcherName, lockedDesignerName, preferredStore]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    const budget = Number(budgetInput);
    if (!Number.isFinite(budget) || budget <= 0) return;
    if (submitBlocked) {
      setDispatchError(
        `设计师在途已达 ${inProgressCount} 单，无法继续派单。${canOverride ? "请勾选经理确认超额派单。" : "请联系设计经理协调。"}`,
      );
      return;
    }

    onSubmit({
      ...form,
      budget,
      deposit: Number.isFinite(form.deposit) ? Math.max(0, form.deposit) : 0,
      spaces: form.spaces.length > 0 ? form.spaces : ["全屋"],
      dispatcherName: dispatcherValue,
      designer: designerValue,
      dispatchStore: form.dispatchStore,
      forceOverCapacity: canOverride && forceOverCapacity,
    });
    setForceOverCapacity(false);
    setDispatchError("");
    setForm(
      buildInitial(
        lockedDispatcherName,
        lockedDesignerName,
        preferredStore,
        designerHomeStoreIndex,
        staffRecords,
      ),
    );
    setBudgetInput("");
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
        if (!lockedDesignerName) {
          next.designer = (getEffectiveDesignersInStores(
            [store],
            designerHomeStoreIndex,
            staffRecords,
          )[0]?.name ??
            getEffectiveDesignerRoster(designerHomeStoreIndex, staffRecords)[0]
              ?.name ??
            "汤雷") as DesignerName;
        }
      }
      return next;
    });
  }

  if (readOnly) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
        当前账号无派单录入权限
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm"
    >
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-slate-900">新建派单</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="派单人（销售名单）"
          name="dispatcherName"
          required
          disabled={Boolean(lockedDispatcherName)}
          value={dispatcherValue}
          options={salesOptions}
          onChange={(e) => update("dispatcherName", e.target.value)}
        />
        <Input
          label="客户姓名"
          name="customerName"
          required
          placeholder="例如：王女士"
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
        <div className="sm:col-span-2">
          <Input
            label="小区地址"
            name="address"
            required
            placeholder="小区名 + 楼栋门牌"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
          />
        </div>
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
        <Input
          label="定金（元）"
          name="deposit"
          type="number"
          min={0}
          step={1}
          placeholder="0 表示未交定金"
          value={form.deposit === 0 ? "" : String(form.deposit)}
          onChange={(e) =>
            update("deposit", e.target.value === "" ? 0 : Number(e.target.value))
          }
        />
        <SpaceMultiSelect
          value={form.spaces}
          onChange={(spaces) => update("spaces", spaces)}
        />
        <div className="sm:col-span-2">
          <Textarea
            label="派单备注"
            name="dispatchRemark"
            placeholder="录入派单说明、客户需求等（将按「派单录入」阶段记入备注）"
            value={form.dispatchRemark ?? ""}
            onChange={(e) => update("dispatchRemark", e.target.value)}
          />
        </div>
        {designerLoadHint ? (
          <div
            className={`sm:col-span-2 rounded-lg border px-3 py-2 text-xs ${
              dispatchBlocked
                ? "border-rose-200 bg-rose-50 text-rose-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            {designerLoadHint}
          </div>
        ) : null}
        {dispatchBlocked && canOverride ? (
          <label className="sm:col-span-2 flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
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
        <div className="sm:col-span-2">
          {lockedDesignerName ? (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-3.5 py-2.5">
              <p className="text-sm font-medium text-slate-700">指派设计师</p>
              <p className="mt-1 text-sm font-semibold text-emerald-800">
                {lockedDesignerName}（固定为自己，不可更改）
              </p>
            </div>
          ) : (
            <Select
              label="指派设计师"
              name="designer"
              value={form.designer}
              options={designerOptions}
              onChange={(e) =>
                update("designer", e.target.value as DesignerName)
              }
            />
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={submitBlocked}>
          确认派单
        </Button>
        {dispatchError ? (
          <span className="text-sm text-rose-600">{dispatchError}</span>
        ) : null}
        {submitted ? (
          <span className="text-sm text-emerald-600">派单成功，已加入列表</span>
        ) : null}
      </div>
    </form>
  );
}
