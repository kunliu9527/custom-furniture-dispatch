"use client";

import { FormEvent, useState } from "react";
import { QrCodeDisplay } from "@/components/customer/qr-code-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  buildSignUrl,
  isContractSigned,
  isOfflineSignWithoutAmount,
} from "@/lib/customer-flow";
import {
  defaultDeliveryDate,
  DEFAULT_CONTRACT_TERMS_PLACEHOLDER,
} from "@/lib/contract-defaults";
import {
  normalizeDepositAmount,
  resolveContractDepositPaid,
} from "@/lib/deposit-rules";
import { formatDeposit } from "@/lib/designers";
import type { Order } from "@/lib/types";

export interface InitiateContractInput {
  contractAmount: number;
  depositPaid: number;
  deliveryDate?: string;
  termsNote?: string;
  attachmentNames?: string;
}

interface ContractPanelProps {
  order: Order;
  onInitiate: (orderId: string, input: InitiateContractInput) => void;
  onOfflineSign?: (orderId: string, depositPaid: number) => void;
  /** @deprecated 使用 onOfflineSign */
  onSkipElectronicSign?: (orderId: string) => void;
  readOnly?: boolean;
}

function initialAmountInput(order: Order): string {
  const amount = order.contract?.contractAmount;
  if (amount != null && amount > 0) return String(amount);
  return "";
}

function initialDepositInput(order: Order): string {
  const paid = resolveContractDepositPaid(order);
  if (order.contract?.depositPaid != null) {
    return order.contract.depositPaid > 0
      ? String(order.contract.depositPaid)
      : "";
  }
  return paid > 0 ? String(paid) : "";
}

