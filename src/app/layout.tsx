import type { Metadata } from "next"
import { Toaster } from "sonner"
import { Noto_Sans_JP } from "next/font/google"
import "./globals.css"

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "勤怠管理システム",
  description: "シンプルで使いやすい勤怠管理",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={notoSansJP.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100 font-sans">
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
  )
}
