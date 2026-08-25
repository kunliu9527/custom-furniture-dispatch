import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { isDefaultCompany, isValidCompanyId } from "@/lib/company";
import {
  createEmptyCompanySnapshot,
  createInitialSnapshot,
  normalizeSnapshot,
} from "./snapshot-normalize";
import type { AppSnapshot } from "./snapshot-types";
import type { StorageBackend } from "./storage-backend";

const DATA_DIR =
  process.env.SYNC_DATA_DIR?.trim() || path.join(process.cwd(), "data");

/** 默认公司沿用历史 data/snapshot.json 路径（现有数据零迁移）；其它公司独立文件 */
function snapshotPathFor(companyId: string): string {
  if (isDefaultCompany(companyId)) {
    return path.join(DATA_DIR, "snapshot.json");
  }
  if (!isValidCompanyId(companyId)) {
    throw new Error(`非法公司标识: ${companyId}`);
  }
  return path.join(DATA_DIR, "snapshots", `${companyId}.json`);
}

export const fileStorageBackend: StorageBackend = {
  id: "file",
  async readSnapshot(companyId) {
    const snapshotPath = snapshotPathFor(companyId);
    try {
      const raw = await readFile(snapshotPath, "utf8");
      const parsed = JSON.parse(raw) as Partial<AppSnapshot>;
      return normalizeSnapshot(parsed);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        const initial = isDefaultCompany(companyId)
          ? createInitialSnapshot()
          : createEmptyCompanySnapshot();
        await fileStorageBackend.writeSnapshot(companyId, initial);
        return initial;
      }
      throw err;
    }
  },
  async writeSnapshot(companyId, next) {
    const snapshotPath = snapshotPathFor(companyId);
    await mkdir(path.dirname(snapshotPath), { recursive: true });
    const tmp = `${snapshotPath}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
    await rename(tmp, snapshotPath);
  },
};
