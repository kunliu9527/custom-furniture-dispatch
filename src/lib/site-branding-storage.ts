import { companyQualifiedKey } from "./active-company";
import {
  DEFAULT_SITE_BRANDING,
  normalizeSiteBranding,
  type SiteBranding,
} from "./site-branding";

export const SITE_BRANDING_STORAGE_KEY =
  "custom-furniture-dispatch-site-branding-v1";

export function loadSiteBranding(): SiteBranding {
  if (typeof window === "undefined") return { ...DEFAULT_SITE_BRANDING };
  try {
    const raw = localStorage.getItem(companyQualifiedKey(SITE_BRANDING_STORAGE_KEY));
    if (!raw) return { ...DEFAULT_SITE_BRANDING };
    return normalizeSiteBranding(JSON.parse(raw) as Partial<SiteBranding>);
  } catch {
    return { ...DEFAULT_SITE_BRANDING };
  }
}

export function saveSiteBranding(branding: SiteBranding): void {
  localStorage.setItem(
    companyQualifiedKey(SITE_BRANDING_STORAGE_KEY),
    JSON.stringify(normalizeSiteBranding(branding)),
  );
}
