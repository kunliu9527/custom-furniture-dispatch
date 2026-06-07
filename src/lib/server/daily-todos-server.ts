import { formatDailyTodosText } from "@/lib/daily-todos";
import type { Order } from "@/lib/types";
import { readAppSnapshot } from "./app-store";

export async function generateDailyTodosTextFromSnapshot(): Promise<{
  text: string;
  dateId: string;
  dateLabel: string;
}> {
  const snapshot = await readAppSnapshot();
  const orders = snapshot.orders as Order[];
  const now = new Date();
  const dateId = now.toISOString().slice(0, 10);
  const dateLabel = now.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  return {
    text: formatDailyTodosText(orders, now),
    dateId,
    dateLabel,
  };
}
