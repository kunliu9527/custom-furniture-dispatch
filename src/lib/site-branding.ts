export interface SiteBranding {
  /** 首页顶部徽章文案，如「蓬蓬· 派单原型」 */
  badgeLabel: string;
  /** 首页主标题 / 顶栏名称，如「全屋定制超级定单系统」 */
  headlineTitle: string;
  /** 电子签约标准合同正文（管理员可改） */
  standardContractText: string;
}

export const DEFAULT_STANDARD_CONTRACT_TEXT =
  "以纸质合同为准，已签订纸质合同并确认设计方案";

export const DEFAULT_SITE_BRANDING: SiteBranding = {
  badgeLabel: "蓬蓬· 派单原型",
  headlineTitle: "全屋定制超级定单系统",
  standardContractText: DEFAULT_STANDARD_CONTRACT_TEXT,
};

export function normalizeSiteBranding(
  raw: Partial<SiteBranding> | undefined,
): SiteBranding {
  const badge =
    typeof raw?.badgeLabel === "string" ? raw.badgeLabel.trim() : "";
  const headline =
    typeof raw?.headlineTitle === "string" ? raw.headlineTitle.trim() : "";
  const contract =
    typeof raw?.standardContractText === "string"
      ? raw.standardContractText.trim()
      : "";
  return {
    badgeLabel: badge || DEFAULT_SITE_BRANDING.badgeLabel,
    headlineTitle: headline || DEFAULT_SITE_BRANDING.headlineTitle,
    standardContractText:
      contract || DEFAULT_SITE_BRANDING.standardContractText,
  };
}
