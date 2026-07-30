import { NextResponse } from "next/server";
import { mintAssistantToken } from "@/lib/server/assistant-auth";
import { computePasswordRevision } from "@/lib/auth-session";
import { buildAuthUsers, authenticate, findAuthUser } from "@/lib/auth-users";
import { isAssistantLlmConfigured } from "@/lib/server/assistant-llm";
import { readAppSnapshot } from "@/lib/server/app-store";

type TokenBody = {
  username?: string;
  password?: string;
  /** 与登录 session 中的 passwordRevision 一致，可免再输密码 */
  passwordRevision?: string;
};

/** 签发助手 token */
export async function POST(request: Request) {
  let body: TokenBody;
  try {
    body = (await request.json()) as TokenBody;
  } catch {
    return NextResponse.json({ error: "无效 JSON" }, { status: 400 });
  }

  const username = body.username?.trim() ?? "";
  if (!username) {
    return NextResponse.json({ error: "缺少账号" }, { status: 400 });
  }

  const snapshot = await readAppSnapshot();
  const users = buildAuthUsers(
    snapshot.staffConfig.customStaff,
    snapshot.staffConfig.accessOverrides,
    snapshot.staffConfig.passwordOverrides,
    snapshot.staffConfig.homeStoreOverrides,
    snapshot.staffConfig.extraStoreOverrides,
    snapshot.staffConfig.phoneOverrides,
  );

  let auth = null as ReturnType<typeof authenticate>;
  if (body.password != null && body.password !== "") {
    auth = authenticate(users, username, body.password);
  } else if (body.passwordRevision) {
    const found = findAuthUser(users, username);
    if (
      found &&
      computePasswordRevision(found) === body.passwordRevision
    ) {
      auth = found;
    }
  }

  if (!auth) {
    return NextResponse.json({ error: "账号校验失败，请重新登录", status: 401 });
  }

  const { token, expiresAt } = mintAssistantToken(
    auth.username,
    computePasswordRevision(auth),
  );

  return NextResponse.json({
    token,
    expiresAt,
    displayName: auth.displayName,
    accessLevel: auth.accessLevel,
  });
}

export async function GET() {
  return NextResponse.json({
    llmConfigured: isAssistantLlmConfigured(),
  });
}
