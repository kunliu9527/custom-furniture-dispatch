import { normalizeCompanyId } from "@/lib/company";
import { fileStorageBackend } from "./file-storage";
import { kvStorageBackend } from "./kv-storage";
import {
  resolveStorageBackendId,
  type StorageBackend,
} from "./storage-backend";
import { normalizeStaffConfig, normalizeSnapshot } from "./snapshot-normalize";
import type { AppSnapshot, StaffConfigSnapshot } from "./snapshot-types";

export { normalizeStaffConfig, normalizeSnapshot };
export type { AppSnapshot, StaffConfigSnapshot };
export { resolveStorageBackendId, isKvStorageConfigured } from "./storage-backend";

export type SnapshotMergeInput = {
  version: number;
  orders?: AppSnapshot["orders"];
  supplements?: AppSnapshot["supplements"];
  staffConfig?: StaffConfigSnapshot;
};

function getBackend(): StorageBackend {
  return resolveStorageBackendId() === "kv"
    ? kvStorageBackend
    : fileStorageBackend;
}

export function getActiveStorageBackendId() {
  return getBackend().id;
}

export async function readAppSnapshot(
  companyId?: string,
): Promise<AppSnapshot> {
  return getBackend().readSnapshot(normalizeCompanyId(companyId));
}

export async function writeAppSnapshot(
  companyId: string,
  next: AppSnapshot,
): Promise<void> {
  return getBackend().writeSnapshot(normalizeCompanyId(companyId), next);
}

export async function mergeAppSnapshot(
  companyId: string | undefined,
  input: SnapshotMergeInput,
): Promise<
  | { ok: true; snapshot: AppSnapshot }
  | { ok: false; reason: "version_conflict"; current: AppSnapshot }
> {
  const id = normalizeCompanyId(companyId);
  const current = await readAppSnapshot(id);
  if (input.version !== current.version) {
    return { ok: false, reason: "version_conflict", current };
  }
  const next: AppSnapshot = {
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
    orders: input.orders ?? current.orders,
    supplements: input.supplements ?? current.supplements,
    staffConfig: input.staffConfig ?? current.staffConfig,
  };
  await writeAppSnapshot(id, next);
  return { ok: true, snapshot: next };
}
