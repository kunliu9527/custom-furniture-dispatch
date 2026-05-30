import {
  buildEffectivePersonnelRosterByPosition,
  type PersonnelRosterEntry,
} from "./personnel-roster";
import type { StaffRecord } from "./staff-roster";
import type { StoreName } from "./types";

export function getEffectiveInstallerRoster(
  staffRecords: StaffRecord[] = [],
): PersonnelRosterEntry[] {
  return buildEffectivePersonnelRosterByPosition(staffRecords, "安装师");
}

export function getInstallersInStore(
  store: StoreName,
  staffRecords: StaffRecord[] = [],
): PersonnelRosterEntry[] {
  return getEffectiveInstallerRoster(staffRecords).filter(
    (i) => i.homeStore === store,
  );
}
