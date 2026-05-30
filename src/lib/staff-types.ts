export type UserRole = "admin" | "design_manager" | "dispatcher" | "designer";

export type StaffPosition =
  | "管理员"
  | "设计经理"
  | "总经理"
  | "派单人"
  | "设计师"
  | (string & {});

export const POSITION_TO_ROLE: Record<string, UserRole> = {
  管理员: "admin",
  设计经理: "design_manager",
  总经理: "design_manager",
  验收经理: "dispatcher",
  派单人: "dispatcher",
  设计师: "designer",
  安装师: "dispatcher",
};
