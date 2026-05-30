import {
  getEffectiveDesignerHomeStore,
  type DesignerHomeStoreIndex,
} from "./designer-staff-store";
import { isPersonalDispatcherLookup, type SessionUser } from "./permissions";
import type { StoreName } from "./types";

export const CROSS_STORE_ASSIGN_MANAGER_HINT =
  "跨店指派设计师需由设计经理操作；您仅能指派同店设计师，跨店请联系设计经理协调。";

export function isCrossStoreDesignerAssignment(
  dispatchStore: StoreName,
  designerName: string,
  designerHomeStoreIndex: DesignerHomeStoreIndex,
): boolean {
  return (
    getEffectiveDesignerHomeStore(designerName, designerHomeStoreIndex) !==
    dispatchStore
  );
}

/** 本人派单人是否可将订单派给该设计师（同店可派，跨店需经理） */
export function canPersonalDispatcherAssignDesigner(
  user: SessionUser | null,
  dispatchStore: StoreName,
  designerName: string,
  designerHomeStoreIndex: DesignerHomeStoreIndex,
): boolean {
  if (!isPersonalDispatcherLookup(user)) return true;
  return !isCrossStoreDesignerAssignment(
    dispatchStore,
    designerName,
    designerHomeStoreIndex,
  );
}

export function filterDesignerRosterForPersonalDispatcher(
  user: SessionUser | null,
  dispatchStore: StoreName,
  roster: readonly { name: string; homeStore: StoreName }[],
): readonly { name: string; homeStore: StoreName }[] {
  if (!isPersonalDispatcherLookup(user)) return roster;
  return roster.filter((d) => d.homeStore === dispatchStore);
}

export function crossStoreAssignBlockedMessage(
  designerName: string,
  designerHomeStoreIndex: DesignerHomeStoreIndex,
): string {
  const home = getEffectiveDesignerHomeStore(
    designerName,
    designerHomeStoreIndex,
  );
  return `「${designerName}」所属门店为 ${home}，跨店指派需设计经理操作。`;
}
