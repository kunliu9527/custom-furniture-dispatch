import { mkdir, readFile, readdir, writeFile } from "fs/promises";
import path from "path";
import type {
  MonthlyMetricsSnapshot,
  MonthlySnapshotIndex,
} from "@/lib/monthly-snapshot-types";

const DATA_DIR =
  process.env.SYNC_DATA_DIR?.trim() || path.join(process.cwd(), "data");
const SNAPSHOT_DIR = path.join(DATA_DIR, "monthly-snapshots");
const INDEX_PATH = path.join(SNAPSHOT_DIR, "index.json");

function snapshotFileName(
  yearMonth: string,
  scopeKey?: string | null,
): string {
  const slug = scopeKey?.trim();
  return slug ? `${yearMonth}.${slug}.json` : `${yearMonth}.json`;
}

function snapshotPath(yearMonth: string, scopeKey?: string | null): string {
  return path.join(SNAPSHOT_DIR, snapshotFileName(yearMonth, scopeKey));
}

function normalizeIndex(raw: unknown): MonthlySnapshotIndex {
  if (!raw || typeof raw !== "object") return { items: [] };
  const o = raw as MonthlySnapshotIndex;
  if (!Array.isArray(o.items)) return { items: [] };
  return {
    items: o.items.filter(
      (i) => i && typeof i.yearMonth === "string" && typeof i.savedAt === "string",
    ),
  };
}

export async function readMonthlySnapshotIndex(): Promise<MonthlySnapshotIndex> {
  try {
    const raw = await readFile(INDEX_PATH, "utf8");
    return normalizeIndex(JSON.parse(raw));
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return { items: [] };
    throw err;
  }
}

export async function readMonthlySnapshot(
  yearMonth: string,
  scopeKey?: string | null,
): Promise<MonthlyMetricsSnapshot | null> {
  try {
    const raw = await readFile(snapshotPath(yearMonth, scopeKey), "utf8");
    return JSON.parse(raw) as MonthlyMetricsSnapshot;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return null;
    throw err;
  }
}

export async function writeMonthlySnapshot(
  snapshot: MonthlyMetricsSnapshot,
  scopeKey?: string | null,
): Promise<void> {
  await mkdir(SNAPSHOT_DIR, { recursive: true });
  const key = scopeKey ?? snapshot.scopeLabel ?? null;
  const encodedKey = key ? encodeURIComponent(key) : null;
  await writeFile(
    snapshotPath(snapshot.yearMonth, encodedKey),
    JSON.stringify(snapshot, null, 2),
    "utf8",
  );

  const index = await readMonthlySnapshotIndex();
  const without = index.items.filter(
    (i) =>
      i.yearMonth !== snapshot.yearMonth ||
      (i.scopeLabel ?? null) !== (snapshot.scopeLabel ?? null),
  );
  const next: MonthlySnapshotIndex = {
    items: [
      {
        yearMonth: snapshot.yearMonth,
        savedAt: snapshot.savedAt,
        savedBy: snapshot.savedBy,
        scopeLabel: snapshot.scopeLabel,
      },
      ...without,
    ].sort((a, b) => b.yearMonth.localeCompare(a.yearMonth)),
  };
  await writeFile(INDEX_PATH, JSON.stringify(next, null, 2), "utf8");
}

export async function listMonthlySnapshotMonths(): Promise<string[]> {
  try {
    const files = await readdir(SNAPSHOT_DIR);
    return files
      .filter((f) => /^\d{4}-\d{2}\.json$/.test(f))
      .map((f) => f.replace(".json", ""))
      .sort((a, b) => b.localeCompare(a));
  } catch {
    return [];
  }
}
