/**
 * ルートレイアウト: フォント・メタデータ・グローバルな Toaster（Sonner）を設定する
 */
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Habit Logic",
  description: "習慣を、上昇のロジックに変える。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-[#1E293B] antialiased dark:bg-gray-950 dark:text-slate-100 font-sans">
        {children}
        <Toaster
          position="bottom-center"
          richColors
          closeButton
          toastOptions={{
            className: "font-sans",
          }}
        />
      </body>
    </html>
  );
}
