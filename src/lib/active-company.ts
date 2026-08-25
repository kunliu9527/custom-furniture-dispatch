import { DEFAULT_COMPANY_ID, isDefaultCompany } from "./company";

/**
 * 当前生效的公司（浏览器端单例）。
 * - 登录/会话恢复/管理员切换公司时通过 setActiveCompanyId 更新；
 * - 本地镜像 key、内置门店列表等纯函数据此取当前公司。
 */
let activeCompanyId: string = DEFAULT_COMPANY_ID;

export function getActiveCompanyId(): string {
  return activeCompanyId;
}

export function setActiveCompanyId(companyId: string): void {
  activeCompanyId = companyId;
}

/** 本地镜像 key：默认公司保持原 key，其它公司加 `:<companyId>` 后缀，避免公司间串数据 */
export function companyQualifiedKey(baseKey: string): string {
  if (isDefaultCompany(activeCompanyId)) return baseKey;
  return `${baseKey}:${activeCompanyId}`;
}
