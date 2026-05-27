import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { createInitialSnapshot, normalizeSnapshot } from "./snapshot-normalize";
import type { AppSnapshot } from "./snapshot-types";
import type { StorageBackend } from "./storage-backend";

const DATA_DIR =
  process.env.SYNC_DATA_DIR?.trim() || path.join(process.cwd(), "data");
const SNAPSHOT_PATH = path.join(DATA_DIR, "snapshot.json");

export const fileStorageBackend: StorageBackend = {
  id: "file",
  async readSnapshot() {
    try {
      const raw = await readFile(SNAPSHOT_PATH, "utf8");
      const parsed = JSON.parse(raw) as Partial<AppSnapshot>;
      return normalizeSnapshot(parsed);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        const initial = createInitialSnapshot();
        await fileStorageBackend.writeSnapshot(initial);
        return initial;
      }
      throw err;
    }
  },
  async writeSnapshot(next) {
    await mkdir(DATA_DIR, { recursive: true });
    const tmp = `${SNAPSHOT_PATH}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
    await rename(tmp, SNAPSHOT_PATH);
  },
};
