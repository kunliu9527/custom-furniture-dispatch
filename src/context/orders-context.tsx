"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/auth-context";
import { findDuplicateAddressOrder } from "@/lib/address-unique";
import {
  fetchLocalDevSnapshot,
  isLocalOrdersCacheEmpty,
} from "@/lib/local-snapshot-bootstrap";
import { STORAGE_KEY, LEGACY_STORAGE_KEYS } from "@/lib/constants";
import {
  createCustomerToken,
  normalizeAcceptance,
  normalizeContract,
  normalizeInstallation,
  resolveAcceptCustomerDisplayName,
} from "@/lib/customer-flow";
import { normalizeIssueTags } from "@/lib/issue-tags";
import { INITIAL_DATA } from "@/lib/initial-data";
import { appendOrderEvent, normalizeOrderEvents } from "@/lib/order-events";
import { normalizeMeasurement } from "@/lib/measure/normalize";
import type { OrderMeasurement } from "@/lib/measure/types";
import {
  countDesignerInProgress,
  DESIGNER_MAX_IN_PROGRESS,
  isDispatchBlocked,
} from "@/lib/designer-load";
import { normalizeBudget, normalizeSpaces } from "@/lib/order-format";
import {
  getNextStatus,
  getPreviousStatus,
  canMarkPendingRefund,
  isSupplementEligibleOrder,
} from "@/lib/order-utils";
import { normalizeSupplements } from "@/lib/supplement-utils";
import { normalizeTransferRecords } from "@/lib/transfer-utils";
import {
  appendWorkflowRemark,
  createWorkflowRemarkEntry,
  normalizeWorkflowRemarkEntries,
  reconcileOrderBusinessRules,
  sortWorkflowRemarks,
} from "@/lib/workflow-remarks";
import {
  applyStageIntervalOnAdvance,
  applyStageIntervalOnRevert,
  normalizeStageIntervalDays,
  normalizeStatusEnteredAt,
} from "@/lib/stage-intervals";
import {
  ensureSnapshotCacheReady,
  patchSnapshotCache,
  subscribeSnapshot,
} from "@/lib/snapshot-cache";
import { applyDepositUpdate, normalizeDepositAmount } from "@/lib/deposit-rules";
import { createShortId } from "@/lib/create-id";
import { isRemoteSyncEnabled } from "@/lib/sync-config";
import type {
  DesignerName,
  DispatchFormData,
  FlowOrderStatus,
  Order,
  OrderContract,
  OrderEventKind,
  OrderIssueTag,
  SupplementOrder,
  WorkflowRemarkStage,
} from "@/lib/types";
import type { InitiateContractInput } from "@/components/orders/contract-panel";

export interface AdvanceOrderOptions {
  orderAmount?: number;
  remark?: string;
}

function parseAdvanceOptions(
  arg?: number | AdvanceOrderOptions,
): AdvanceOrderOptions {
  if (typeof arg === "number") return { orderAmount: arg };
  return arg ?? {};
}

