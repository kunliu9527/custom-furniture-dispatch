"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import { useOrders } from "@/context/orders-context";
import {
  countDesignerInProgress,
  formatDesignerLoadHint,
  isDispatchBlocked,
} from "@/lib/designer-load";
import { sortByHomeStore } from "@/lib/designers";
import { getEffectiveDesignerRoster } from "@/lib/designer-staff-store";
import {
  canPersonalDispatcherAssignDesigner,
  crossStoreAssignBlockedMessage,
  filterDesignerRosterForPersonalDispatcher,
} from "@/lib/cross-store-dispatch";
import { CrossStoreAssignHint } from "@/components/shared/cross-store-assign-hint";
import { canOverrideDispatchLimit, isPersonalDispatcherLookup } from "@/lib/permissions";
import type { DesignerName, Order } from "@/lib/types";

interface AssignDesignerPanelProps {
  order: Order;
  defaultDesigner?: DesignerName;
  onAssign: (
    orderId: string,
    designer: DesignerName,
    forceOverCapacity?: boolean,
  ) => void;
}

export function AssignDesignerPanel({
  order,
  defaultDesigner,
  onAssign,
}: AssignDesignerPanelProps) {
  const { designerHomeStoreIndex, staffRecords, user } = useAuth();
  const { orders } = useOrders();
  const [designer, setDesigner] = useState<DesignerName | "">(
    defaultDesigner ?? "",
  );
  const [forceOverCapacity, setForceOverCapacity] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!defaultDesigner) return;
    setDesigner(defaultDesigner);
    const blocked = isDispatchBlocked(
      countDesignerInProgress(orders, defaultDesigner),
    );
    if (blocked && canOverrideDispatchLimit(user)) {
      setForceOverCapacity(true);
    }
  }, [defaultDesigner, orders, user]);

  const personalDispatcher = isPersonalDispatcherLookup(user);

  const designerOptions = useMemo(
    () =>
      filterDesignerRosterForPersonalDispatcher(
        user,
        order.dispatchStore,
        sortByHomeStore(
          getEffectiveDesignerRoster(designerHomeStoreIndex, staffRecords),
          order.dispatchStore,
        ),
      ).map((d) => ({
        value: d.name,
        label: `${d.name}（${d.homeStore}）`,
      })),
    [designerHomeStoreIndex, staffRecords, order.dispatchStore, user],
  );

  const inProgressCount = designer
    ? countDesignerInProgress(orders, designer)
    : 0;
  const dispatchBlocked = designer ? isDispatchBlocked(inProgressCount) : false;
  const canOverride = canOverrideDispatchLimit(user);
  const crossStoreBlocked =
    personalDispatcher &&
    Boolean(designer) &&
    !canPersonalDispatcherAssignDesigner(
      user,
      order.dispatchStore,
      designer,
      designerHomeStoreIndex,
    );
  const submitBlocked =
    (dispatchBlocked && !(canOverride && forceOverCapacity)) || crossStoreBlocked;
  const loadHint = designer
    ? formatDesignerLoadHint(designer, inProgressCount)
    : "";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!designer) {
      setError("请选择设计师");
      return;
    }
    if (submitBlocked) {
      if (crossStoreBlocked && designer) {
        setError(crossStoreAssignBlockedMessage(designer, designerHomeStoreIndex));
        return;
      }
      setError(
        `设计师在途已达 ${inProgressCount} 单。${canOverride ? "请勾选经理确认超额派单。" : "请联系设计经理协调。"}`,
      );
      return;
    }
    setError("");
    onAssign(order.id, designer, canOverride && forceOverCapacity);
    setDesigner("");
    setForceOverCapacity(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/40 p-4"
    >
      <p className="text-sm font-medium text-indigo-900">指派设计师</p>
      <p className="mt-1 text-xs text-indigo-700/80">
        客户信息已录入，指派后将进入「待量尺」流程。
      </p>
      {personalDispatcher ? <CrossStoreAssignHint className="mt-3" /> : null}
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Select
          label="选择设计师"
          name="assignDesigner"
          required
          value={designer}
          options={[
            { value: "", label: "请选择…" },
            ...designerOptions,
          ]}
          onChange={(e) => setDesigner(e.target.value as DesignerName)}
        />
        <Button type="submit" disabled={submitBlocked || !designer}>
          确认指派
        </Button>
      </div>
      {loadHint ? (
        <p
          className={`mt-2 text-xs ${dispatchBlocked ? "text-rose-700" : "text-amber-800"}`}
        >
          {loadHint}
        </p>
      ) : null}
      {dispatchBlocked && canOverride ? (
        <label className="mt-2 flex cursor-pointer items-start gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={forceOverCapacity}
            onChange={(e) => setForceOverCapacity(e.target.checked)}
            className="mt-0.5"
          />
          <span>设计经理确认：已知在途超限，仍要派给「{designer}」</span>
        </label>
      ) : null}
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </form>
  );
}
