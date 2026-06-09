import { resolveDefaultAccessLevelForPosition } from "./staff-positions";
import type { StaffPosition } from "./staff-types";

/** 人员权限级别（管理员可在人员管理中调整） */
export type StaffAccessLevel =
  | "personal"
  | "store_manager"
  | "design_manager"
  | "general_manager"
  | "acceptance_manager"
  | "admin";

export const ACCESS_LEVEL_OPTIONS: {
  value: StaffAccessLevel;
  label: string;
}[] = [
  { value: "personal", label: "本人" },
  { value: "store_manager", label: "店长" },
  { value: "design_manager", label: "设计经理" },
  { value: "acceptance_manager", label: "验收经理" },
  { value: "general_manager", label: "总经理" },
  { value: "admin", label: "管理员" },
];

export const ACCESS_LEVEL_LABELS: Record<StaffAccessLevel, string> = {
  personal: "本人",
  store_manager: "店长",
  design_manager: "设计经理",
  general_manager: "总经理",
  acceptance_manager: "验收经理",
  admin: "管理员",
};

export const ACCESS_LEVEL_DESCRIPTIONS: Record<StaffAccessLevel, string> = {
  personal:
    "派单人：项目进程管理仅本人单查询，设计师为同店+本人订单关联；设计师：本人订单可操作（含线下签约）；均无门店汇总。安装师：仅交付本人单",
  store_manager:
    "店长看板本店；项目进程管理只读 + 验收与交付本店；新客户开发与设计师工作台",
  design_manager:
    "总部：全站；具体门店：所属门店数据 + 验收与交付含本人关联订单门店；可修改所属范围订单",
  general_manager:
    "同设计经理：全站或所属门店；项目进程管理可编辑 + 验收与交付全范围（总部）或门店范围",
  acceptance_manager: "仅验收与交付全门店可操作；其他板块不可见",
  admin: "全站查看与修改；人员管理与权限设置；删除订单",
};

export function defaultAccessLevelForPosition(
  position: StaffPosition,
): StaffAccessLevel {
  return resolveDefaultAccessLevelForPosition(position);
}

export function permissionsTextForAccessLevel(
  level: StaffAccessLevel,
): string {
  return ACCESS_LEVEL_DESCRIPTIONS[level];
}

/** 添加人员时可选权限（不含系统管理员） */
export const ADD_STAFF_ACCESS_OPTIONS = ACCESS_LEVEL_OPTIONS.filter(
  (o) => o.value !== "admin",
);

/** 名册行权限下拉：仅系统 admin 行可显示「管理员」 */
export function accessLevelOptionsForStaffRow(
  isSystemAdmin: boolean,
): typeof ACCESS_LEVEL_OPTIONS {
  return ACCESS_LEVEL_OPTIONS.filter(
    (opt) => opt.value !== "admin" || isSystemAdmin,
  );
}

export function isExecutiveAccessLevel(
  level: StaffAccessLevel | undefined,
): boolean {
  return (
    level === "admin" ||
    level === "design_manager" ||
    level === "general_manager"
  );
}
