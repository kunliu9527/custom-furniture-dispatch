import { INITIAL_ORDERS } from "./mock-data";
import type { AppPersistedData, SupplementOrder } from "./types";

export const INITIAL_SUPPLEMENTS: SupplementOrder[] = [
  {
    "id": "sup-0001",
    "parentOrderId": "ord-0001",
    "customerName": "伊景园1-801（客户增补）",
    "designer": "刘鑫",
    "supplementAmount": 258,
    "status": "已下单",
    "createdAt": "2026-01-31T16:00:00.000Z"
  }
];

export const INITIAL_DATA: AppPersistedData = {
  orders: INITIAL_ORDERS,
  supplements: INITIAL_SUPPLEMENTS,
};
