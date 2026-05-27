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
  const { designerHomeStoreIndex } = useAuth();
  const roster = stores?.length
    ? getEffectiveDesignersInStores(stores, designerHomeStoreIndex)
    : getEffectiveDesignerRoster(designerHomeStoreIndex);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as DesignerName)}
      className="mt-2 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:w-auto sm:min-w-[200px]"
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