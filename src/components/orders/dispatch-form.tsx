"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SpaceMultiSelect } from "@/components/ui/space-multi-select";
import { useAuth } from "@/context/auth-context";
import { DESIGNER_ROSTER } from "@/lib/constants";
import { getDispatchStoreOptions } from "@/lib/stores";
import {
  getEffectiveDesignerHomeStore,
  getEffectiveDesignerRoster,
  getEffectiveDesignersInStores,
  type DesignerHomeStoreIndex,
} from "@/lib/designer-staff-store";
import {
  DISPATCHER_ROSTER,
  getDefaultDispatcherForStore,
  getDispatcherHomeStore,
} from "@/lib/dispatchers";
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
): StoreName {
  if (lockedDispatcher) {
    return getDispatcherHomeStore(lockedDispatcher, preferredStore ?? "东岸天冠");
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
): DispatchFormData {
  const dispatchStore = resolveInitialStore(
    lockedDispatcher,
    lockedDesigner,
    preferredStore,
    designerStoreIndex,
  );
  const dispatcher =
    lockedDispatcher ?? getDefaultDispatcherForStore(dispatchStore);
  const designer = (lockedDesigner ??
    getEffectiveDesignersInStores([dispatchStore], designerStoreIndex)[0]?.name ??
    DESIGNER_ROSTER[0].name) as DesignerName;

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
  const { designerHomeStoreIndex } = useAuth();
  const [form, setForm] = useState<DispatchFormData>(() =>
    buildInitial(
      lockedDispatcherName,
      lockedDesignerName,
      preferredStore,
      designerHomeStoreIndex,
    ),
  );
  const [submitted, setSubmitted] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");

  const dispatcherValue = lockedDispatcherName ?? form.dispatcherName;
  const designerValue = (lockedDesignerName ?? form.designer) as DesignerName;

  const sortedDispatchers = useMemo(
    () => sortByHomeStore(DISPATCHER_ROSTER, preferredStore),
    [preferredStore],
  );
  const sortedDesigners = useMemo(
    () => sortByHomeStore(getEffectiveDesignerRoster(designerHomeStoreIndex), preferredStore),
    [designerHomeStoreIndex, preferredStore],
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
      ),
    );
  }, [lockedDispatcherName, lockedDesignerName, preferredStore]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    const budget = Number(budgetInput);
    if (!Number.isFinite(budget) || budget <= 0) return;

    onSubmit({
      ...form,
      budget,
      deposit: Number.isFinite(form.deposit) ? Math.max(0, form.deposit) : 0,
      spaces: form.spaces.length > 0 ? form.spaces : ["全屋"],
      dispatcherName: dispatcherValue,
      designer: designerValue,
      dispatchStore: form.dispatchStore,
    });
    setForm(
      buildInitial(
        lockedDispatcherName,
        lockedDesignerName,
        preferredStore,
        designerHomeStoreIndex,
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
        );
      }
      if (key === "dispatchStore" && typeof value === "string") {
        const store = value as StoreName;
        if (!lockedDispatcherName) {
          next.dispatcherName = getDefaultDispatcherForStore(store);
        }
        if (!lockedDesignerName) {
          next.designer = (getEffectiveDesignersInStores(
            [store],
            designerHomeStoreIndex,
          )[0]?.name ?? DESIGNER_ROSTER[0].name) as DesignerName;
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
          step={1000}
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
          step={100}
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
        <Button type="submit">确认派单</Button>
        {submitted ? (
          <span className="text-sm text-emerald-600">派单成功，已加入列表</span>
        ) : null}
      </div>
    </form>
  );
}
