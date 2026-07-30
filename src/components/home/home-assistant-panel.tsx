"use client";

import { useAuth } from "@/context/auth-context";
import { describeAssistantDataScope } from "@/lib/assistant/scope";
import { readStoredAuthSession } from "@/lib/auth-session";
import { ACCESS_LEVEL_LABELS } from "@/lib/staff-access";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type ChatTurn = { role: "user" | "assistant"; content: string };

const TOKEN_KEY = "dispatch-assistant-token";
const TOKEN_EXP_KEY = "dispatch-assistant-token-exp";

function loadCachedToken(username: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const token = sessionStorage.getItem(`${TOKEN_KEY}:${username}`);
    const exp = Number(sessionStorage.getItem(`${TOKEN_EXP_KEY}:${username}`));
    if (!token || !Number.isFinite(exp) || Date.now() > exp - 60_000) {
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

function saveCachedToken(username: string, token: string, expiresAt: number) {
  sessionStorage.setItem(`${TOKEN_KEY}:${username}`, token);
  sessionStorage.setItem(`${TOKEN_EXP_KEY}:${username}`, String(expiresAt));
}

/**
 * 登录后首页数据助手：只读查询；数据范围随权限/岗位裁剪。
 */
export function HomeAssistantPanel() {
  const { user, isHydrated } = useAuth();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [scopeLabel, setScopeLabel] = useState("");
  const [llmReady, setLlmReady] = useState<boolean | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    setScopeLabel(describeAssistantDataScope(user));
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/assistant/token")
      .then((r) => r.json())
      .then((d: { llmConfigured?: boolean }) => {
        if (!cancelled) setLlmReady(Boolean(d.llmConfigured));
      })
      .catch(() => {
        if (!cancelled) setLlmReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [turns, busy]);

  const ensureToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    const cached = loadCachedToken(user.username);
    if (cached) return cached;

    const session = readStoredAuthSession();
    if (!session || session.user.username !== user.username) {
      setError("登录状态异常，请重新登录后再试");
      return null;
    }

    const res = await fetch("/api/assistant/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user.username,
        passwordRevision: session.passwordRevision,
      }),
    });
    const data = (await res.json()) as {
      token?: string;
      expiresAt?: number;
      error?: string;
    };
    if (!res.ok || !data.token || !data.expiresAt) {
      setError(data.error || "助手鉴权失败，请重新登录");
      return null;
    }
    saveCachedToken(user.username, data.token, data.expiresAt);
    return data.token;
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || busy) return;
    const message = input.trim();
    if (!message) return;

    setError("");
    setInput("");
    setTurns((prev) => [...prev, { role: "user", content: message }]);
    setBusy(true);

    try {
      const token = await ensureToken();
      if (!token) {
        setTurns((prev) => prev.slice(0, -1));
        setInput(message);
        return;
      }

      const history = turns.slice(-8);
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, message, history }),
      });
      const data = (await res.json()) as {
        reply?: string;
        scopeLabel?: string;
        error?: string;
      };

      if (!res.ok || !data.reply) {
        setError(data.error || "请求失败");
        setTurns((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.error || "暂时无法回答，请稍后重试。",
          },
        ]);
        return;
      }

      if (data.scopeLabel) setScopeLabel(data.scopeLabel);
      setTurns((prev) => [
        ...prev,
        { role: "assistant", content: data.reply! },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "网络错误";
      setError(msg);
      setTurns((prev) => [
        ...prev,
        { role: "assistant", content: `请求失败：${msg}` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  if (!isHydrated || !user) return null;

  return (
    <section
      className="vi-surface flex flex-col overflow-hidden"
      aria-labelledby="home-assistant-title"
    >
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[var(--separator)] px-4 py-3">
        <div>
          <h2
            id="home-assistant-title"
            className="text-[17px] font-semibold"
            style={{ color: "var(--label-primary)" }}
          >
            数据助手
          </h2>
          <p
            className="mt-0.5 text-[13px]"
            style={{ color: "var(--label-tertiary)" }}
          >
            {ACCESS_LEVEL_LABELS[user.accessLevel]}
            {scopeLabel ? ` · ${scopeLabel}` : ""}
            {" · 只读查询"}
          </p>
        </div>
        {llmReady === false ? (
          <p
            className="text-[12px] font-medium"
            style={{ color: "var(--system-orange)" }}
          >
            未配置大模型密钥
          </p>
        ) : null}
      </div>

      <div
        ref={listRef}
        className="flex max-h-[min(22rem,45dvh)] min-h-[12rem] flex-col gap-3 overflow-y-auto px-4 py-3"
      >
        {turns.length === 0 ? (
          <p
            className="text-[14px] leading-relaxed"
            style={{ color: "var(--label-secondary)" }}
          >
            可问：未派单有多少、某客户进度、本范围设计在途等。回答仅基于你权限内的订单。
          </p>
        ) : (
          turns.map((t, i) => (
            <div
              key={`${t.role}-${i}`}
              className={
                t.role === "user" ? "ml-6 self-end" : "mr-6 self-start"
              }
            >
              <p
                className="mb-1 text-[11px] font-medium"
                style={{ color: "var(--label-tertiary)" }}
              >
                {t.role === "user" ? "我" : "助手"}
              </p>
              <div
                className="whitespace-pre-wrap rounded-[14px] px-3 py-2 text-[14px] leading-relaxed text-pretty"
                style={
                  t.role === "user"
                    ? {
                        background: "var(--system-blue)",
                        color: "#fff",
                      }
                    : {
                        background: "var(--fill-tertiary)",
                        color: "var(--label-primary)",
                      }
                }
              >
                {t.content}
              </div>
            </div>
          ))
        )}
        {busy ? (
          <p
            className="text-[13px]"
            style={{ color: "var(--label-tertiary)" }}
          >
            思考中…
          </p>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-[var(--separator)] p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入问题…"
          disabled={busy || llmReady === false}
          className="vi-field min-w-0 flex-1"
          aria-label="助手问题"
        />
        <button
          type="submit"
          disabled={busy || !input.trim() || llmReady === false}
          className="vi-btn vi-btn-primary shrink-0 px-4"
        >
          发送
        </button>
      </form>
      {error ? (
        <p
          className="px-4 pb-3 text-[12px]"
          style={{ color: "var(--system-red)" }}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}
