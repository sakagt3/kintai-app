import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="flex items-center gap-2 text-lg font-bold text-gray-800">
          <Settings className="h-5 w-5 text-[#1e3a5f]" />
          設定
        </h1>
        <p className="mt-3 text-sm text-gray-500">設定画面は準備中です。</p>
      </div>
    </div>
  )
}
