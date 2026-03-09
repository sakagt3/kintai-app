/**
 * ルートレイアウト: フォント・メタデータ・SessionProvider・Toaster を設定する
 * レイアウトでは auth() を呼ばず session は null で渡し、500 を防ぐ。ログインはクライアントで signIn 後にセッションが入る。
 */
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
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
        <Providers session={null}>
          {children}
          <Toaster
            position="bottom-center"
            richColors
            closeButton
            toastOptions={{
              className: "font-sans",
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
