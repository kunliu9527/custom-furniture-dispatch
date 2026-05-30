"use client";

import { QrCodeDisplay } from "@/components/customer/qr-code-display";
import { Button } from "@/components/ui/button";
import {
  averageCustomerRating,
  buildAcceptUrl,
  isAcceptanceComplete,
  resolveAcceptCustomerDisplayName,
} from "@/lib/customer-flow";
import { buildOrderRatingAttributions } from "@/lib/customer-ratings";
import { OrderRatingAttribution } from "@/components/shared/order-rating-attribution";
import type { Order } from "@/lib/types";

interface AcceptancePanelProps {
  order: Order;
  onInitiateAcceptance: (orderId: string) => void;
  onSkipElectronicAccept?: (orderId: string) => void;
  readOnly?: boolean;
}

export function AcceptancePanel({
  order,
  onInitiateAcceptance,
  onSkipElectronicAccept,
  readOnly = false,
}: AcceptancePanelProps) {
  if (order.status !== "已安装" && order.status !== "已验收") return null;

  const complete = isAcceptanceComplete(order);
  const skipped = order.acceptance?.skippedElectronicAccept;
  const acceptUrl = order.acceptance?.token
    ? buildAcceptUrl(order.acceptance.token)
    : null;
  const customerLabel = resolveAcceptCustomerDisplayName(order);

  const installDate = order.installation?.installedAt
    ? new Date(order.installation.installedAt).toLocaleDateString("zh-CN")
    : null;

  return (
    <div className="mt-4 rounded-lg border border-teal-100 bg-teal-50/40 p-4">
      <p className="text-sm font-semibold text-teal-900">安装验收与客户评价</p>
      <p className="mt-1 text-xs text-teal-800/80">
        安装完成后可生成验收码；也可无电子验收直接更新为已验收。
      </p>

      {installDate ? (
        <p className="mt-2 text-sm text-slate-700">
          安装日期：{installDate}
          {order.installation?.installerName ? (
            <span className="ml-3">
              安装师：{order.installation.installerName}
            </span>
          ) : null}
        </p>
      ) : null}

      {complete && skipped ? (
        <p className="mt-3 text-sm font-medium text-teal-800">
          无电子验收 · 已更新为已验收
          {order.acceptance?.acceptedAt ? (
            <span className="ml-2 text-xs font-normal text-slate-500">
              {new Date(order.acceptance.acceptedAt).toLocaleString("zh-CN")}
            </span>
          ) : null}
        </p>
      ) : complete && order.acceptance?.ratings ? (
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          <p className="font-medium text-teal-800">
            已验收 · 客户均分{" "}
            {averageCustomerRating(order.acceptance.ratings).toFixed(1)} 星
          </p>
          <OrderRatingAttribution
            attributions={buildOrderRatingAttributions(order)}
            compact
          />
          {order.acceptance.comment ? (
            <p className="text-xs text-slate-600">
              客户评语：{order.acceptance.comment}
            </p>
          ) : null}
        </div>
      ) : order.status === "已安装" ? (
        <>
          {acceptUrl ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <QrCodeDisplay
                    url={acceptUrl}
                    label={
                      customerLabel
                        ? `${customerLabel} · 安装验收反馈`
                        : "安装验收反馈"
                    }
                  />
                </div>
              </div>
              {onSkipElectronicAccept ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={readOnly}
                  onClick={() => onSkipElectronicAccept(order.id)}
                >
                  无电子验收更新
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => onInitiateAcceptance(order.id)}
                disabled={readOnly}
              >
                生成验收二维码
              </Button>
              {onSkipElectronicAccept ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={readOnly}
                  onClick={() => onSkipElectronicAccept(order.id)}
                >
                  无电子验收更新
                </Button>
              ) : null}
            </div>
          )}
        </>
      ) : null}

      {order.installation?.installStageRemark ? (
        <p className="mt-3 text-xs text-slate-600">
          阶段备注：{order.installation.installStageRemark}
        </p>
      ) : null}
    </div>
  );
}
