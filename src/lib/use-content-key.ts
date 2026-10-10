"use client";

import { useMemo } from "react";

/** "undefined" 之外的兜底：无法序列化时退化为字符串比较 */
function serializeKey(value: unknown): string {
  if (value === undefined) return "undefined";
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/**
 * 把任意值折叠成「内容签名」，用作 useEffect / useMemo 的依赖。
 *
 * 为什么需要：客户端每 ~8s 轮询云端快照，只要服务端 version 变新（别的同事改了订单/人员），
 * 就会用「内容相同、引用全新」的对象覆盖各 Context（staffRecords / orders /
 * siteBranding / commissionSettings …）。把这些对象直接放进 deps，effect 每次轮询都会重跑，
 * 典型后果就是「正在录入 / 正在筛选 / 尚未保存的内容被重置」。
 *
 * 用内容签名代替对象引用，既保持原语义（内容真的变了才执行），又不会被引用抖动误触发。
 * 注意：不要传 Map / Set（JSON.stringify 恒为 "{}"），请传由其派生出的普通数组或对象。
 */
export function useContentKey(value: unknown): string {
  return useMemo(() => serializeKey(value), [value]);
}
