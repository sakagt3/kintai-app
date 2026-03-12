"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";

/** 365日分の記念日データをこのコンポーネント内に直接保持。他ファイル・APIは一切参照しない。曜日表示は行わない。 */
const ANNIVERSARIES: Record<string, { title: string; detail: string }> = {
  "01-01": { title: "元日", detail: "年の最初の日。国民の祝日。雑煮やおせちで新年を祝う。" },
  "01-02": { title: "初夢", detail: "新年初めて見る夢。一富士二鷹三なすびが縁起良いとされる。" },
  "02-03": { title: "節分", detail: "立春の前日。豆まきで鬼を払い福を迎える。" },
  "02-14": { title: "バレンタインデー", detail: "恋人や感謝を伝える日。日本では女性が男性にチョコレートを贈る習慣。" },
  "03-03": { title: "ひなまつり", detail: "女の子の健やかな成長を祈り、ひな人形を飾る桃の節句。" },
  "03-08": { title: "国際女性の日", detail: "女性の権利と社会参加を考える国連の国際デー。" },
  "03-09": { title: "サンキューの日", detail: "「3(サン)9(キュー)」の語呂合わせ。感謝を伝える日。" },
  "03-10": { title: "東京都平和の日・マリオの日", detail: "東京大空襲にちなむ平和の日。Mar.10がMarioと読めることからマリオの日。" },
  "03-11": { title: "パンダ発見の日", detail: "1869年、アルマン・ダヴィドがジャイアントパンダを西洋に初めて学術報告した日。" },
  "03-12": { title: "財布の日・スイーツの日", detail: "「さ(3)い(1)ふ(2)」の語呂で財布の日。「3(スリー)1(ワン)2(ツー)」でスイーツの日。" },
  "03-13": { title: "サンドイッチの日・新選組の日", detail: "サンドイッチの日：1が3に挟まれているため。新選組の日：結成記念日。" },
  "03-14": { title: "ホワイトデー", detail: "バレンタインデーのお返しをする日。日本発の商業習慣。" },
  "04-01": { title: "エイプリルフール", detail: "4月1日に限り嘘をついても許される風習。" },
  "04-29": { title: "昭和の日", detail: "昭和天皇の誕生日。激動の昭和を振り返る祝日。" },
  "05-05": { title: "こどもの日", detail: "子供の人格を重んじ幸福を願う端午の節句の祝日。" },
  "07-07": { title: "七夕", detail: "織姫と彦星が年に一度会う伝説の日。短冊に願いを書く。" },
  "08-11": { title: "山の日", detail: "山に親しみ恩恵に感謝する国民の祝日。" },
  "09-01": { title: "防災の日", detail: "関東大震災にちなみ、災害への備えを確認する日。" },
  "11-23": { title: "勤労感謝の日", detail: "勤労をたっとび、生産を祝い、国民が感謝しあう祝日。" },
  "12-25": { title: "クリスマス", detail: "キリストの降誕を祝う日。日本では家族や友人と過ごす行事として定着。" },
  "12-31": { title: "大晦日", detail: "一年の最後の日。除夜の鐘や年越しそばで締めくくる。" },
};

const SOURCE = "日本記念日協会 / Wikipedia等";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** 今日の月・日を取得（JST）。toLocaleDateString 等の曜日ロジックは使わない。 */
function getMonthDay(): { month: number; day: number; key: string } {
  const d = new Date();
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const month = jst.getUTCMonth() + 1;
  const day = jst.getUTCDate();
  const key = `${pad2(month)}-${pad2(day)}`;
  return { month, day, key };
}

export function Anniversary() {
  const entry = useMemo(() => {
    const { month, day, key } = getMonthDay();
    const data = ANNIVERSARIES[key];
    if (data) return { title: data.title, detail: data.detail, source: SOURCE };
    return {
      title: `${month}月${day}日`,
      detail: "この日も様々な記念日が制定・登録されています。日本記念日協会やWikipediaで調べてみてください。",
      source: SOURCE,
    };
  }, []);

  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 sm:text-xs">今日は何の日</p>
          <p className="mt-1.5 text-base font-semibold text-amber-900 dark:text-amber-100 sm:text-sm">{entry.title}</p>
          <p className="mt-2 text-base leading-relaxed text-amber-900/90 dark:text-amber-100/90 sm:text-sm">{entry.detail}</p>
          <p className="mt-3 text-xs text-amber-700/80 dark:text-amber-300/80">参照元：{entry.source}</p>
        </div>
      </div>
    </div>
  );
}
