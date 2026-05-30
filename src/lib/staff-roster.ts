import { DESIGNER_ROSTER } from "./designers";
import { DISPATCHER_ROSTER } from "./dispatchers";
import {
  defaultAccessLevelForPosition,
  permissionsTextForAccessLevel,
  type StaffAccessLevel,
} from "./staff-access";
import type { StaffPosition, UserRole } from "./staff-types";
import { POSITION_TO_ROLE } from "./staff-types";
import type { StoreName } from "./types";

export type { StaffAccessLevel };
export type { StaffPosition, UserRole };
export { POSITION_TO_ROLE };

export interface StaffRecord {
  id: string;
  name: string;
  position: StaffPosition;
  homeStore: StoreName;
  /** 设计经理附加门店（第二、第三门店） */
  extraStores?: StoreName[];
  role: UserRole;
  password: string;
  /** 权限级别 */
  accessLevel: StaffAccessLevel;
  /** 权限说明（展示用） */
  permissions: string;
  /** 联系电话 */
  phone?: string;
}

export const POSITION_PERMISSIONS: Record<string, string> = {
  管理员: "全站查看与修改；人员管理；删除订单",
  设计经理: "全站查看与修改；经理看板售后金",
  总经理: "全站查看与修改；项目进程管理与验收与交付（同设计经理）",
  验收经理: "仅验收与交付板块；全公司已签约及之后订单",
  派单人: "店长看板派单（本人）；其他板块只读",
  设计师: "本人订单操作；其他订单只读",
};

const DEFAULT_PASSWORD = "1";

/** 系统内置人员（派单人 + 设计师，静态固定） */
export function buildBuiltinStaffRecords(): StaffRecord[] {
  const list: StaffRecord[] = [];

  for (const d of DISPATCHER_ROSTER) {
    const accessLevel = defaultAccessLevelForPosition("派单人");
    list.push({
      id: `builtin-disp-${d.name}`,
      name: d.name,
      position: "派单人",
      homeStore: d.homeStore,
      role: "dispatcher",
      password: DEFAULT_PASSWORD,
      accessLevel,
      permissions: permissionsTextForAccessLevel(accessLevel),
    });
  }

  for (const d of DESIGNER_ROSTER) {
    const accessLevel = defaultAccessLevelForPosition("设计师");
    list.push({
      id: `builtin-des-${d.name}`,
      name: d.name,
      position: "设计师",
      homeStore: d.homeStore,
      role: "designer",
      password: DEFAULT_PASSWORD,
      accessLevel,
      permissions: permissionsTextForAccessLevel(accessLevel),
    });
  }

  return list;
}

export const BUILTIN_STAFF_RECORDS: StaffRecord[] = buildBuiltinStaffRecords();

export const ADMIN_DEFAULT_PASSWORD = "003900";

export const ADMIN_STAFF_RECORD: StaffRecord = {
  id: "builtin-admin",
  name: "admin",
  position: "管理员",
  homeStore: "东岸天冠",
  role: "admin",
  password: ADMIN_DEFAULT_PASSWORD,
  accessLevel: "admin",
  permissions: permissionsTextForAccessLevel("admin"),
};

export function getDefaultPasswordForStaff(staff: StaffRecord): string {
  if (staff.id === ADMIN_STAFF_RECORD.id) return ADMIN_DEFAULT_PASSWORD;
  return DEFAULT_PASSWORD;
}
