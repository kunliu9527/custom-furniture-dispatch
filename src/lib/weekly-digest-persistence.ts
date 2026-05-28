import type { SessionUser } from "./permissions";
import { canAccessEvaluationPage, canAccessManagerPage } from "./nav-access";

const PREFIX = "custom-furniture-dispatch-digest-read:";

export function getDigestReadWeekId(username: string | undefined): string | null {
  if (!username || typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(`${PREFIX}${username}`);
  } catch {
    return null;
  }
}

export function markDigestRead(username: string, weekId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`${PREFIX}${username}`, weekId);
}

export function isDigestUnread(
  username: string | undefined,
  currentWeekId: string,
): boolean {
  if (!username) return false;
  return getDigestReadWeekId(username) !== currentWeekId;
}

export function canReceiveManagerNotifications(
  user: SessionUser | null,
): boolean {
  if (!user) return false;
  return canAccessManagerPage(user) || canAccessEvaluationPage(user);
}
