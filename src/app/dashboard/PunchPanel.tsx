"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { LogIn, LogOut, Loader2 } from "lucide-react"

type PunchType = "CLOCK_IN" | "CLOCK_OUT"

export function PunchPanel({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState<PunchType | null>(null)
  const [error, setError] = useState("")
  const [now, setNow] = useState<Date>(() => new Date())
  const router = useRouter()

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const timeStr = jst.toISOString().slice(11, 19)
  const dateStr = jst.toISOString().slice(0, 10).replace(/-/g, "/")

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
          if (!res.ok) throw new Error(data.error ?? "打刻に失敗しました。")
          toast.success(type === "CLOCK_IN" ? "出勤を記録しました。" : "退勤を記録しました。", {
            description: "再度押すと時刻を上書きできます。",
          })
          onSuccess()
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
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-sm font-bold text-gray-800">出退勤打刻</h2>
      <p className="mb-4 text-xs text-gray-500">再度押すと時刻を上書きします</p>
      <div className="mb-6 rounded-lg bg-[#1e3a5f] py-4 text-center">
        <p className="text-3xl font-bold tabular-nums tracking-wide text-white">{timeStr}</p>
        <p className="mt-1 text-sm text-white/80">{dateStr}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <motion.button
          type="button"
          onClick={() => handlePunch("CLOCK_IN")}
          disabled={loading !== null}
          whileHover={{ scale: 1.02, backgroundColor: "rgb(22 163 74)" }}
          whileTap={{ scale: 0.98 }}
          className="flex min-h-[56px] items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-base font-bold text-white shadow-md transition disabled:opacity-50 disabled:pointer-events-none hover:bg-green-700"
        >
          {loading === "CLOCK_IN" ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
          <span>{loading === "CLOCK_IN" ? "打刻中..." : "出勤"}</span>
        </motion.button>
        <motion.button
          type="button"
          onClick={() => handlePunch("CLOCK_OUT")}
          disabled={loading !== null}
          whileHover={{ scale: 1.02, backgroundColor: "rgb(185 28 28)" }}
          whileTap={{ scale: 0.98 }}
          className="flex min-h-[56px] items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-base font-bold text-white shadow-md transition disabled:opacity-50 disabled:pointer-events-none hover:bg-red-700"
        >
          {loading === "CLOCK_OUT" ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
          <span>{loading === "CLOCK_OUT" ? "打刻中..." : "退勤"}</span>
        </motion.button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
    </section>
  )
}
