/** 发起签约默认交货日期：今天 + N 天 */
export function defaultDeliveryDate(daysFromNow = 45): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

export const DEFAULT_CONTRACT_TERMS_PLACEHOLDER =
  "备注特殊情况按合同";
