import { loadStaffConfigFromBrowser, persistStaffConfigToLocalStorage } from "./auth-staff-config";
import { writeFreshOrdersLocalStorage } from "./clear-client-app-data";
import { downloadCsv, stampForFilename } from "./csv-utils";
import type { AppSnapshot } from "./server/snapshot-types";
import { normalizeSnapshot } from "./server/snapshot-normalize";
import type { AppPersistedData } from "./types";

function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function buildAppBackupSnapshot(
  data: AppPersistedData,
): AppSnapshot {
  return {
    ...data,
    version: Date.now(),
    updatedAt: new Date().toISOString(),
    staffConfig: loadStaffConfigFromBrowser(),
  };
}

export function exportAppBackup(data: AppPersistedData): void {
  const snapshot = buildAppBackupSnapshot(data);
  downloadJson(`派单系统备份-${stampForFilename()}.json`, snapshot);
}

export function parseAppBackupFile(raw: string): AppSnapshot {
  const parsed = JSON.parse(raw) as Partial<AppSnapshot>;
  return normalizeSnapshot(parsed);
}

export function restoreAppBackup(snapshot: AppSnapshot): void {
  writeFreshOrdersLocalStorage({
    orders: snapshot.orders,
    supplements: snapshot.supplements,
  });
  persistStaffConfigToLocalStorage(snapshot.staffConfig);
  window.location.reload();
}

export function exportDuplicateReportCsv(
  groups: { displayAddress: string; orders: { id: string; status: string; dispatcherName: string; customerName: string }[] }[],
): void {
  const lines = [
    "地址,重复笔数,订单ID,客户,状态,派单人",
    ...groups.flatMap((group) =>
      group.orders.map((order, index) =>
        [
          index === 0 ? group.displayAddress : "",
          index === 0 ? String(group.orders.length) : "",
          order.id,
          order.customerName,
          order.status,
          order.dispatcherName,
        ]
          .map((cell) => {
            if (/[",\n\r]/.test(cell)) {
              return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
          })
          .join(","),
      ),
    ),
  ];
  downloadCsv(`重复地址报告-${stampForFilename()}.csv`, lines.join("\n"));
}
