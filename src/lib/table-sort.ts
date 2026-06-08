export type SortDirection = "asc" | "desc";

export interface TableSortState<T extends string = string> {
  column: T | null;
  direction: SortDirection;
}

export const EMPTY_TABLE_SORT: TableSortState = { column: null, direction: "desc" };

export function nextTableSortState<T extends string>(
  current: TableSortState<T>,
  column: T,
  defaultDirection: SortDirection = "desc",
): TableSortState<T> {
  if (current.column === column) {
    return {
      column,
      direction: current.direction === "desc" ? "asc" : "desc",
    };
  }
  return { column, direction: defaultDirection };
}

export function compareNumbers(
  a: number,
  b: number,
  direction: SortDirection,
): number {
  return direction === "desc" ? b - a : a - b;
}

export function compareStrings(
  a: string,
  b: string,
  direction: SortDirection,
): number {
  const cmp = a.localeCompare(b, "zh-CN");
  return direction === "desc" ? -cmp : cmp;
}

export function compareNullableNumbers(
  a: number | null | undefined,
  b: number | null | undefined,
  direction: SortDirection,
  nullsLast = true,
): number {
  const aNull = a == null || !Number.isFinite(a);
  const bNull = b == null || !Number.isFinite(b);
  if (aNull && bNull) return 0;
  if (aNull) return nullsLast ? 1 : -1;
  if (bNull) return nullsLast ? -1 : 1;
  return compareNumbers(a, b, direction);
}

export function compareRankPlace(
  a: number | null | undefined,
  b: number | null | undefined,
  direction: SortDirection,
): number {
  return compareNullableNumbers(a, b, direction, true);
}
