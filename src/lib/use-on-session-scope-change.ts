import { useEffect, useRef } from "react";

/**
 * 仅在 resetKey 实际变化时执行（换账号、权限/角色变更）。
 * 使用 ref 保存回调，避免云端同步导致回调引用变化误触发。
 */
export function useOnSessionScopeChange(
  resetKey: string,
  onScopeChange: () => void,
) {
  const prevKeyRef = useRef<string | undefined>(undefined);
  const onScopeChangeRef = useRef(onScopeChange);
  onScopeChangeRef.current = onScopeChange;

  useEffect(() => {
    if (prevKeyRef.current === resetKey) return;
    prevKeyRef.current = resetKey;
    if (!resetKey) return;
    onScopeChangeRef.current();
  }, [resetKey]);
}
