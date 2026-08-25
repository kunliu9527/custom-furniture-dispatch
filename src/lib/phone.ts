/** 中国大陆手机号码格式：1 开头、第二位 3-9、共 11 位 */
export const CN_MOBILE_RE = /^1[3-9]\d{9}$/;

export function isValidCnMobile(phone: string): boolean {
  return CN_MOBILE_RE.test(phone.trim());
}

export function normalizeCnMobile(phone: string): string {
  return phone.trim();
}
