export interface SiteBranding {
  /** 首页顶部徽章文案，如「蓬蓬· 派单原型」 */
  badgeLabel: string;
  /** 首页主标题 / 顶栏名称，如「设计师超级定单系统」 */
  headlineTitle: string;
}

export const DEFAULT_SITE_BRANDING: SiteBranding = {
  badgeLabel: "蓬蓬· 派单原型",
  headlineTitle: "设计师超级定单系统",
};

export function normalizeSiteBranding(
  raw: Partial<SiteBranding> | undefined,
): SiteBranding {
  const badge =
    typeof raw?.badgeLabel === "string" ? raw.badgeLabel.trim() : "";
  const headline =
    typeof raw?.headlineTitle === "string" ? raw.headlineTitle.trim() : "";
  return {
    badgeLabel: badge || DEFAULT_SITE_BRANDING.badgeLabel,
    headlineTitle: headline || DEFAULT_SITE_BRANDING.headlineTitle,
  };
}
