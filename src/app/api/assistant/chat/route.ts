import { NextResponse } from "next/server";
import { buildAssistantContextText } from "@/lib/assistant/build-context";
import { resolveAssistantActor } from "@/lib/server/assistant-auth";
import {
  buildAssistantSystemPrompt,
  callAssistantLlm,
  isAssistantLlmConfigured,
  type AssistantChatMessage,
} from "@/lib/server/assistant-llm";

type ChatBody = {
  token?: string;
  message?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
};

const rateMap = new Map<string, { count: number; resetAt: number }>();

function allowRate(username: string, limit = 40, windowMs = 60_000): boolean {
  const now = Date.now();
  const cur = rateMap.get(username);
  if (!cur || now > cur.resetAt) {
    rateMap.set(username, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (cur.count >= limit) return false;
  cur.count += 1;
  return true;
}

/** 只读对话：按账号权限裁剪 snapshot 后调用大模型 */
export async function POST(request: Request) {
  if (!isAssistantLlmConfigured()) {
    return NextResponse.json(
      {
        error:
          "未配置大模型。请在服务器环境变量设置 ASSISTANT_LLM_API_KEY（及可选 BASE_URL / MODEL）。",
      },
      { status: 503 },
    );
  }

  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: "无效 JSON" }, { status: 400 });
  }

  const message = body.message?.trim() ?? "";
  if (!message) {
    return NextResponse.json({ error: "请输入问题" }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "问题过长" }, { status: 400 });
  }

  const actor = await resolveAssistantActor({ token: body.token });
  if (!actor.ok) {
    return NextResponse.json({ error: actor.error }, { status: actor.status });
  }

  if (!allowRate(actor.user.username)) {
    return NextResponse.json(
      { error: "提问过于频繁，请稍后再试" },
      { status: 429 },
    );
  }

  const { scopeLabel, contextText, orderCount } = buildAssistantContextText(
    actor.snapshot.orders,
    actor.user,
  );

  const history = (body.history ?? [])
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim(),
    )
    .slice(-8)
    .map((m) => ({
      role: m.role,
      content: m.content.trim().slice(0, 4000),
    })) as AssistantChatMessage[];

  const llm = await callAssistantLlm({
    system: buildAssistantSystemPrompt({ scopeLabel, contextText }),
    messages: [...history, { role: "user", content: message }],
  });

  if (!llm.ok) {
    return NextResponse.json({ error: llm.error }, { status: 502 });
  }

  return NextResponse.json({
    reply: llm.text,
    scopeLabel,
    orderCount,
  });
}
