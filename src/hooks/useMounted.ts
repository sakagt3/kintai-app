"use client";

import { useEffect, useState } from "react";

/**
 * クライアントでマウント済みかどうかを返す。
 * SSR/初回レンダーでは false、useEffect 実行後に true になるため、
 * DnD や window 依存の UI をクライアントのみで描画する際に使用（Hydration エラー対策）。
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
