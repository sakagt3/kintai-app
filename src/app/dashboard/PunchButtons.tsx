"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

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
          router.refresh()
        })
        .catch((err) => {
          setError(err.message ?? "打刻に失敗しました。")
        })
        .finally(onFinish)
    }

    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          sendPunch(pos.coords.latitude, pos.coords.longitude)
        },
        () => {
          sendPunch()
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } else {
      sendPunch()
    }
  }

  return (
    <>
      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={() => handlePunch("CLOCK_IN")}
          disabled={loading !== null}
          className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === "CLOCK_IN" ? "打刻中..." : "出勤"}
        </button>
        <button
          type="button"
          onClick={() => handlePunch("CLOCK_OUT")}
          disabled={loading !== null}
          className="w-full py-2.5 px-4 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === "CLOCK_OUT" ? "打刻中..." : "退勤"}
        </button>
      </div>
      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </>
  )
}