interface OrdersContextValue {
  orders: Order[];
  supplements: SupplementOrder[];
  addOrder: (data: DispatchFormData) => void;
  advanceOrderStatus: (
    id: string,
    options?: number | AdvanceOrderOptions,
  ) => boolean;
  addWorkflowRemark: (id: string, text: string, stage?: WorkflowRemarkStage) => void;
  revertOrderStatus: (id: string) => boolean;
  markPendingRefund: (
    id: string,
    remark?: string,
    issueTags?: OrderIssueTag[],
  ) => boolean;
  confirmRefund: (
    id: string,
    remark?: string,
    issueTags?: OrderIssueTag[],
  ) => boolean;
  reassignOrder: (id: string, designer: DesignerName) => void;
  assignDesignerToOrder: (
    id: string,
    designer: DesignerName,
    forceOverCapacity?: boolean,
  ) => boolean;
  initiateContract: (id: string, input: InitiateContractInput) => void;
  updateOrderDeposit: (id: string, deposit: number) => void;
  skipElectronicSign: (id: string) => void;
  offlineSignContract: (id: string, depositPaid?: number) => void;
  confirmContractOffline: (id: string) => void;
  initiateAcceptance: (id: string) => void;
  skipElectronicAcceptance: (id: string) => void;
  confirmDesignerAccept: (id: string) => boolean;
  saveOrderMeasurement: (id: string, measurement: OrderMeasurement) => void;
  setOrderIssueTags: (id: string, tags: OrderIssueTag[]) => void;
  addSupplementOrder: (
    parentOrderId: string,
    supplementAmount: number,
    designer: DesignerName,
  ) => void;
  setAfterSalesAmount: (orderId: string, amount: number | null) => void;
  deleteOrder: (orderId: string) => void;
  isHydrated: boolean;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

function normalizeOrder(raw: Record<string, unknown>): Order {
  const legacySpace =
    typeof raw.space === "string" ? raw.space : undefined;
  const rawDesigner = raw.designer;
  const designer =
    typeof rawDesigner === "string" && rawDesigner.trim()
      ? (rawDesigner as Order["designer"])
      : null;
  const rawOriginal = raw.originalDesigner;
  const originalDesigner =
    typeof rawOriginal === "string" && rawOriginal.trim()
      ? (rawOriginal as Order["originalDesigner"])
      : designer;
  const transferRecords = normalizeTransferRecords(raw.transferRecords);
  const status = raw.status as Order["status"];
  let workflowRemarks = normalizeWorkflowRemarkEntries(raw.workflowRemarks);
  const legacyRemark =
    typeof raw.workflowRemark === "string" ? raw.workflowRemark.trim() : "";
  if (legacyRemark && workflowRemarks.length === 0) {
    workflowRemarks = [
      createWorkflowRemarkEntry(status, legacyRemark, String(raw.createdAt ?? "")),
    ];
  }

  const order: Order = {
    id: String(raw.id ?? ""),
    customerName: String(raw.customerName ?? ""),
    phone: String(raw.phone ?? ""),
    address: String(raw.address ?? ""),
    spaces: normalizeSpaces(raw.spaces, legacySpace),
    budget: normalizeBudget(raw.budget),
    dispatchStore: raw.dispatchStore as Order["dispatchStore"],
    deposit: Number(raw.deposit) || 0,
    preMeasureDeposit: Boolean(raw.preMeasureDeposit),
    depositUpdatedAt:
      typeof raw.depositUpdatedAt === "string" ? raw.depositUpdatedAt : undefined,
    orderAmount:
      raw.orderAmount != null && Number(raw.orderAmount) > 0
        ? Number(raw.orderAmount)
        : null,
    afterSalesAmount:
      raw.afterSalesAmount != null && Number(raw.afterSalesAmount) > 0
        ? Number(raw.afterSalesAmount)
        : null,
    dispatcherName: String(raw.dispatcherName ?? ""),
    originalDesigner,
    designer,
    transferRecords,
    status,
    workflowRemark: legacyRemark || null,
    workflowRemarks: sortWorkflowRemarks(workflowRemarks),
    statusEnteredAt: normalizeStatusEnteredAt(raw.statusEnteredAt),
    stageIntervalDays: normalizeStageIntervalDays(raw.stageIntervalDays),
    totalElapsedDays:
      raw.totalElapsedDays != null && Number.isFinite(Number(raw.totalElapsedDays))
        ? Number(raw.totalElapsedDays)
        : null,
    designerAcceptedAt:
      typeof raw.designerAcceptedAt === "string"
        ? raw.designerAcceptedAt
        : null,
    measurement: normalizeMeasurement(raw.measurement),
    orderEvents: normalizeOrderEvents(raw.orderEvents),
    issueTags: normalizeIssueTags(raw.issueTags),
    contract: normalizeContract(raw.contract),
    installation: normalizeInstallation(raw.installation),
    acceptance: normalizeAcceptance(raw.acceptance),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
  return reconcileOrderBusinessRules(order);
}

function withEvent(
  order: Order,
  actorName: string,
  kind: OrderEventKind,
  extra?: {
    fromStatus?: Order["status"];
    toStatus?: Order["status"];
    note?: string;
  },
): Order {
  return appendOrderEvent(order, {
    kind,
    at: new Date().toISOString(),
    actorName,
    ...extra,
  });
}

const LEGACY_STORAGE_KEY = LEGACY_STORAGE_KEYS[0];

function loadData(): { orders: Order[]; supplements: SupplementOrder[] } {
  if (typeof window === "undefined") {
    return { orders: INITIAL_DATA.orders, supplements: INITIAL_DATA.supplements };
  }
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        raw = localStorage.getItem(legacyKey);
        if (raw) break;
      }
    }
    if (!raw) return INITIAL_DATA;
    const parsed = JSON.parse(raw) as {
      orders?: unknown[];
      supplements?: unknown[];
    };
    const orders = Array.isArray(parsed.orders)
      ? parsed.orders.map((o) => normalizeOrder(o as Record<string, unknown>))
      : INITIAL_DATA.orders;
    const supplements = normalizeSupplements(parsed.supplements);
    if (orders.length === 0) {
      return INITIAL_DATA;
    }
    return { orders, supplements };
  } catch {
    return INITIAL_DATA;
  }
}

