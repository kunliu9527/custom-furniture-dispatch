import { buildHomeOverviewSections } from "../src/lib/home-status-kpis";
import { getDefaultPathForSession } from "../src/lib/role-routes";
import { getVisibleNavLinks } from "../src/lib/nav-access";
import type { SessionUser } from "../src/lib/permissions";

function base(
  partial: Partial<SessionUser> &
    Pick<SessionUser, "username" | "displayName" | "role" | "accessLevel">,
): SessionUser {
  return {
    position: "设计师",
    ...partial,
  };
}

const cases: Array<[string, SessionUser]> = [
  [
    "designer",
    base({
      username: "d1",
      displayName: "张三",
      role: "designer",
      accessLevel: "personal",
      position: "设计师",
    }),
  ],
  [
    "dispatcher",
    base({
      username: "p1",
      displayName: "李四",
      role: "dispatcher",
      accessLevel: "personal",
      position: "派单人",
    }),
  ],
  [
    "acceptance",
    base({
      username: "a1",
      displayName: "王五",
      role: "dispatcher",
      accessLevel: "acceptance_manager",
      position: "验收经理",
    }),
  ],
  [
    "store_mgr",
    base({
      username: "s1",
      displayName: "赵六",
      role: "dispatcher",
      accessLevel: "store_manager",
      position: "店长",
      homeStore: "东岸天冠",
    }),
  ],
];

let failed = 0;
for (const [label, user] of cases) {
  const secs = buildHomeOverviewSections(user, []);
  const nav = new Set(getVisibleNavLinks(user).map((n) => n.href));
  const defaultPath = getDefaultPathForSession(user);
  console.log(
    label,
    "default=",
    defaultPath,
    "nav=",
    [...nav].join(","),
    "sections=",
    secs.map((s) => s.id).join(","),
  );
  if (secs.some((s) => s.id === "sales")) {
    console.error("FAIL sales section still present", label);
    failed++;
  }
  for (const item of secs[0]?.items ?? []) {
    const path = item.href.split("?")[0] ?? item.href;
    if (path !== "/" && !nav.has(path as "/admin")) {
      console.error("FAIL permission trap", label, item.id, item.href);
      failed++;
    }
  }
  if (label === "acceptance" && defaultPath !== "/delivery") {
    console.error("FAIL acceptance default", defaultPath);
    failed++;
  }
  if (label === "designer" && defaultPath !== "/designer") {
    console.error("FAIL designer default", defaultPath);
    failed++;
  }
  if (label === "dispatcher" && defaultPath !== "/admin") {
    console.error("FAIL dispatcher default", defaultPath);
    failed++;
  }
}

if (getVisibleNavLinks(null).length !== 0) {
  console.error("FAIL guest nav should be empty");
  failed++;
}

if (failed) {
  console.error(`FAILED ${failed}`);
  process.exit(1);
}
console.log("OK all checks passed");
