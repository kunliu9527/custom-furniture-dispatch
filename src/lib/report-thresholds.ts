/** 全局报告 · 待确认 / 需跟进 阈值（天） */
export const REPORT_THRESHOLDS = {
  /** F1 未派单滞留 */
  undispatchedStaleDays: 30,
  /** F4 已下单安装滞后 */
  installLagDays: 60,
  /** F5 已安装久未验收 */
  acceptanceLagDays: 15,
  /** F6 待退单久未处理 */
  refundStaleDays: 30,
} as const;
