import { useEffect, useRef } from "react";

/**
 * 仅在 sessionScopeKey 实际变化时执行（如切换账号、权限/门店变更）。
 * 避免云端同步刷新 staffRecords 时反复重置 Tab、筛选与表单。
 */
export function useOnSessionScopeChange(
  sessionScopeKey: string,
  onScopeChange: () => void,
) {
  const prevKeyRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (prevKeyRef.current === sessionScopeKey) return;
    prevKeyRef.current = sessionScopeKey;
    onScopeChange();
  }, [sessionScopeKey, onScopeChange]);
}
