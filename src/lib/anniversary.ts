/**
 * 365日対応「今日は何の日」。
 * specialDays のデータを利用し、参照元を「日本記念日協会 / Wikipedia等」で統一。
 * 曜日表示は行わず、記念日名と詳細・参照元のみ返す。
 */
import { getTodaysSpecialDay } from "@/lib/specialDays";

export type AnniversaryResult = {
  name: string;
  detail: string;
  source: string;
};

const DEFAULT_SOURCE = "日本記念日協会 / Wikipedia等";

/**
 * 今日の記念日を取得。詳細は3〜4行程度の由来・説明を返す。
 * 曜日は含めない。
 */
export function getTodaysAnniversary(overrideDate?: Date): AnniversaryResult {
  const r = getTodaysSpecialDay(overrideDate);
  const detail =
    (r.detail && r.detail.trim() !== "")
      ? r.detail
      : (r.description && r.description.trim() !== "")
        ? r.description
        : "この日も日本では様々な記念日・行事が制定・登録されています。日本記念日協会のデータベースやWikipediaで、その日の出来事や記念日を調べることができます。";
  return {
    name: r.name ?? "—",
    detail,
    source: DEFAULT_SOURCE,
  };
}
