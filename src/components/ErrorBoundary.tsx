"use client";

import React, { Component, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  sectionName?: string;
};

type State = { hasError: boolean; error: Error | null };

/**
 * 子コンポーネントでエラーが発生しても画面全体を止めず、フォールバックを表示する。
 * 各カード（ニュース・AI用語・学習プラン等）をラップして使用。
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", this.props.sectionName ?? "Section", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
          role="alert"
        >
          <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              {this.props.sectionName
                ? `${this.props.sectionName}の読み込みに失敗しました`
                : "このセクションを表示できません"}
            </span>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
