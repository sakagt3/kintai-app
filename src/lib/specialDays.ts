/**
 * 日本の記念日・行事のマスタデータ（月-日 → 名前・一言説明）
 * 出勤時のモチベーションアップ用に「今日は何の日」を返す
 */
const SPECIAL_DAYS: Record<string, { name: string; description: string }> = {
  "1-1": {
    name: "元日",
    description: "一年の始まり。新しい目標に向かってスタートする日です。",
  },
  "1-2": {
    name: "初夢",
    description: "新年の夢で一年の運勢を占う日。良い夢を見られますように。",
  },
  "2-3": {
    name: "節分",
    description: "鬼は外、福は内。豆まきで厄払いをする日です。",
  },
  "2-14": {
    name: "バレンタインデー",
    description: "感謝や想いを伝える日。チョコと一緒に気持ちを届けましょう。",
  },
  "3-3": {
    name: "ひなまつり",
    description: "女の子の健やかな成長を祈る桃の節句です。",
  },
  "3-8": {
    name: "国際女性の日",
    description: "女性の社会参加と活躍を考える日です。",
  },
  "3-9": {
    name: "サンキューの日",
    description: "感謝を伝える日。「3(サン)9(キュー)」の語呂合わせです。",
  },
  "3-14": {
    name: "ホワイトデー",
    description: "バレンタインのお返しと感謝を伝える日です。",
  },
  "4-1": {
    name: "エイプリルフール",
    description: "一年に一度の嘘が許される日。楽しく過ごしましょう。",
  },
  "4-29": {
    name: "昭和の日",
    description: "激動の日々を経て、復興を遂げた昭和を振り返る日です。",
  },
  "5-1": {
    name: "メーデー",
    description: "労働者の権利と団結を祝う国際的な日です。",
  },
  "5-4": {
    name: "みどりの日",
    description: "自然に親しみ、豊かな心を育む日です。",
  },
  "5-5": {
    name: "こどもの日",
    description: "子供の成長を祝い、幸せを願う端午の節句です。",
  },
  "6-1": {
    name: "気象記念日",
    description: "気象観測の大切さを考える日です。",
  },
  "7-7": {
    name: "七夕",
    description: "願いを短冊に込めて。星に願いを届ける日です。",
  },
  "8-11": {
    name: "山の日",
    description: "山に親しみ、山の恩恵に感謝する日です。",
  },
  "9-1": { name: "防災の日", description: "災害への備えを見直す日です。" },
  "9-23": {
    name: "秋分の日",
    description: "祖先を敬い、亡くなった人々をしのぶ日です。",
  },
  "10-1": {
    name: "コーヒーの日",
    description: "コーヒーで一息。仕事の合間にほっと一息。",
  },
  "10-10": {
    name: "トートの日",
    description: "「10(トー)10(トー)」の語呂合わせ。鞄を見直す日です。",
  },
  "11-11": {
    name: "ポッキー＆プリッツの日",
    description: "1が4本並ぶ日。おやつでちょっとした幸せを。",
  },
  "11-23": {
    name: "勤労感謝の日",
    description: "勤労を尊び、生産を祝い、互いに感謝し合う日です。",
  },
  "12-25": {
    name: "クリスマス",
    description: "一年の締めくくりを、温かい気持ちで過ごす日です。",
  },
  "12-31": {
    name: "大晦日",
    description: "一年の締めくくり。お疲れ様でした。",
  },
};

/** 祝日・記念日がない日用のフォールバック（曜日ベースの励まし） */
const WEEKDAY_MESSAGES: Record<number, string> = {
  0: "日曜日。ゆっくり休んで明日に備えましょう。",
  1: "月曜日。今週も張り切っていきましょう。",
  2: "火曜日。一週間のペースが整ってくる日です。",
  3: "水曜日。週の折り返し。あと少しで金曜日です。",
  4: "木曜日。明日で今週も終わり。ラストスパートです。",
  5: "金曜日。今週お疲れ様でした。良い週末を。",
  6: "土曜日。週末。リフレッシュしてまた来週に備えましょう。",
};

/**
 * 指定した日付の「今日は何の日」を返す（JST の月・日を使用）
 */
export function getSpecialDay(
  month: number,
  day: number,
): { name: string; description: string } {
  const key = `${month}-${day}`;
  const special = SPECIAL_DAYS[key];
  if (special) return special;
  const d = new Date(2000, month - 1, day);
  const dayOfWeek = d.getDay();
  const fallback = WEEKDAY_MESSAGES[dayOfWeek];
  return {
    name: `${month}月${day}日`,
    description: fallback,
  };
}

/**
 * 今日（JST）の「今日は何の日」を返す
 */
export function getTodaysSpecialDay(): { name: string; description: string } {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const month = jst.getUTCMonth() + 1;
  const day = jst.getUTCDate();
  return getSpecialDay(month, day);
}
