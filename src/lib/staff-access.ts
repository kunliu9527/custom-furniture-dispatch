import { resolveDefaultAccessLevelForPosition } from "./staff-positions";
import type { StaffPosition } from "./staff-roster";

/** 人员权限级别（管理员可在人员管理中调整） */
export type StaffAccessLevel =
  | "personal"
  | "store_manager"
  | "design_manager"
  | "admin";

export const ACCESS_LEVEL_OPTIONS: {
  value: StaffAccessLevel;
  label: string;
}[] = [
  { value: "personal", label: "本人" },
  { value: "store_manager", label: "店长" },
  { value: "design_manager", label: "设计经理" },
  { value: "admin", label: "管理员" },
];

export const ACCESS_LEVEL_LABELS: Record<StaffAccessLevel, string> = {
  personal: "本人",
  store_manager: "店长",
  design_manager: "设计经理",
  admin: "管理员",
};

export const ACCESS_LEVEL_DESCRIPTIONS: Record<StaffAccessLevel, string> = {
  personal: "仅本人派单/订单；按派单人查找不显示「全部」",
  store_manager:
    "店长看板仅本店派单人/设计师；可按设计师查找；经理看板只读",
  design_manager:
    "门店选「总部」：全店查找与修改（同管理员）；选具体门店：可设最多 3 个门店，数据范围与汇总均限于所属门店",
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