export function ContractPanel({
  order,
  onInitiate,
  onOfflineSign,
  onSkipElectronicSign,
  readOnly = false,
}: ContractPanelProps) {
  const handleOfflineSign = onOfflineSign
    ? (orderId: string, depositPaid: number) => onOfflineSign(orderId, depositPaid)
    : onSkipElectronicSign
      ? (orderId: string, _depositPaid: number) => onSkipElectronicSign(orderId)
      : undefined;
  const [amountInput, setAmountInput] = useState(() => initialAmountInput(order));
  const [depositInput, setDepositInput] = useState(() => initialDepositInput(order));
  const [deliveryDate, setDeliveryDate] = useState(
    order.contract?.deliveryDate ?? defaultDeliveryDate(),
  );
  const [termsNote, setTermsNote] = useState(order.contract?.termsNote ?? "");
  const [attachments, setAttachments] = useState(
    order.contract?.attachments?.map((a) => a.name).join("\n") ?? "",
  );
  const [showOptional, setShowOptional] = useState(false);
  const [amountError, setAmountError] = useState("");

  if (order.status !== "待签约") return null;

  const signed = isContractSigned(order);
  const signUrl = order.contract?.token
    ? buildSignUrl(order.contract.token)
    : null;
  const contractAmount = order.contract?.contractAmount ?? 0;
  const depositPaid = resolveContractDepositPaid(order);
  const hasQr = Boolean(signUrl && contractAmount > 0);

  function parseDepositInput(): number {
    const raw = depositInput.trim();
    if (!raw) return 0;
    return normalizeDepositAmount(Number(raw));
  }

  function handleInitiate(e: FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    const contractAmountVal = Number(amountInput);
    if (!Number.isFinite(contractAmountVal) || contractAmountVal <= 0) {
      setAmountError("请填写实际合同金额");
      return;
    }
    setAmountError("");
    onInitiate(order.id, {
      contractAmount: contractAmountVal,
      depositPaid: parseDepositInput(),
      deliveryDate: deliveryDate.trim() || defaultDeliveryDate(),
      termsNote: termsNote.trim() || undefined,
      attachmentNames: attachments.trim() || undefined,
    });
  }

  function handleOfflineSignClick() {
    if (readOnly || !handleOfflineSign) return;
    const ok = window.confirm(
      "确认线下签约？订单将直接进入「已签约」，合同金额留空，后续需手动填写下单金额。",
    );
    if (ok) handleOfflineSign(order.id, parseDepositInput());
  }

  return (
    <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50/40 p-4">
      <p className="text-sm font-semibold text-emerald-900">电子签约</p>
      <p className="mt-1 text-xs text-emerald-800/80">
        填写合同金额与已交定金后生成二维码；定金默认来自录单，可在此修改。
      </p>

      {signed ? (
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          <p>
            合同金额：
            {isOfflineSignWithoutAmount(order.contract) ? (
              <span className="text-slate-500">未填写（线下签约）</span>
            ) : (
              <>¥{contractAmount.toLocaleString("zh-CN")}</>
            )}
          </p>
          <p>已交定金：{formatDeposit(depositPaid)}</p>
          {order.contract?.signedAt && order.contract.signatureDataUrl ? (
            <p className="text-emerald-700">
              客户已于 {new Date(order.contract.signedAt).toLocaleString("zh-CN")}{" "}
              完成电子签
              {order.contract.signedByName
                ? `（${order.contract.signedByName}）`
                : ""}
            </p>
          ) : order.contract?.offlineConfirmed ? (
            <p className="text-emerald-700">已线下签约</p>
          ) : null}
        </div>
      ) : hasQr ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-700">
            合同金额 ¥{contractAmount.toLocaleString("zh-CN")} · 已交定金{" "}
            {formatDeposit(depositPaid)}
            {order.contract?.deliveryDate ? (
              <span className="ml-2">
                · 交货 {order.contract.deliveryDate}
              </span>
            ) : null}
          </p>
          <QrCodeDisplay url={signUrl!} label="客户签约二维码" />
          {handleOfflineSign ? (
            <Button
              type="button"
              variant="secondary"
              disabled={readOnly}
              onClick={handleOfflineSignClick}
            >
              线下签约
            </Button>
          ) : null}
        </div>
      ) : (
        <form onSubmit={handleInitiate} className="mt-4 space-y-3">
          <Input
            label="合同金额（元）"
            name="contractAmount"
            type="number"
            min={1}
            step={1}
            required
            placeholder="请填写实际合同金额"
            value={amountInput}
            onChange={(e) => {
              setAmountInput(e.target.value);
              setAmountError("");
            }}
          />
          <Input
            label="已交定金（元）"
            name="depositPaid"
            type="number"
            min={0}
            step={1}
            placeholder="默认来自录单定金，可修改"
            value={depositInput}
            onChange={(e) => setDepositInput(e.target.value)}
          />
          {amountError ? (
            <p className="text-sm text-rose-600">{amountError}</p>
          ) : null}
          <Input
            label="交货日期"
            name="deliveryDate"
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
          />
          <button
            type="button"
            className="text-xs font-medium text-emerald-800 underline hover:text-emerald-900"
            onClick={() => setShowOptional((v) => !v)}
          >
            {showOptional ? "收起可选信息" : "展开附件说明 / 合同备注（可选）"}
          </button>
          {showOptional ? (
            <>
              <Textarea
                label="附件说明（每行一个，如设计图 PDF 名称）"
                name="attachments"
                value={attachments}
                onChange={(e) => setAttachments(e.target.value)}
                rows={2}
                placeholder={"全屋定制设计图.pdf\n报价方案.pdf"}
              />
              <Textarea
                label="合同备注（可选）"
                name="termsNote"
                value={termsNote}
                onChange={(e) => setTermsNote(e.target.value)}
                rows={2}
                placeholder={DEFAULT_CONTRACT_TERMS_PLACEHOLDER}
              />
            </>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={readOnly}>
              发起签约并生成二维码
            </Button>
            {handleOfflineSign ? (
              <Button
                type="button"
                variant="secondary"
                disabled={readOnly}
                onClick={handleOfflineSignClick}
              >
                线下签约
              </Button>
            ) : null}
          </div>
        </form>
      )}
    </div>
  );
}
