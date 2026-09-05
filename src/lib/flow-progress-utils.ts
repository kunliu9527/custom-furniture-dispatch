import { FLOW_ORDER_STATUSES } from "./constants";
import { isRefundStatus } from "./order-utils";
import type { FlowOrderStatus, Order } from "./types";

/** 流程推进图列顺序:主流程 未派单 → 已验收 */
export const FLOW_STAGE_ORDER: FlowOrderStatus[] = FLOW_ORDER_STATUSES;

/**
 * 列头显示名:首列「未派单」(等待派出)在推进图上以里程碑「已录单」展示;
 * 该列达成日期 = 录单日(进入系统即开始流程)。其余列与状态同名。
 */
export const FLOW_STAGE_DISPLAY: Record<FlowOrderStatus, string> = {
  未派单: "已录单",
  待量尺: "待量尺",
  已量尺: "已量尺",
  已出图: "已出图",
  待签约: "待签约",
  已签约: "已签约",
  已下单: "已下单",
  已安装: "已安装",
  已验收: "已验收",
};

/** 阶段实心色(表头色点/进行中圆点),与 status-badge 同色系 */
export const STATUS_BAR_FILL: Record<FlowOrderStatus, string> = {
  未派单: "bg-zinc-400",
  待量尺: "bg-amber-400",
  已量尺: "bg-sky-400",
  已出图: "bg-blue-400",
  待签约: "bg-orange-400",
  已签约: "bg-emerald-400",
  已下单: "bg-orange-500",
  已安装: "bg-slate-400",
  已验收: "bg-teal-400",
};

/** 达成格子的填充底色 + 日期文字色(整串字面量,保证 Tailwind 可扫描) */
export const FLOW_STAGE_CELL_FILL: Record<FlowOrderStatus, string> = {
  未派单: "bg-zinc-400/25 text-zinc-700",
  待量尺: "bg-amber-400/25 text-amber-800",
  已量尺: "bg-sky-400/25 text-sky-800",
  已出图: "bg-blue-400/25 text-blue-800",
  待签约: "bg-orange-400/25 text-orange-800",
  已签约: "bg-emerald-400/25 text-emerald-800",
  已下单: "bg-orange-500/25 text-orange-900",
  已安装: "bg-slate-400/25 text-slate-700",
  已验收: "bg-teal-400/25 text-teal-800",
};

/** 单笔订单在某主流程环节的格子状态 */
export interface FlowStageCell {
  status: FlowOrderStatus;
  /** 该环节达成日期(ISO);尚未到达时为 null */
  doneIso: string | null;
  /** 是否为订单当前所在、尚未完结的环节(进行中虚线标记) */
  isCurrent: boolean;
}

function isoOrNull(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return Number.isFinite(new Date(iso).getTime()) ? iso : null;
}

/**
 * 环节达成日 = 订单进入该环节的日期(如「已量尺」= 量尺完成日)。
 * 优先取 statusEnteredAt;旧数据无环节进入记录时,
 * 回退到「状态推进」日志/流程备注时间与终态里程碑(安装/验收)时间。
 */
function stageDoneIso(order: Order, status: FlowOrderStatus): string | null {
  // 首列「已录单」:录单即进入流程,达成日期 = 录单日
  if (status === "未派单") {
    return isoOrNull(order.createdAt);
  }
  const fromMap = isoOrNull(order.statusEnteredAt?.[status]);
  if (fromMap) return fromMap;

  const hasEnteredTimes = Boolean(
    order.statusEnteredAt && Object.keys(order.statusEnteredAt).length > 0,
  );
  if (!hasEnteredTimes) {
    // 无环节进入记录(旧数据):取推进日志或该环节备注的落单时间兜底
    const fromEvent = order.orderEvents?.find(
      (e) => e.kind === "状态推进" && e.toStatus === status,
    );
    const fromEventAt = isoOrNull(fromEvent?.at);
    if (fromEventAt) return fromEventAt;
    const fromRemark = order.workflowRemarks?.find(
      (r) => r.stage === status,
    );
    const fromRemarkAt = isoOrNull(fromRemark?.at ?? null);
    if (fromRemarkAt) return fromRemarkAt;
  }

  // 终态单据自身的里程碑时间:即使无环节进入记录也能定位达成日
  if (status === "已安装") {
    return isoOrNull(order.installation?.installedAt ?? null);
  }
  if (status === "已验收") {
    return isoOrNull(order.acceptance?.acceptedAt ?? null);
  }
  return null;
}

/** 将一笔订单展开为 9 个主流程环节的格子状态(已录单 → 已验收) */
export function buildFlowStageCells(order: Order): FlowStageCell[] {
  const refunded = isRefundStatus(order.status);
  return FLOW_STAGE_ORDER.map((status) => ({
    status,
    doneIso: stageDoneIso(order, status),
    // 退单中的订单不再标注任何进行中环节;已验收即完结;
    // 「未派单」状态单尚未派出,其录单日已在首列体现,不再标注进行中
    isCurrent:
      !refunded &&
      order.status === status &&
      status !== "已验收" &&
      status !== "未派单",
  }));
}
