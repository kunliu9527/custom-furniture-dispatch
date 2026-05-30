import { DESIGNER_ROSTER } from "./designers";
import { DISPATCHER_ROSTER } from "./dispatchers";
import type { DesignerHomeStoreIndex } from "./designer-staff-store";
import type { StaffRecord } from "./staff-roster";
import type { StoreName } from "./types";

function designerHomeStore(
  name: string,
  index: DesignerHomeStoreIndex,
  rowFallback?: StoreName,
): StoreName {
  return (
    index.get(name) ??
    DESIGNER_ROSTER.find((d) => d.name === name)?.homeStore ??
    rowFallback ??
    "东岸天冠"
  );
}

export type PersonnelRosterEntry = { name: string; homeStore: StoreName };

export function isDesignerStaff(row: StaffRecord): boolean {
  return row.role === "designer" || row.position === "设计师";
}

export function isDispatcherStaff(row: StaffRecord): boolean {
  return row.role === "dispatcher" || row.position === "派单人";
}

export function isInstallerStaff(row: StaffRecord): boolean {
  return row.position === "安装师";
}

/** 设计师名册：内置顺序 + 人员管理中新增的设计师 */
export function buildEffectiveDesignerRoster(
  staffRecords: StaffRecord[],
  homeStoreIndex: DesignerHomeStoreIndex,
): PersonnelRosterEntry[] {
  const seen = new Set<string>();
  const result: PersonnelRosterEntry[] = [];

  for (const d of DESIGNER_ROSTER) {
    seen.add(d.name);
    result.push({
      name: d.name,
      homeStore: designerHomeStore(d.name, homeStoreIndex),
    });
  }

  for (const row of staffRecords) {
    if (!isDesignerStaff(row) || seen.has(row.name)) continue;
    seen.add(row.name);
    result.push({
      name: row.name,
      homeStore: designerHomeStore(row.name, homeStoreIndex, row.homeStore),
    });
  }

  return result;
}

export function buildDispatcherHomeStoreIndex(
  staffRecords: StaffRecord[],
): Map<string, StoreName> {
  const index = new Map<string, StoreName>();
  for (const d of DISPATCHER_ROSTER) {
    index.set(d.name, d.homeStore);
  }
  for (const row of staffRecords) {
    if (isDispatcherStaff(row)) {
      index.set(row.name, row.homeStore);
    }
  }
  return index;
}

/** 派单人名册：内置顺序 + 人员管理中新增的派单人 */
export function buildEffectiveDispatcherRoster(
  staffRecords: StaffRecord[],
): PersonnelRosterEntry[] {
  const index = buildDispatcherHomeStoreIndex(staffRecords);
  const seen = new Set<string>();
  const result: PersonnelRosterEntry[] = [];

  for (const d of DISPATCHER_ROSTER) {
    seen.add(d.name);
    result.push({
      name: d.name,
      homeStore: index.get(d.name) ?? d.homeStore,
    });
  }

  for (const row of staffRecords) {
    if (!isDispatcherStaff(row) || seen.has(row.name)) continue;
    seen.add(row.name);
    result.push({
      name: row.name,
      homeStore: index.get(row.name) ?? row.homeStore,
    });
  }

  return result;
}

export function filterRosterByStores(
  roster: PersonnelRosterEntry[],
  stores: StoreName[],
): PersonnelRosterEntry[] {
  if (!stores.length) return roster;
  const allowed = new Set(stores);
  return roster.filter((d) => allowed.has(d.homeStore));
}

/** 按岗位从人员名册构建列表（如安装师） */
export function buildEffectivePersonnelRosterByPosition(
  staffRecords: StaffRecord[],
  position: string,
): PersonnelRosterEntry[] {
  const seen = new Set<string>();
  const result: PersonnelRosterEntry[] = [];
  for (const row of staffRecords) {
    if (row.position !== position || seen.has(row.name)) continue;
    seen.add(row.name);
    result.push({ name: row.name, homeStore: row.homeStore });
  }
  return result;
}
