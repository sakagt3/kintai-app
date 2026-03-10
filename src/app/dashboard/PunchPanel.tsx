"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { LogIn, LogOut, Coffee, RotateCcw, Loader2 } from "lucide-react";

type PunchType = "CLOCK_IN" | "CLOCK_OUT" | "BREAK_START" | "BREAK_END";

const LABELS: Record<PunchType, string> = {
  CLOCK_IN: "出勤",
  CLOCK_OUT: "退勤",
  BREAK_START: "休憩開始",
  BREAK_END: "休憩戻り",
};

export function PunchPanel({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState<PunchType | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState<Date>(() => new Date());
  const router = useRouter();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const timeStr = jst.toISOString().slice(11, 19);
  const timeShort = jst.toISOString().slice(11, 16);
  const dateStr = jst.toISOString().slice(0, 10).replace(/-/g, "/");

  const handlePunch = async (type: PunchType) => {
    setError("");
    setLoading(type);
    const punchTime = new Date();
    const jstPunch = new Date(punchTime.getTime() + 9 * 60 * 60 * 1000);
    const displayTime = jstPunch.toISOString().slice(11, 16);

    const onFinish = () => setLoading(null);

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
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data?.error ?? "打刻に失敗しました。");
          toast.success(`お疲れ様です！ ${displayTime}`, {
            description: `${LABELS[type]}を記録しました。`,
          });
          if (type === "CLOCK_IN") {
            setTimeout(
              () =>
                toast("今日のニュースは読みましたか？", {
                  duration: 5000,
                  icon: "📰",
                }),
              800,
            );
          }
          onSuccess();
          router.refresh();
        })
        .catch((err) => {
          const msg = err.message ?? "打刻に失敗しました。";
          setError(msg);
          toast.error(msg);
        })
        .finally(onFinish);
    };

    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendPunch(pos.coords.latitude, pos.coords.longitude),
        () => sendPunch(),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    } else {
      sendPunch();
    }
  };

  const btnClass =
    "flex min-h-[48px] min-w-0 flex-1 touch-manipulation items-center justify-center gap-2 rounded-xl px-3 py-3 text-base font-bold shadow-sm transition disabled:opacity-50 disabled:pointer-events-none sm:min-h-[44px] sm:gap-1.5 sm:rounded-lg sm:px-2 sm:py-2.5 sm:text-sm";
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/50 sm:p-4">
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400 sm:mb-2 sm:text-xs">再度押すと時刻を上書きします</p>
      <div className="mb-4 rounded-xl bg-[#1e3a5f] py-4 text-center sm:mb-3 sm:rounded-lg sm:py-3">
        <p className="text-2xl font-bold tabular-nums tracking-wide text-white sm:text-xl md:text-2xl">
          {timeStr}
        </p>
        <p className="mt-1 text-sm font-medium text-white/80 sm:mt-0.5 sm:text-xs">{dateStr}</p>
      </div>
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-2 md:gap-3">
        <motion.button
          type="button"
          onClick={() => handlePunch("CLOCK_IN")}
          disabled={loading !== null}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`${btnClass} bg-green-600 text-white hover:bg-green-700`}
        >
          {loading === "CLOCK_IN" ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4 shrink-0" />
          )}
          <span>出勤</span>
        </motion.button>
        <motion.button
          type="button"
          onClick={() => handlePunch("CLOCK_OUT")}
          disabled={loading !== null}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`${btnClass} bg-red-600 text-white hover:bg-red-700`}
        >
          {loading === "CLOCK_OUT" ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4 shrink-0" />
          )}
          <span>退勤</span>
        </motion.button>
        <motion.button
          type="button"
          onClick={() => handlePunch("BREAK_START")}
          disabled={loading !== null}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`${btnClass} bg-amber-500 text-white hover:bg-amber-600`}
        >
          {loading === "BREAK_START" ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <Coffee className="h-4 w-4 shrink-0" />
          )}
          <span>休憩開始</span>
        </motion.button>
        <motion.button
          type="button"
          onClick={() => handlePunch("BREAK_END")}
          disabled={loading !== null}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`${btnClass} bg-sky-600 text-white hover:bg-sky-700`}
        >
          {loading === "BREAK_END" ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4 shrink-0" />
          )}
          <span>休憩戻り</span>
        </motion.button>
      </div>
      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
