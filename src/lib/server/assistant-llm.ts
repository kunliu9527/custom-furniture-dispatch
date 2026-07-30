export type AssistantChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export function isAssistantLlmConfigured(): boolean {
  return Boolean(process.env.ASSISTANT_LLM_API_KEY?.trim());
}

export function getAssistantLlmConfig(): {
  apiKey: string;
  baseUrl: string;
  model: string;
} | null {
  const apiKey = process.env.ASSISTANT_LLM_API_KEY?.trim();
  if (!apiKey) return null;
  const baseUrl = (
    process.env.ASSISTANT_LLM_BASE_URL?.trim() || "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model =
    process.env.ASSISTANT_LLM_MODEL?.trim() || "gpt-4o-mini";
  return { apiKey, baseUrl, model };
}

export async function callAssistantLlm(input: {
  system: string;
  messages: AssistantChatMessage[];
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const cfg = getAssistantLlmConfig();
  if (!cfg) {
    return {
      ok: false,
      error: "未配置 ASSISTANT_LLM_API_KEY，无法调用大模型",
    };
  }

  const body = {
    model: cfg.model,
    temperature: 0.2,
    messages: [
      { role: "system", content: input.system },
      ...input.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ],
  };

  let res: Response;
  try {
    res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return {
      ok: false,
      error: `大模型网络错误：${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const raw = await res.text();
  if (!res.ok) {
    return {
      ok: false,
      error: `大模型 HTTP ${res.status}：${raw.slice(0, 280)}`,
    };
  }

  try {
    const data = JSON.parse(raw) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return { ok: false, error: "大模型返回空内容" };
    return { ok: true, text };
  } catch {
    return { ok: false, error: "大模型返回无法解析" };
  }
}

export function buildAssistantSystemPrompt(input: {
  scopeLabel: string;
  contextText: string;
}): string {
  return [
    "你是定制家具派单系统的只读数据助手。",
    "只能根据下方「可见数据上下文」回答；不要编造不存在的订单或数字。",
    "若上下文不足以回答，明确说明缺少信息，并建议用户到对应工作台查看。",
    "当前仅支持查询与汇总，不要声称已修改系统数据。",
    "回答简洁、用中文；涉及数量用具体数字。",
    `用户数据范围：${input.scopeLabel}`,
    "",
    "—— 可见数据上下文 ——",
    input.contextText,
  ].join("\n");
}
