"use client";

import { useEffect } from "react";
import type { DesignerName, StoreName } from "@/lib/types";
import {
  getEffectiveDesignerRoster,
  getEffectiveDesignersInStores,
} from "@/lib/designer-staff-store";
import { useAuth } from "@/context/auth-context";

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
  const roster = stores?.length
    ? getEffectiveDesignersInStores(stores, designerHomeStoreIndex, staffRecords)
    : getEffectiveDesignerRoster(designerHomeStoreIndex, staffRecords);

  // 受控 value 不在 option 里时，浏览器会「假显示」第一项，筛选却对不上
  useEffect(() => {
    if (roster.length === 0) return;
    if (roster.some((d) => d.name === value)) return;
    onChange(roster[0].name as DesignerName);
  }, [roster, value, onChange]);

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
