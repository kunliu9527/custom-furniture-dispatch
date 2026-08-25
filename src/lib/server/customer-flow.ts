import { appendOrderEvent } from "@/lib/order-events";
import { applyStageIntervalOnAdvance } from "@/lib/stage-intervals";
import {
  normalizeAcceptance,
  normalizeContract,
  normalizeInstallation,
} from "@/lib/customer-flow";
import { buildAcceptanceBadReviewRemarks } from "@/lib/acceptance-rating";
import { buildRatedPersonsSnapshot } from "@/lib/customer-ratings";
import { resolveAcceptCustomerDisplayName } from "@/lib/customer-flow";
import { appendWorkflowRemark } from "@/lib/workflow-remarks";
import { readAppSnapshot, writeAppSnapshot } from "@/lib/server/app-store";
import { listCompanies } from "@/lib/server/company-store";
import type { AppSnapshot } from "@/lib/server/snapshot-types";
import type {
  CustomerRatings,
  Order,
  OrderContract,
} from "@/lib/types";

function patchOrders(
  snapshot: AppSnapshot,
  orderId: string,
  patch: (order: Order) => Order | null,
): Order | null {
  let updated: Order | null = null;
  const orders = snapshot.orders.map((raw) => {
    const order = raw as Order;
    if (order.id !== orderId) return order;
    const next = patch(order);
    if (!next) return order;
    updated = next;
    return next;
  });
  if (!updated) return null;
  return updated;
}

function findOrderBySignToken(
  snapshot: AppSnapshot,
  token: string,
): Order | undefined {
  return snapshot.orders.find(
    (raw) => (raw as Order).contract?.token === token,
  ) as Order | undefined;
}

function findOrderByAcceptToken(
  snapshot: AppSnapshot,
  token: string,
): Order | undefined {
  return snapshot.orders.find(
    (raw) => (raw as Order).acceptance?.token === token,
  ) as Order | undefined;
}

/** 客户令牌不携带公司信息：遍历公司快照定位所属公司（本地规模公司数量很小） */
async function resolveCompanyByCustomerToken(
  kind: "sign" | "accept",
  token: string,
): Promise<{ companyId: string; snapshot: AppSnapshot } | null> {
  const companies = await listCompanies();
  for (const company of companies) {
    const snapshot = await readAppSnapshot(company.id);
    const order =
      kind === "sign"
        ? findOrderBySignToken(snapshot, token)
        : findOrderByAcceptToken(snapshot, token);
    if (order) return { companyId: company.id, snapshot };
  }
  return null;
}

export async function readSignPublicPayload(token: string) {
  const found = await resolveCompanyByCustomerToken("sign", token);
  if (!found) return null;
  const { snapshot } = found;
  const order = findOrderBySignToken(snapshot, token);
  if (!order?.contract) return null;
  const contract = normalizeContract(order.contract);
  if (!contract) return null;
  return {
    orderId: order.id,
    customerName: order.customerName,
    phone: order.phone,
    address: order.address,
    dispatchStore: order.dispatchStore,
    dispatcherName: order.dispatcherName,
    designer: order.designer,
    spaces: order.spaces,
    budget: order.budget,
    status: order.status,
    contract,
    alreadySigned: Boolean(contract.signedAt || contract.offlineConfirmed),
  };
}

export async function submitCustomerSignature(input: {
  token: string;
  signatureDataUrl: string;
  signedByName: string;
  planConfirmed?: boolean;
  planConfirmRemark?: string;
}) {
  const found = await resolveCompanyByCustomerToken("sign", input.token);
  if (!found) return { ok: false as const, error: "not_found" };
  const { companyId, snapshot } = found;
  const order = findOrderBySignToken(snapshot, input.token);
  if (!order?.contract) return { ok: false as const, error: "not_found" };
  const contract = normalizeContract(order.contract);
  if (!contract) return { ok: false as const, error: "invalid" };
  if (contract.signedAt || contract.offlineConfirmed) {
    return { ok: false as const, error: "already_signed" };
  }
  if (order.status !== "待签约") {
    return { ok: false as const, error: "invalid_status" };
  }
  if (!input.planConfirmed) {
    return { ok: false as const, error: "plan_not_confirmed" };
  }
  const trimmedName = input.signedByName.trim();
  if (trimmedName !== order.customerName.trim()) {
    return { ok: false as const, error: "name_mismatch" };
  }

  const at = new Date().toISOString();
  const nextContract: OrderContract = {
    ...contract,
    signedAt: at,
    signatureDataUrl: input.signatureDataUrl,
    signedByName: trimmedName,
    planConfirmed: true,
    planConfirmRemark: input.planConfirmRemark?.trim() || undefined,
    planConfirmedAt: at,
    signLocked: true,
  };

  let patched: Order | null = null;
  const orders = snapshot.orders.map((raw) => {
    const o = raw as Order;
    if (o.id !== order.id) return o;
    const intervalUpdates = applyStageIntervalOnAdvance(o, "已签约", at);
    patched = appendOrderEvent(
      {
        ...o,
        ...intervalUpdates,
        status: "已签约",
        contract: nextContract,
      },
      {
        kind: "客户签约",
        at,
        actorName: input.signedByName.trim() || "客户",
        fromStatus: "待签约",
        toStatus: "已签约",
      },
    );
    return patched;
  });

  if (!patched) return { ok: false as const, error: "patch_failed" };

  await writeAppSnapshot(companyId, {
    ...snapshot,
    version: snapshot.version + 1,
    updatedAt: at,
    orders,
  });

  return { ok: true as const, orderId: order.id };
}

