"use client";

import { FormEvent, useEffect, useState } from "react";
import { SignatureCanvas } from "@/components/customer/signature-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDeposit } from "@/lib/designers";
import { formatSpaces } from "@/lib/order-format";
import { resolveContractDepositPaid } from "@/lib/deposit-rules";
import { DEFAULT_STANDARD_CONTRACT_TEXT } from "@/lib/site-branding";
import type { OrderContract } from "@/lib/types";

interface SignPayload {
  customerName: string;
  phone: string;
  address: string;
  dispatchStore: string;
  dispatcherName: string;
  designer: string | null;
  spaces: string[];
  budget: number;
  contract: OrderContract;
  alreadySigned: boolean;
}

export default function SignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [payload, setPayload] = useState<SignPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signedByName, setSignedByName] = useState("");
  const [planConfirmed, setPlanConfirmed] = useState(false);
  const [planConfirmRemark, setPlanConfirmRemark] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    void fetch(`/api/sign/${token}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("not_found");
        return (await res.json()) as SignPayload;
      })
      .then((data) => {
        setPayload(data);
        setSignedByName(data.customerName);
        if (data.alreadySigned) setDone(true);
      })
      .catch(() => setError("签约链接无效或已过期"))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !payload || !signature) return;
    const name = signedByName.trim();
    if (!name) return;
    if (name !== payload.customerName.trim()) {
      setError("签名人姓名须与客户姓名一致");
      return;
    }
    if (!planConfirmed) {
      setError("请先确认设计方案");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureDataUrl: signature,
          signedByName: name,
          planConfirmed: true,
          planConfirmRemark: planConfirmRemark.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(
          data.error === "already_signed"
            ? "合同已完成签约"
            : data.error === "name_mismatch"
              ? "签名人姓名须与客户姓名一致"
              : data.error === "plan_not_confirmed"
                ? "请先确认设计方案"
                : "提交失败，请稍后重试",
        );
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
        加载合同…
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

  const { contract } = payload;
  const standardText =
    contract.standardContractText?.trim() || DEFAULT_STANDARD_CONTRACT_TEXT;

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-slate-50 px-4 py-6">
      <header className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
        <p className="text-xs text-slate-500">全屋定制超级定单系统</p>
        <h1 className="mt-1 text-lg font-bold text-slate-900">
          全屋定制电子合同签订
        </h1>
      </header>

      <section className="mt-4 space-y-3 rounded-xl bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200/80">
        <div>
          <p className="text-xs text-slate-500">甲方（客户）</p>
          <p className="font-medium">{payload.customerName}</p>
          <p className="text-slate-600">{payload.phone}</p>
          <p className="text-slate-600">{payload.address}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">乙方（门店）</p>
          <p className="font-medium">{payload.dispatchStore}</p>
          <p className="text-slate-600">客户经理：{payload.dispatcherName}</p>
          {payload.designer ? (
            <p className="text-slate-600">设计师：{payload.designer}</p>
          ) : null}
        </div>
        <div className="border-t border-slate-100 pt-3">
          <p>
            <span className="text-slate-500">定制空间：</span>
            {formatSpaces(payload.spaces as never)}
          </p>
          <p>
            <span className="text-slate-500">已交定金：</span>
            {formatDeposit(payload.contract.depositPaid ?? 0)}
          </p>
          <p className="mt-2 text-base font-semibold text-emerald-800">
            合同金额：¥{contract.contractAmount.toLocaleString("zh-CN")}
          </p>
          {contract.deliveryDate ? (
            <p className="text-slate-600">交货日期：{contract.deliveryDate}</p>
          ) : null}
        </div>
        {contract.attachments?.length ? (
          <ul className="border-t border-slate-100 pt-3 text-xs text-slate-600">
            <p className="font-medium text-slate-700">附件</p>
            {contract.attachments.map((a) => (
              <li key={a.name}>· {a.name}</li>
            ))}
          </ul>
        ) : null}
        {contract.termsNote ? (
          <p className="border-t border-slate-100 pt-3 text-xs text-slate-600">
            {contract.termsNote}
          </p>
        ) : null}
      </section>

      {done ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-lg font-semibold text-emerald-800">已确认签约</p>
          <p className="mt-2 text-sm text-emerald-700">
            感谢您的信任，我们将按合同约定为您服务。
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80"
        >
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
            <p className="text-sm font-semibold text-indigo-900">方案确认</p>
            <label className="mt-2 flex cursor-pointer items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={planConfirmed}
                onChange={(e) => setPlanConfirmed(e.target.checked)}
                className="mt-1"
              />
              <span>我已确认设计方案，同意按方案执行定制与安装</span>
            </label>
            <Textarea
              label="方案确认备注（选填）"
              name="planConfirmRemark"
              className="mt-3"
              placeholder="如有补充说明可填写"
              value={planConfirmRemark}
              onChange={(e) => setPlanConfirmRemark(e.target.value)}
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-800">标准合同条款</p>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed">{standardText}</p>
          </div>

          <p className="text-sm font-medium text-slate-800">签字区</p>
          <Input
            label="签名人姓名（须与客户姓名一致）"
            name="signedByName"
            required
            value={signedByName}
            onChange={(e) => setSignedByName(e.target.value)}
          />
          <SignatureCanvas onChange={setSignature} />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button
            type="submit"
            disabled={submitting || !signature || !planConfirmed}
            className="w-full"
          >
            {submitting ? "提交中…" : "点击此处，手写名字确认合同"}
          </Button>
        </form>
      )}
    </main>
  );
}