function persistData(orders: Order[], supplements: SupplementOrder[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ orders, supplements }),
    );
  } catch (err) {
    console.warn("[orders] localStorage 写入失败", err);
  }
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { user, siteBranding } = useAuth();
  const actorRef = useRef("系统");
  const [orders, setOrders] = useState<Order[]>(INITIAL_DATA.orders);
  const [supplements, setSupplements] = useState<SupplementOrder[]>(
    INITIAL_DATA.supplements,
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const applyingRemoteRef = useRef(false);
  const remoteReadyRef = useRef(false);

  useEffect(() => {
    actorRef.current = user?.displayName ?? "系统";
  }, [user?.displayName]);

  useEffect(() => {
    if (!isRemoteSyncEnabled()) {
      let cancelled = false;

      async function loadLocal() {
        let data = loadData();

        if (isLocalOrdersCacheEmpty() || data.orders.length === 0) {
          const snap = await fetchLocalDevSnapshot();
          if (cancelled) return;
          if (snap && Array.isArray(snap.orders) && snap.orders.length > 0) {
            data = {
              orders: snap.orders.map((o) =>
                normalizeOrder(o as unknown as Record<string, unknown>),
              ),
              supplements: normalizeSupplements(snap.supplements),
            };
            persistData(data.orders, data.supplements);
          } else if (data.orders.length === 0) {
            data = {
              orders: INITIAL_DATA.orders,
              supplements: INITIAL_DATA.supplements,
            };
          }
        }

        if (cancelled) return;
        setOrders(data.orders);
        setSupplements(data.supplements);
        setIsHydrated(true);
      }

      void loadLocal();
      return () => {
        cancelled = true;
      };
    }

    let cancelled = false;
    void ensureSnapshotCacheReady()
      .then((snap) => {
        if (cancelled || !snap) return;
        applyingRemoteRef.current = true;
        setOrders(
          snap.orders.map((o) =>
            normalizeOrder(o as unknown as Record<string, unknown>),
          ),
        );
        setSupplements(normalizeSupplements(snap.supplements));
        queueMicrotask(() => {
          applyingRemoteRef.current = false;
        });
        remoteReadyRef.current = true;
        setIsHydrated(true);
      })
      .catch(() => {
        if (cancelled) return;
        const data = loadData();
        setOrders(data.orders);
        setSupplements(data.supplements);
        remoteReadyRef.current = true;
        setIsHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isRemoteSyncEnabled()) return;
    return subscribeSnapshot((snap) => {
      applyingRemoteRef.current = true;
      setOrders(
        snap.orders.map((o) =>
          normalizeOrder(o as unknown as Record<string, unknown>),
        ),
      );
      setSupplements(normalizeSupplements(snap.supplements));
      queueMicrotask(() => {
        applyingRemoteRef.current = false;
      });
    });
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (isRemoteSyncEnabled()) {
      if (!remoteReadyRef.current || applyingRemoteRef.current) return;
      patchSnapshotCache({ orders, supplements });
      return;
    }
    persistData(orders, supplements);
  }, [orders, supplements, isHydrated]);

  const addOrder = useCallback((data: DispatchFormData) => {
    const isDispatched = data.designer != null;
    if (isDispatched) {
      const inProgress = countDesignerInProgress(orders, data.designer!);
      if (isDispatchBlocked(inProgress) && !data.forceOverCapacity) {
        return;
      }
    }
    const duplicate = findDuplicateAddressOrder(orders, data.address);
    if (duplicate && !data.forceDuplicateAddress) {
      return;
    }
    const actor = actorRef.current;
    const remarks = [];
    const dispatchNote = data.dispatchRemark?.trim();
    if (dispatchNote) {
      remarks.push(createWorkflowRemarkEntry("派单录入", dispatchNote));
    }
    const createdAt = new Date().toISOString();
    const status = isDispatched ? "待量尺" : "未派单";
    let order: Order = {
      id: createShortId("ord-"),
      customerName: data.customerName,
      phone: data.phone,
      address: data.address,
      spaces: data.spaces.length > 0 ? data.spaces : ["全屋"],
      budget: data.budget,
      dispatchStore: data.dispatchStore,
      deposit: data.deposit,
      dispatcherName: data.dispatcherName,
      designer: isDispatched ? data.designer : null,
      originalDesigner: isDispatched ? data.designer : null,
      transferRecords: [],
      status,
      orderAmount: null,
      afterSalesAmount: null,
      workflowRemark: null,
      workflowRemarks: remarks,
      statusEnteredAt: isDispatched
        ? { 待量尺: createdAt }
        : { 未派单: createdAt },
      designerAcceptedAt: null,
      orderEvents: [],
      issueTags: [],
      createdAt,
    };
    const inProgress = data.designer
      ? countDesignerInProgress(orders, data.designer)
      : 0;
    order = withEvent(order, actor, "派单录入", {
      toStatus: status,
      note: isDispatched
        ? data.forceOverCapacity
          ? `指派 ${data.designer}（超额，在途 ${inProgress}/${DESIGNER_MAX_IN_PROGRESS}）`
          : `指派 ${data.designer}`
        : "仅录信息，待指派设计师",
    });
    setOrders((prev) => [reconcileOrderBusinessRules(order), ...prev]);
  }, [orders]);

  const assignDesignerToOrder = useCallback(
    (id: string, designer: DesignerName, forceOverCapacity = false) => {
      const inProgress = countDesignerInProgress(orders, designer);
      if (isDispatchBlocked(inProgress) && !forceOverCapacity) {
        return false;
      }
      let changed = false;
      const at = new Date().toISOString();
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== id || order.status !== "未派单") return order;
          let updated: Order = {
            ...order,
            designer,
            originalDesigner: designer,
            status: "待量尺",
            designerAcceptedAt: null,
            statusEnteredAt: {
              ...order.statusEnteredAt,
              待量尺: at,
            },
          };
          updated = withEvent(updated, actorRef.current, "指派设计师", {
            fromStatus: "未派单",
            toStatus: "待量尺",
            note: forceOverCapacity
              ? `指派 ${designer}（超额，在途 ${inProgress}/${DESIGNER_MAX_IN_PROGRESS}）`
              : `指派 ${designer}`,
          });
          changed = true;
          return reconcileOrderBusinessRules(updated);
        }),
      );
      return changed;
    },
    [orders],
  );

  const initiateContract = useCallback(
    (id: string, input: InitiateContractInput) => {
      const at = new Date().toISOString();
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== id || order.status !== "待签约") return order;
          const attachments = input.attachmentNames
            ? input.attachmentNames
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean)
                .map((name) => ({ name }))
            : undefined;
          const token =
            order.contract?.token ?? createCustomerToken("sg");
          const depositPaid = normalizeDepositAmount(
            input.depositPaid ?? order.deposit,
          );
          const contract: OrderContract = {
            token,
            contractAmount: input.contractAmount,
            depositPaid,
            deliveryDate: input.deliveryDate,
            attachments,
            termsNote: input.termsNote,
            standardContractText: siteBranding.standardContractText,
            initiatedAt: at,
            initiatedBy: actorRef.current,
            signedAt: order.contract?.signedAt,
            signatureDataUrl: order.contract?.signatureDataUrl,
            signedByName: order.contract?.signedByName,
            offlineConfirmed: order.contract?.offlineConfirmed,
            planConfirmed: order.contract?.planConfirmed,
            planConfirmRemark: order.contract?.planConfirmRemark,
            planConfirmedAt: order.contract?.planConfirmedAt,
            skippedElectronicSign: order.contract?.skippedElectronicSign,
            signLocked: order.contract?.signLocked,
          };
          let updated: Order = applyDepositUpdate(
            { ...order, contract },
            depositPaid,
          );
          updated = withEvent(updated, actorRef.current, "发起签约", {
            toStatus: "待签约",
            note: `合同 ¥${input.contractAmount.toLocaleString("zh-CN")} · 定金 ¥${depositPaid.toLocaleString("zh-CN")}`,
          });
          return reconcileOrderBusinessRules(updated);
        }),
      );
    },
    [siteBranding.standardContractText],
  );

  const updateOrderDeposit = useCallback((id: string, deposit: number) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== id) return order;
        const updated = applyDepositUpdate(order, deposit);
        return reconcileOrderBusinessRules(
          withEvent(updated, actorRef.current, "流程备注", {
            note: `更新定金 ¥${normalizeDepositAmount(deposit).toLocaleString("zh-CN")}`,
          }),
        );
      }),
    );
  }, []);

  const offlineSignContract = useCallback((id: string, depositPaid = 0) => {
    const at = new Date().toISOString();
    const paid = normalizeDepositAmount(depositPaid);
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== id || order.status !== "待签约") return order;
        const token = order.contract?.token ?? createCustomerToken("sg");
        const contract: OrderContract = {
          ...(order.contract ?? {
            token,
            contractAmount: 0,
            initiatedAt: at,
          }),
          token,
          contractAmount: 0,
          depositPaid: paid,
          initiatedAt: order.contract?.initiatedAt ?? at,
          initiatedBy: actorRef.current,
          offlineConfirmed: true,
          signLocked: true,
          signedAt: at,
          skippedElectronicSign: false,
        };
        const intervalUpdates = applyStageIntervalOnAdvance(
          applyDepositUpdate(order, paid),
          "已签约",
          at,
        );
        let updated: Order = {
          ...applyDepositUpdate(order, paid),
          ...intervalUpdates,
          status: "已签约",
          contract,
        };
        updated = withEvent(updated, actorRef.current, "线下签约", {
          fromStatus: "待签约",
          toStatus: "已签约",
          note: "线下签约，合同金额未填",
        });
        return reconcileOrderBusinessRules(updated);
      }),
    );
  }, []);

  /** @deprecated 使用 offlineSignContract */
  const skipElectronicSign = useCallback(
    (id: string) => {
      offlineSignContract(id);
    },
    [offlineSignContract],
  );

  const confirmContractOffline = useCallback(
    (id: string) => {
      offlineSignContract(id);
    },
    [offlineSignContract],
  );

  const skipElectronicAcceptance = useCallback((id: string) => {
    const at = new Date().toISOString();
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== id || order.status !== "已安装") return order;
        const token =
          order.acceptance?.token ?? createCustomerToken("ac");
        const intervalUpdates = applyStageIntervalOnAdvance(
          order,
          "已验收",
          at,
        );
        let updated: Order = {
          ...order,
          ...intervalUpdates,
          status: "已验收",
          acceptance: {
            token,
            initiatedAt: order.acceptance?.initiatedAt ?? at,
            acceptedAt: at,
            skippedElectronicAccept: true,
          },
        };
        updated = withEvent(updated, actorRef.current, "跳过电子验收", {
          fromStatus: "已安装",
          toStatus: "已验收",
          note: "无电子验收直接更新",
        });
        return reconcileOrderBusinessRules(updated);
      }),
    );
  }, []);

  const initiateAcceptance = useCallback((id: string) => {
    const at = new Date().toISOString();
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== id || order.status !== "已安装") return order;
        const token =
          order.acceptance?.token ?? createCustomerToken("ac");
        let updated: Order = {
          ...order,
          acceptance: {
            token,
            initiatedAt: at,
            acceptedAt: order.acceptance?.acceptedAt,
            ratings: order.acceptance?.ratings,
            comment: order.acceptance?.comment,
            customerDisplayName: (() => {
              const name =
                order.acceptance?.customerDisplayName?.trim() ||
                resolveAcceptCustomerDisplayName(order);
              return name || undefined;
            })(),
          },
        };
        updated = withEvent(updated, actorRef.current, "发起验收", {
          toStatus: "已安装",
          note: "已生成客户验收码",
        });
        return updated;
      }),
    );
  }, []);

  const addWorkflowRemarkToOrder = useCallback(
    (id: string, text: string, stage?: WorkflowRemarkStage) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== id) return order;
          const remarkStage = stage ?? (order.status as WorkflowRemarkStage);
          const updated = appendWorkflowRemark(order, remarkStage, trimmed);
          return withEvent(updated, actorRef.current, "流程备注", {
            note: trimmed,
            toStatus: remarkStage as Order["status"],
          });
        }),
      );
    },
    [],
  );

  const advanceOrderStatus = useCallback(
    (id: string, arg?: number | AdvanceOrderOptions) => {
      const { orderAmount, remark } = parseAdvanceOptions(arg);
      let changed = false;
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== id) return order;
          const next = getNextStatus(order.status);
          if (!next) return order;
          let updated = order;
          if (remark?.trim()) {
            updated = appendWorkflowRemark(updated, next, remark.trim());
          }
          const atIso = new Date().toISOString();
          const intervalUpdates = applyStageIntervalOnAdvance(
            order,
            next,
            atIso,
          );
          const actor = actorRef.current;
          if (next === "已下单") {
            const amount = orderAmount ?? 0;
            if (amount <= 0) return order;
            const nextOrder = {
              ...updated,
              ...intervalUpdates,
              status: next,
              orderAmount: amount,
            };
            changed = true;
            return withEvent(nextOrder, actor, "状态推进", {
              fromStatus: order.status,
              toStatus: next,
              note: `下单 ¥${amount.toLocaleString("zh-CN")}`,
            });
          }
          if (next === "已安装") {
            const nextOrder = {
              ...updated,
              ...intervalUpdates,
              status: next,
              installation: {
                ...order.installation,
                installedAt: order.installation?.installedAt ?? atIso,
              },
            };
            changed = true;
            return withEvent(nextOrder, actor, "状态推进", {
              fromStatus: order.status,
              toStatus: next,
              note: "推进至已安装",
            });
          }
          const nextOrder = { ...updated, ...intervalUpdates, status: next };
          changed = true;
          return withEvent(nextOrder, actor, "状态推进", {
            fromStatus: order.status,
            toStatus: next,
          });
        }),
      );
      return changed;
    },
    [],
  );

  const revertOrderStatus = useCallback((id: string) => {
    let changed = false;
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== id) return order;
        const prevStatus = getPreviousStatus(order.status);
        if (!prevStatus) return order;
        const revertedFromStatus = order.status as FlowOrderStatus;
        const intervalUpdates = applyStageIntervalOnRevert(
          order,
          revertedFromStatus,
        );
        const updates: Partial<Order> = {
          status: prevStatus,
          ...intervalUpdates,
        };
        if (order.status === "已下单") {
          updates.orderAmount = null;
        }
        const revertedFrom = order.revertedFromStatuses ?? [];
        if (!revertedFrom.includes(order.status)) {
          updates.revertedFromStatuses = [...revertedFrom, order.status];
        }
        const reverted = { ...order, ...updates };
        changed = true;
        return withEvent(reverted, actorRef.current, "状态撤回", {
          fromStatus: revertedFromStatus,
          toStatus: prevStatus,
        });
      }),
    );
    return changed;
  }, []);

  const markPendingRefund = useCallback(
    (id: string, remark?: string, issueTags?: OrderIssueTag[]) => {
      let changed = false;
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== id) return order;
          if (!canMarkPendingRefund(order.status)) return order;
          let updated: Order = {
            ...order,
            status: "待退单",
            issueTags: issueTags?.length ? issueTags : order.issueTags,
          };
          if (remark?.trim()) {
            updated = appendWorkflowRemark(updated, "待退单", remark.trim());
          }
          changed = true;
          return withEvent(updated, actorRef.current, "待退单", {
            fromStatus: order.status,
            toStatus: "待退单",
          });
        }),
      );
      return changed;
    },
  []);

  const confirmRefund = useCallback(
    (id: string, remark?: string, issueTags?: OrderIssueTag[]) => {
      let changed = false;
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== id || order.status !== "待退单") return order;
          let updated: Order = {
            ...order,
            status: "已退单",
            issueTags: issueTags?.length ? issueTags : order.issueTags,
          };
          if (remark?.trim()) {
            updated = appendWorkflowRemark(updated, "已退单", remark.trim());
          }
          changed = true;
          return withEvent(updated, actorRef.current, "已退单", {
            fromStatus: "待退单",
            toStatus: "已退单",
          });
        }),
      );
      return changed;
    },
    [],
  );

  const reassignOrder = useCallback((id: string, designer: DesignerName) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== id || order.designer === designer || !order.designer) {
          return order;
        }
        const note = `转派：${order.designer}→${designer}`;
        const reassigned = appendWorkflowRemark(
          {
            ...order,
            designer,
            designerAcceptedAt: null,
            transferRecords: [
              ...order.transferRecords,
              {
                id: createShortId("tr-"),
                fromDesigner: order.designer,
                toDesigner: designer,
                transferredAt: new Date().toISOString(),
              },
            ],
          },
          order.status as WorkflowRemarkStage,
          note,
        );
        return withEvent(reassigned, actorRef.current, "转派", {
          note,
          toStatus: order.status,
        });
      }),
    );
  }, []);

  const confirmDesignerAccept = useCallback((id: string) => {
    let changed = false;
    const at = new Date().toISOString();
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== id) return order;
        if (order.status !== "待量尺" || order.designerAcceptedAt) return order;
        const updated = {
          ...order,
          designerAcceptedAt: at,
        };
        changed = true;
        return withEvent(updated, actorRef.current, "接单确认", {
          toStatus: "待量尺",
        });
      }),
    );
    return changed;
  }, []);

  const saveOrderMeasurement = useCallback(
    (id: string, measurement: OrderMeasurement) => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== id) return order;
          const updated = {
            ...order,
            measurement,
          };
          return withEvent(updated, actorRef.current, "量尺记录", {
            note: `${measurement.photos.length} 张照片`,
          });
        }),
      );
    },
    [],
  );

  const setOrderIssueTags = useCallback((id: string, tags: OrderIssueTag[]) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== id) return order;
        const normalized = normalizeIssueTags(tags);
        const updated = { ...order, issueTags: normalized };
        if (normalized.join() === (order.issueTags ?? []).join()) return order;
        return withEvent(updated, actorRef.current, "问题标记", {
          note: normalized.join("、"),
          toStatus: order.status,
        });
      }),
    );
  }, []);

  const addSupplementOrder = useCallback(
    (
      parentOrderId: string,
      supplementAmount: number,
      designer: DesignerName,
    ) => {
      if (supplementAmount <= 0) return;
      const parent = orders.find((o) => o.id === parentOrderId);
      if (!parent || !isSupplementEligibleOrder(parent)) return;
      const supplement: SupplementOrder = {
        id: createShortId("sup-"),
        parentOrderId,
        customerName: parent.customerName,
        designer,
        supplementAmount,
        status: "已下单",
        createdAt: new Date().toISOString(),
      };
      setSupplements((prev) => [supplement, ...prev]);
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== parentOrderId) return o;
          const noted = appendWorkflowRemark(
            o,
            "已下单",
            `增补单 ¥${supplementAmount.toLocaleString("zh-CN")}`,
          );
          return withEvent(noted, actorRef.current, "增补单", {
            note: `¥${supplementAmount.toLocaleString("zh-CN")}`,
            toStatus: "已下单",
          });
        }),
      );
    },
    [orders],
  );

  const setAfterSalesAmount = useCallback(
    (orderId: string, amount: number | null) => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          const normalized =
            amount != null && Number.isFinite(amount) && amount > 0
              ? amount
              : null;
          let updated: Order = { ...order, afterSalesAmount: normalized };
          if (normalized != null) {
            updated = appendWorkflowRemark(
              updated,
              "已下单",
              `售后金 ${normalized.toLocaleString("zh-CN")} 元`,
            );
            return withEvent(updated, actorRef.current, "售后金", {
              note: `${normalized.toLocaleString("zh-CN")} 元`,
              toStatus: "已下单",
            });
          }
          return updated;
        }),
      );
    },
    [],
  );

  const deleteOrder = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
    setSupplements((prev) =>
      prev.filter((supplement) => supplement.parentOrderId !== orderId),
    );
  }, []);

  const value = useMemo(
    () => ({
      orders,
      supplements,
      addOrder,
      advanceOrderStatus,
      addWorkflowRemark: addWorkflowRemarkToOrder,
      revertOrderStatus,
      markPendingRefund,
      confirmRefund,
      reassignOrder,
      assignDesignerToOrder,
      initiateContract,
      updateOrderDeposit,
      skipElectronicSign,
      offlineSignContract,
      confirmContractOffline,
      initiateAcceptance,
      skipElectronicAcceptance,
      confirmDesignerAccept,
      saveOrderMeasurement,
      setOrderIssueTags,
      addSupplementOrder,
      setAfterSalesAmount,
      deleteOrder,
      isHydrated,
    }),
    [
      orders,
      supplements,
      addOrder,
      advanceOrderStatus,
      addWorkflowRemarkToOrder,
      revertOrderStatus,
      markPendingRefund,
      confirmRefund,
      reassignOrder,
      assignDesignerToOrder,
      initiateContract,
      updateOrderDeposit,
      skipElectronicSign,
      offlineSignContract,
      confirmContractOffline,
      initiateAcceptance,
      skipElectronicAcceptance,
      confirmDesignerAccept,
      saveOrderMeasurement,
      setOrderIssueTags,
      addSupplementOrder,
      setAfterSalesAmount,
      deleteOrder,
    ],
  );

  return (
    <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) {
    throw new Error("useOrders must be used within OrdersProvider");
  }
  return ctx;
}