export async function readAcceptPublicPayload(token: string) {
  const found = await resolveCompanyByCustomerToken("accept", token);
  if (!found) return null;
  const { snapshot } = found;
  const order = findOrderByAcceptToken(snapshot, token);
  if (!order?.acceptance) return null;
  const acceptance = normalizeAcceptance(order.acceptance);
  if (!acceptance) return null;
  const installation = normalizeInstallation(order.installation);
  return {
    orderId: order.id,
    customerName: resolveAcceptCustomerDisplayName(order),
    phone: order.phone,
    address: order.address,
    dispatchStore: order.dispatchStore,
    dispatcherName: order.dispatcherName,
    designer: order.designer,
    status: order.status,
    installation,
    acceptance,
    alreadyAccepted: Boolean(acceptance.acceptedAt || order.status === "已验收"),
  };
}

export async function submitCustomerAcceptance(input: {
  token: string;
  ratings: CustomerRatings;
  comment?: string;
  hasInstallIssue?: boolean;
}) {
  const found = await resolveCompanyByCustomerToken("accept", input.token);
  if (!found) return { ok: false as const, error: "not_found" };
  const { companyId, snapshot } = found;
  const order = findOrderByAcceptToken(snapshot, input.token);
  if (!order?.acceptance) return { ok: false as const, error: "not_found" };
  const acceptance = normalizeAcceptance(order.acceptance);
  if (!acceptance) return { ok: false as const, error: "invalid" };
  if (acceptance.acceptedAt || order.status === "已验收") {
    return { ok: false as const, error: "already_accepted" };
  }
  if (order.status !== "已安装") {
    return { ok: false as const, error: "invalid_status" };
  }
  if (input.hasInstallIssue) {
    return { ok: false as const, error: "install_issue" };
  }

  const at = new Date().toISOString();
  let patched: Order | null = null;
  const orders = snapshot.orders.map((raw) => {
    const o = raw as Order;
    if (o.id !== order.id) return o;
    const intervalUpdates = applyStageIntervalOnAdvance(o, "已验收", at);
    patched = appendOrderEvent(
      {
        ...o,
        ...intervalUpdates,
        status: "已验收",
        acceptance: {
          ...acceptance,
          acceptedAt: at,
          ratings: input.ratings,
          ratedPersons: buildRatedPersonsSnapshot(order),
          comment: input.comment?.trim() || undefined,
          hasInstallIssue: false,
        },
      },
      {
        kind: "客户验收",
        at,
        actorName: "客户",
        fromStatus: "已安装",
        toStatus: "已验收",
        note: `均分 ${(
          (input.ratings.salesManager +
            input.ratings.designer +
            input.ratings.installTeam +
            input.ratings.product) /
          4
        ).toFixed(1)} 星`,
      },
    );
    for (const remark of buildAcceptanceBadReviewRemarks(input.ratings)) {
      patched = appendWorkflowRemark(patched, "已验收", remark);
    }
    return patched;
  });

  if (!patched) return { ok: false as const, error: "patch_failed" };

  await writeAppSnapshot(companyId, {
    ...snapshot,
    version: snapshot.version + 1,
    updatedAt: at,
    orders,
  });

  return { ok: true as const, orderId: order.id };
}

export { findOrderBySignToken, findOrderByAcceptToken, patchOrders };
