import { createShortId } from "./create-id";
import { resolveOrderCustomerName } from "./order-remark";
import type {
  CustomerRatings,
  Order,
  OrderAcceptance,
  OrderContract,
} from "./types";

export function resolveAcceptCustomerDisplayName(order: Order): string {
  const snap = order.acceptance?.customerDisplayName?.trim();
  if (snap) return snap;
  return resolveOrderCustomerName(order);
}

export function createCustomerToken(prefix: string): string {
  return createShortId(`${prefix}-`);
}

export function buildSignUrl(token: string, origin?: string): string {
  const base =
    origin ??
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/sign/${token}`;
}

export function buildAcceptUrl(token: string, origin?: string): string {
  const base =
    origin ??
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/accept/${token}`;
}

export function normalizeContract(raw: unknown): OrderContract | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const token = typeof o.token === "string" ? o.token.trim() : "";
  if (!token) return null;
  const contractAmount = Number(o.contractAmount);
  const offlineConfirmed =
    typeof o.offlineConfirmed === "boolean" ? o.offlineConfirmed : false;
  const hasAmount = Number.isFinite(contractAmount) && contractAmount > 0;
  if (!hasAmount && !offlineConfirmed) return null;
  const attachments = Array.isArray(o.attachments)
    ? o.attachments
        .filter((a) => a && typeof a === "object")
        .map((a) => {
          const item = a as Record<string, unknown>;
          const name = String(item.name ?? "").trim();
          if (!name) return null;
          return {
            name,
            url: typeof item.url === "string" ? item.url : undefined,
          };
        })
        .filter((a): a is NonNullable<typeof a> => a != null)
    : undefined;

  return {
    token,
    contractAmount: hasAmount ? contractAmount : 0,
    deliveryDate:
      typeof o.deliveryDate === "string" ? o.deliveryDate : undefined,
    attachments,
    termsNote: typeof o.termsNote === "string" ? o.termsNote : undefined,
    initiatedAt: String(o.initiatedAt ?? new Date().toISOString()),
    initiatedBy: typeof o.initiatedBy === "string" ? o.initiatedBy : undefined,
    signedAt: typeof o.signedAt === "string" ? o.signedAt : undefined,
    signatureDataUrl:
      typeof o.signatureDataUrl === "string" ? o.signatureDataUrl : undefined,
    signedByName:
      typeof o.signedByName === "string" ? o.signedByName : undefined,
    offlineConfirmed:
      typeof o.offlineConfirmed === "boolean" ? o.offlineConfirmed : undefined,
    planConfirmed:
      typeof o.planConfirmed === "boolean" ? o.planConfirmed : undefined,
    planConfirmRemark:
      typeof o.planConfirmRemark === "string" ? o.planConfirmRemark : undefined,
    planConfirmedAt:
      typeof o.planConfirmedAt === "string" ? o.planConfirmedAt : undefined,
    standardContractText:
      typeof o.standardContractText === "string"
        ? o.standardContractText
        : undefined,
    skippedElectronicSign:
      typeof o.skippedElectronicSign === "boolean"
        ? o.skippedElectronicSign
        : undefined,
    signLocked:
      typeof o.signLocked === "boolean" ? o.signLocked : undefined,
    depositPaid:
      o.depositPaid != null && Number.isFinite(Number(o.depositPaid))
        ? Math.max(0, Number(o.depositPaid))
        : undefined,
  };
}

export function normalizeInstallation(
  raw: unknown,
): Order["installation"] | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const installedAt =
    typeof o.installedAt === "string" ? o.installedAt : undefined;
  const installerName =
    typeof o.installerName === "string" ? o.installerName : undefined;
  const installerStaffId =
    typeof o.installerStaffId === "string" ? o.installerStaffId : undefined;
  const installStageRemark =
    typeof o.installStageRemark === "string" ? o.installStageRemark : undefined;
  if (!installedAt && !installerName && !installStageRemark) return null;
  return { installedAt, installerName, installerStaffId, installStageRemark };
}

export function normalizeAcceptance(raw: unknown): OrderAcceptance | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const token = typeof o.token === "string" ? o.token.trim() : "";
  if (!token) return null;

  let ratings: CustomerRatings | undefined;
  if (o.ratings && typeof o.ratings === "object") {
    const r = o.ratings as Record<string, unknown>;
    const pick = (key: keyof CustomerRatings) => {
      const v = Number(r[key]);
      return v >= 1 && v <= 5 ? (v as CustomerRatings[keyof CustomerRatings]) : undefined;
    };
    const salesManager = pick("salesManager");
    const designer = pick("designer");
    const installTeam = pick("installTeam");
    const product = pick("product");
    if (salesManager && designer && installTeam && product) {
      ratings = { salesManager, designer, installTeam, product };
    }
  }

  return {
    token,
    initiatedAt: String(o.initiatedAt ?? new Date().toISOString()),
    acceptedAt: typeof o.acceptedAt === "string" ? o.acceptedAt : undefined,
    ratings,
    ratedPersons:
      o.ratedPersons && typeof o.ratedPersons === "object"
        ? {
            dispatcherName: String(
              (o.ratedPersons as Record<string, unknown>).dispatcherName ?? "",
            ),
            designer:
              typeof (o.ratedPersons as Record<string, unknown>).designer ===
              "string"
                ? ((o.ratedPersons as Record<string, unknown>).designer as string)
                : null,
            installerName:
              typeof (o.ratedPersons as Record<string, unknown>).installerName ===
              "string"
                ? ((o.ratedPersons as Record<string, unknown>)
                    .installerName as string)
                : null,
          }
        : undefined,
    customerDisplayName:
      typeof o.customerDisplayName === "string"
        ? o.customerDisplayName.trim() || undefined
        : undefined,
    comment: typeof o.comment === "string" ? o.comment : undefined,
    hasInstallIssue:
      typeof o.hasInstallIssue === "boolean" ? o.hasInstallIssue : undefined,
    skippedElectronicAccept:
      typeof o.skippedElectronicAccept === "boolean"
        ? o.skippedElectronicAccept
        : undefined,
  };
}

export function averageCustomerRating(ratings: CustomerRatings): number {
  return (
    (ratings.salesManager +
      ratings.designer +
      ratings.installTeam +
      ratings.product) /
    4
  );
}

export function isContractSigned(order: Order): boolean {
  return Boolean(
    order.contract?.signedAt ||
      order.contract?.offlineConfirmed ||
      order.status === "已签约" ||
      order.status === "已下单" ||
      order.status === "已安装" ||
      order.status === "已验收",
  );
}

/** 线下签约且未填合同金额 */
export function isOfflineSignWithoutAmount(
  contract: OrderContract | null | undefined,
): boolean {
  if (!contract?.offlineConfirmed) return false;
  return !contract.contractAmount || contract.contractAmount <= 0;
}

/** 电子签约完成后，下单金额默认带入合同金额 */
export function resolvePrefilledOrderAmount(order: Order): string {
  if (order.status !== "已签约") return "";
  const contract = order.contract;
  if (!contract?.contractAmount || contract.contractAmount <= 0) return "";
  if (isOfflineSignWithoutAmount(contract)) return "";
  if (contract.skippedElectronicSign) return "";
  return String(contract.contractAmount);
}

export function isAcceptanceComplete(order: Order): boolean {
  return order.status === "已验收" || Boolean(order.acceptance?.acceptedAt);
}
