/**
 * エビングハウス忘却曲線に基づく復習間隔。
 * 正解時は次の間隔（日）を進め、不正解時は即復習対象にする。
 */

/** 正解を重ねたときの次の復習間隔（日） */
const INTERVAL_DAYS = [1, 3, 7, 14, 30];

/**
 * 直近の正解連続回数に応じた次回復習日を返す。
 * 不正解の場合は今日（即復習）を返す。
 */
export function computeNextReviewAt(
  answeredAt: Date,
  correct: boolean,
  lastAttempts: { correct: boolean; nextReviewAt: Date | null }[],
): Date | null {
  if (!correct) {
    return answeredAt;
  }

  const previousCorrectStreak = countRecentCorrectStreak(lastAttempts);
  const intervalIndex = Math.min(previousCorrectStreak, INTERVAL_DAYS.length - 1);
  const days = INTERVAL_DAYS[intervalIndex];

  const next = new Date(answeredAt);
  next.setDate(next.getDate() + days);
  return next;
}

function countRecentCorrectStreak(
  attempts: { correct: boolean; nextReviewAt: Date | null }[],
): number {
  let count = 0;
  for (let i = attempts.length - 1; i >= 0; i--) {
    if (attempts[i].correct) count++;
    else break;
  }
  return count;
}
