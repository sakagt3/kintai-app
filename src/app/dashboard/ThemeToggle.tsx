"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const isDark =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
    setDark(isDark)
  }, [])
  const toggle = () => {
    document.documentElement.classList.toggle("dark", !dark)
    setDark(!dark)
  }
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      aria-label={dark ? "ライトモード" : "ダークモード"}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
