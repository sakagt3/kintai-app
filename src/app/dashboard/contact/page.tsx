"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";

const SEND_TO = "yuohdai33@gmail.com";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`【お問い合わせ】${name ? `${name} 様より` : "問い合わせ"}`);
    const body = encodeURIComponent(
      [
        "以下の内容でお問い合わせがありました。",
        "",
        "---",
        `お名前: ${name || "（未記入）"}`,
        `メールアドレス: ${email || "（未記入）"}`,
        "",
        "【お問い合わせ内容】",
        message || "（未記入）",
      ].join("\n")
    );
    window.location.href = `mailto:${SEND_TO}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        設定に戻る
      </Link>

      <div className="mx-auto w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
        <h1 className="mb-2 text-lg font-bold text-gray-800 dark:text-slate-100">
          お問い合わせ
        </h1>
        <p className="mb-6 text-sm text-gray-600 dark:text-slate-400">
          送信するとお使いのメールソフトが開きます。送付先: {SEND_TO}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="contact-name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
              お名前 <span className="text-gray-400">（任意）</span>
            </label>
            <input
              id="contact-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="山田 太郎"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label htmlFor="contact-email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
              メールアドレス <span className="text-gray-400">（任意）</span>
            </label>
            <input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label htmlFor="contact-message" className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
              お問い合わせ内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="contact-message"
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="ご質問・ご要望をご記入ください"
              className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-3 text-sm font-medium text-white hover:bg-[#2a4a6f]"
          >
            <Send className="h-4 w-4" />
            送信（メールソフトを開く）
          </button>
        </form>
      </div>
    </div>
  );
}
