"use client";

import { useEffect, useMemo, useRef } from "react";
import type { DesignerName, StoreName } from "@/lib/types";
import {
  getEffectiveDesignerRoster,
  getEffectiveDesignersInStores,
} from "@/lib/designer-staff-store";
import { useAuth } from "@/context/auth-context";
import { useContentKey } from "@/lib/use-content-key";

interface DesignerSwitcherProps {
  value: DesignerName;
  onChange: (designer: DesignerName) => void;
  /** 门店层级：仅展示所属门店设计师 */
  stores?: StoreName[] | null;
}

export function DesignerSwitcher({
  value,
  onChange,
  stores = null,
}: DesignerSwitcherProps) {
  const { designerHomeStoreIndex, staffRecords } = useAuth();
  const roster = useMemo(
    () =>
      stores?.length
        ? getEffectiveDesignersInStores(
            stores,
            designerHomeStoreIndex,
            staffRecords,
          )
        : getEffectiveDesignerRoster(designerHomeStoreIndex, staffRecords),
    [stores, designerHomeStoreIndex, staffRecords],
  );

  // 名册内容签名：云端轮询会让 staffRecords 引用抖动，直接依赖 roster 会每次重跑
  const rosterNames = useMemo(() => roster.map((d) => d.name), [roster]);
  const selectionKey = `${useContentKey(rosterNames)}|${value}`;
  const appliedSelectionKeyRef = useRef(selectionKey);

  // 受控 value 不在 option 里时，浏览器会「假显示」第一项，筛选却对不上
  useEffect(() => {
    if (appliedSelectionKeyRef.current === selectionKey) return;
    appliedSelectionKeyRef.current = selectionKey;
    if (roster.length === 0) return;
    if (roster.some((d) => d.name === value)) return;
    onChange(roster[0].name as DesignerName);
  }, [selectionKey, roster, value, onChange]);

  const selectValue = roster.some((d) => d.name === value)
    ? value
    : (roster[0]?.name ?? value);

  return (
    <select
      value={selectValue}
      onChange={(e) => onChange(e.target.value as DesignerName)}
      className="vi-field mt-1 w-full py-1.5 text-sm"
      aria-label="切换设计师"
    >
      {roster.map((d) => (
        <option key={d.name} value={d.name}>
          {d.name}
        </option>
      ))}
    </select>
  );
}
