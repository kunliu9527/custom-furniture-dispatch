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



  return (

    <select

      value={value}

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


