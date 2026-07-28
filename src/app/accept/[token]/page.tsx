"use client";

import { FormEvent, useEffect, useState } from "react";
import { StarRating } from "@/components/customer/star-rating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CustomerRatings } from "@/lib/types";

interface AcceptPayload {
  customerName: string;
  phone: string;
  address: string;
  dispatchStore: string;
  dispatcherName: string;
  designer: string | null;
  installation?: {
    installedAt?: string;
    installerName?: string;
  } | null;
  alreadyAccepted: boolean;
  acceptance?: {
    acceptedAt?: string;
  };
}

const EMPTY_RATINGS: CustomerRatings = {
  salesManager: 0 as CustomerRatings["salesManager"],
  designer: 0 as CustomerRatings["designer"],
  installTeam: 0 as CustomerRatings["installTeam"],
  product: 0 as CustomerRatings["product"],
};

export default function AcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [payload, setPayload] = useState<AcceptPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ratings, setRatings] = useState<CustomerRatings>(EMPTY_RATINGS);
  const [comment, setComment] = useState("");
  const [hasIssue, setHasIssue] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    void fetch(`/api/accept/${token}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("not_found");
        return (await res.json()) as AcceptPayload;
      })
      .then((data) => {
        setPayload(data);
        if (data.alreadyAccepted) setDone(true);
      })
      .catch(() => setError("验收链接无效或已过期"))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (hasIssue) {
      const store = payload?.dispatchStore?.trim() || "门店";
      const dispatcher = payload?.dispatcherName?.trim();
      const designer = payload?.designer?.trim();
      const contacts = [
        dispatcher ? `客户经理「${dispatcher}」` : null,
        designer ? `设计师「${designer}」` : null,
      ]
        .filter(Boolean)
        .join("或");
      setError(
        contacts
          ? `安装有问题时请先联系${store}的${contacts}处理，暂不提交验收。`
          : `安装有问题时请先联系「${store}」处理，暂不提交验收。`,
      );
      return;
    }
    if (
      !ratings.salesManager ||
      !ratings.designer ||
      !ratings.installTeam ||
      !ratings.product
    ) {
      setError("请完成全部评价项");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/accept/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratings, comment, hasInstallIssue: false }),
      });
      if (!res.ok) {
        setError("提交失败，请稍后重试");
        return;
      }
      setDone(true);
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto min-h-screen max-w-lg px-4 py-10 text-center text-sm text-slate-500">
        加载验收单…
      </main>
    );
  }

  if (error && !payload) {
    return (
      <main className="mx-auto min-h-screen max-w-lg px-4 py-10 text-center">
        <p className="text-rose-600">{error}</p>
      </main>
    );
  }

  if (!payload) return null;

  const installerLabel =
    payload.installation?.installerName?.trim() || "安装团队";
  const designerLabel = payload.designer?.trim() || "设计师";

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-slate-50 px-4 py-6">
      <header className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
        <p className="text-xs text-slate-500">全屋定制超级定单系统</p>
        <h1 className="mt-1 text-lg font-bold text-slate-900">
          {payload.customerName
            ? `${payload.customerName} · 安装验收反馈`
            : "安装验收反馈"}
        </h1>
        <p className="mt-1 text-xs text-slate-500">{payload.dispatchStore}</p>
      </header>

      <section className="mt-4 space-y-2 rounded-xl bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200/80">
        <p>
          <span className="text-slate-500">客户：</span>
          {payload.customerName || "—"}
        </p>
        <p>
          <span className="text-slate-500">电话：</span>
          {payload.phone}
        </p>
        <p>
          <span className="text-slate-500">地址：</span>
          {payload.address}
        </p>
        <p>
          <span className="text-slate-500">客户经理：</span>
          {payload.dispatcherName}
        </p>
        {payload.designer ? (
          <p>
            <span className="text-slate-500">设计师：</span>
            {payload.designer}
          </p>
        ) : null}
        {payload.installation?.installedAt ? (
          <p>
            <span className="text-slate-500">安装日期：</span>
            {new Date(payload.installation.installedAt).toLocaleDateString(
              "zh-CN",
            )}
          </p>
        ) : null}
        {payload.installation?.installerName ? (
          <p>
            <span className="text-slate-500">安装师傅：</span>
            {payload.installation.installerName}
          </p>
        ) : null}
      </section>

      {done ? (
        <div className="mt-6 rounded-xl border border-teal-200 bg-teal-50 p-6 text-center">
          <p className="text-lg font-semibold text-teal-800">已确认验收</p>
          <p className="mt-2 text-sm text-teal-700">
            感谢您的评价，我们会持续改进服务品质。
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80"
        >
          <p className="text-sm font-semibold text-slate-800">反馈</p>
          <StarRating
            label={`您对客户经理 ${payload.dispatcherName} 满意吗？`}
            value={ratings.salesManager}
            onChange={(v) =>
              setRatings((r) => ({
                ...r,
                salesManager: v as CustomerRatings["salesManager"],
              }))
            }
            required
          />
          <StarRating
            label={`您对设计师 ${designerLabel} 满意吗？`}
            value={ratings.designer}
            onChange={(v) =>
              setRatings((r) => ({
                ...r,
                designer: v as CustomerRatings["designer"],
              }))
            }
            required
          />
          <StarRating
            label={`您对安装师 ${installerLabel} 满意吗？`}
            value={ratings.installTeam}
            onChange={(v) =>
              setRatings((r) => ({
                ...r,
                installTeam: v as CustomerRatings["installTeam"],
              }))
            }
            required
          />
          <StarRating
            label="整体满意度"
            value={ratings.product}
            onChange={(v) =>
              setRatings((r) => ({
                ...r,
                product: v as CustomerRatings["product"],
              }))
            }
            required
          />
          <Textarea
            label="建议或评语"
            name="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          <label className="flex items-start gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={hasIssue}
              onChange={(e) => setHasIssue(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              安装有问题，暂不验收（请先联系门店「{payload.dispatchStore}
              」{payload.dispatcherName ? `客户经理「${payload.dispatcherName}」` : ""}
              {payload.designer ? `或设计师「${payload.designer}」` : ""}
              填写安装问题反馈单）
            </span>
          </label>
          {hasIssue ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950">
              当前无法在线提交验收。请直接联系：
              <br />
              门店：{payload.dispatchStore}
              <br />
              客户经理：{payload.dispatcherName || "—"}
              {payload.designer ? (
                <>
                  <br />
                  设计师：{payload.designer}
                </>
              ) : null}
              {payload.phone ? (
                <>
                  <br />
                  订单预留电话（可核对身份）：{payload.phone}
                </>
              ) : null}
            </div>
          ) : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "提交中…" : "确认验收并提交评价"}
          </Button>
          <p className="text-xs leading-relaxed text-slate-500">
            备注：本验收单需在安装全部完成并合格后由客户确认；可作为安装师傅月度绩效参考。
          </p>
        </form>
      )}
    </main>
  );
}
