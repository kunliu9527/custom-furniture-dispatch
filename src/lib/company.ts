/** 公司（租户）模型：每个公司拥有独立的数据快照（文件 / 存储键），数据按公司级别隔离 */

export interface CompanyInfo {
  id: string;
  name: string;
  createdAt: string;
  /** 注册者账号（姓名） */
  registrantName?: string;
  /** 注册者手机号（注册时必填，用于通知 admin 联系） */
  phone?: string;
}

/** 默认公司：万象天冠。沿用历史 data/snapshot.json 路径，现有数据零搬移归属该公司 */
export const DEFAULT_COMPANY_ID = "wanxiang-tianguan";
export const DEFAULT_COMPANY_NAME = "万象天冠";

export function isDefaultCompany(
  companyId: string | undefined | null,
): boolean {
  return !companyId || companyId === DEFAULT_COMPANY_ID;
}

/** 空/未知公司一律归一为默认公司 */
export function normalizeCompanyId(
  companyId: string | undefined | null,
): string {
  return isDefaultCompany(companyId) ? DEFAULT_COMPANY_ID : companyId!;
}

export function isValidCompanyId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{1,64}$/.test(id);
}

export function isValidCompanyName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 40;
}
