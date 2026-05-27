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
import { STORAGE_KEY } from "@/lib/constants";
import { INITIAL_DATA } from "@/lib/initial-data";
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
import { isRemoteSyncEnabled } from "@/lib/sync-config";
import type {
  DesignerName,
  DispatchFormData,
  FlowOrderStatus,
  Order,
  SupplementOrder,
  WorkflowRemarkStage,
} from "@/lib/types";

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
  ) => void;
  addWorkflowRemark: (id: string, text: string, stage?: WorkflowRemarkStage) => void;
  revertOrderStatus: (id: string) => void;
  markPendingRefund: (id: string, remark?: string) => void;
  confirmRefund: (id: string, remark?: string) => void;
  reassignOrder: (id: string, designer: DesignerName) => void;
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
  const designer = raw.designer as Order["designer"];
  const originalDesigner = (raw.originalDesigner ??
    designer) as Order["originalDesigner"];
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
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
  return reconcileOrderBusinessRules(order);
}

function loadData(): { orders: Order[]; supplements: SupplementOrder[] } {
  if (typeof window === "undefined") {
    return { orders: INITIAL_DATA.orders, supplements: INITIAL_DATA.supplements };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_DATA;
    const parsed = JSON.parse(raw) as {
      orders?: unknown[];
      supplements?: unknown[];
    };
    const orders = Array.isArray(parsed.orders)
      ? parsed.orders.map((o) => normalizeOrder(o as Record<string, unknown>))
      : INITIAL_DATA.orders;
    const supplements = normalizeSupplements(parsed.supplements);
    return { orders, supplements };
  } catch {
    return INITIAL_DATA;
  }
}

function persistData(orders: Order[], supplements: SupplementOrder[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ orders, supplements }),
  );
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(INITIAL_DATA.orders);
  const [supplements, setSupplements] = useState<SupplementOrder[]>(
    INITIAL_DATA.supplements,
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const applyingRemoteRef = useRef(false);
  const remoteReadyRef = useRef(false);

  useEffect(() => {
    if (!isRemoteSyncEnabled()) {
      const data = loadData();
      setOrders(data.orders);
      setSupplements(data.supplements);
      setIsHydrated(true);
      return;
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
    const remarks = [];
    const dispatchNote = data.dispatchRemark?.trim();
    if (dispatchNote) {
      remarks.push(createWorkflowRemarkEntry("派单录入", dispatchNote));
    }
    const createdAt = new Date().toISOString();
    const order: Order = {
      id: `ord-${crypto.randomUUID().slice(0, 8)}`,
      customerName: data.customerName,
      phone: data.phone,
      address: data.address,
      spaces: data.spaces.length > 0 ? data.spaces : ["全屋"],
      budget: data.budget,
      dispatchStore: data.dispatchStore,
      deposit: data.deposit,
      dispatcherName: data.dispatcherName,
      designer: data.designer,
      originalDesigner: data.designer,
      transferRecords: [],
      status: "待量尺",
      orderAmount: null,
      afterSalesAmount: null,
      workflowRemark: null,
      workflowRemarks: remarks,
      statusEnteredAt: { 待量尺: createdAt },
      createdAt,
    };
    setOrders((prev) => [reconcileOrderBusinessRules(order), ...prev]);
  }, []);

  const addWorkflowRemarkToOrder = useCallback(
    (id: string, text: string, stage?: WorkflowRemarkStage) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== id) return order;
          const remarkStage = stage ?? (order.status as WorkflowRemarkStage);
          return appendWorkflowRemark(order, remarkStage, trimmed);
        }),
      );
    },
    [],
  );

  const advanceOrderStatus = useCallback(
    (id: string, arg?: number | AdvanceOrderOptions) => {
      const { orderAmount, remark } = parseAdvanceOptions(arg);
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
          if (next === "已下单") {
            const amount = orderAmount ?? 0;
            if (amount <= 0) return order;
            return {
              ...updated,
              ...intervalUpdates,
              status: next,
              orderAmount: amount,
            };
          }
          return { ...updated, ...intervalUpdates, status: next };
        }),
      );
    },
    [],
  );

  const revertOrderStatus = useCallback((id: string) => {
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
        return { ...order, ...updates };
      }),
    );
  }, []);

  const markPendingRefund = useCallback((id: string, remark?: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== id) return order;
        if (!canMarkPendingRefund(order.status)) return order;
        let updated: Order = { ...order, status: "待退单" };
        if (remark?.trim()) {
          updated = appendWorkflowRemark(updated, "待退单", remark.trim());
        }
        return updated;
      }),
    );
  }, []);

  const confirmRefund = useCallback((id: string, remark?: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== id || order.status !== "待退单") return order;
        let updated: Order = { ...order, status: "已退单" };
        if (remark?.trim()) {
          updated = appendWorkflowRemark(updated, "已退单", remark.trim());
        }
        return updated;
      }),
    );
  }, []);

  const reassignOrder = useCallback((id: string, designer: DesignerName) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== id || order.designer === designer) return order;
        const note = `转派：${order.designer}→${designer}`;
        return appendWorkflowRemark(
          {
            ...order,
            designer,
            transferRecords: [
              ...order.transferRecords,
              {
                id: `tr-${crypto.randomUUID().slice(0, 8)}`,
                fromDesigner: order.designer,
                toDesigner: designer,
                transferredAt: new Date().toISOString(),
              },
            ],
          },
          order.status as WorkflowRemarkStage,
          note,
        );
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
        id: `sup-${crypto.randomUUID().slice(0, 8)}`,
        parentOrderId,
        customerName: parent.customerName,
        designer,
        supplementAmount,
        status: "已下单",
        createdAt: new Date().toISOString(),
      };
      setSupplements((prev) => [supplement, ...prev]);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === parentOrderId
            ? appendWorkflowRemark(
                o,
                "已下单",
                `增补单 ¥${supplementAmount.toLocaleString("zh-CN")}`,
              )
            : o,
        ),
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
