"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { LogIn, LogOut, Loader2 } from "lucide-react"

type PunchType = "CLOCK_IN" | "CLOCK_OUT"

export function PunchButtons() {
  const [loading, setLoading] = useState<PunchType | null>(null)
  const [error, setError] = useState("")
  const router = useRouter()

  const handlePunch = async (type: PunchType) => {
    setError("")
    setLoading(type)

    const onFinish = () => setLoading(null)

    const sendPunch = (latitude?: number, longitude?: number) => {
      fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          ...(latitude != null && { latitude }),
          ...(longitude != null && { longitude }),
        }),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}))
          if (!res.ok) {
            throw new Error(data.error ?? "打刻に失敗しました。")
          }
          const isIn = type === "CLOCK_IN"
          toast.success(
            isIn ? "出勤を記録しました。" : "退勤を記録しました。",
            { description: "再度押すと時刻を上書きできます。" }
          )
          router.refresh()
        })
        .catch((err) => {
          const msg = err.message ?? "打刻に失敗しました。"
          setError(msg)
          toast.error(msg)
        })
        .finally(onFinish)
    }

    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendPunch(pos.coords.latitude, pos.coords.longitude),
        () => sendPunch(),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } else {
      sendPunch()
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          type="button"
          onClick={() => handlePunch("CLOCK_IN")}
          disabled={loading !== null}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-lg border-2 border-green-600 bg-green-600 px-4 py-3 text-base font-bold text-white shadow-sm transition hover:bg-green-700 hover:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none dark:border-green-500 dark:bg-green-600 dark:hover:bg-green-700 dark:hover:border-green-700"
        >
          {loading === "CLOCK_IN" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogIn className="h-5 w-5" />
          )}
          <span>出勤</span>
        </motion.button>
        <motion.button
          type="button"
          onClick={() => handlePunch("CLOCK_OUT")}
          disabled={loading !== null}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-lg border-2 border-red-600 bg-red-600 px-4 py-3 text-base font-bold text-white shadow-sm transition hover:bg-red-700 hover:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none dark:border-red-500 dark:bg-red-600 dark:hover:bg-red-700 dark:hover:border-red-700"
        >
          {loading === "CLOCK_OUT" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5" />
          )}
          <span>退勤</span>
        </motion.button>
      </div>
      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </>
  )
}
