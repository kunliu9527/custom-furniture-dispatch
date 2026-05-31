/** PDF/初始导入预制单：ord-0001 … ord-0270 */
export const SEED_ORDER_ID_PATTERN = /^ord-\d{4}$/;

export function isSeedOrderId(id: string): boolean {
  return SEED_ORDER_ID_PATTERN.test(id);
}
