/**
 * Zod スキーマ: 新規登録・打刻・休暇申請のリクエストバリデーションを定義する
 */
import { z } from "zod";

/** 新規登録フォームのバリデーション */
export const registerSchema = z.object({
  name: z.string().max(100).optional(),
  email: z
    .string()
    .min(1, "メールアドレスを入力してください。")
    .email("有効なメールアドレスを入力してください。"),
  password: z
    .string()
    .min(6, "パスワードは6文字以上で入力してください。")
    .max(128),
});

/** 打刻APIのリクエストボディ */
export const attendancePunchSchema = z.object({
  type: z.enum(["CLOCK_IN", "CLOCK_OUT", "BREAK_START", "BREAK_END"], {
    message:
      "打刻種別（CLOCK_IN / CLOCK_OUT / BREAK_START / BREAK_END）を指定してください。",
  }),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  location: z.string().optional(),
});

/** 休暇申請APIのリクエストボディ */
export const leaveRequestSchema = z.object({
  date: z
    .string()
    .min(1, "日付を選択してください。")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "有効な日付を選択してください。"),
  type: z.enum(["有給", "欠勤"], {
    message: "種別は「有給」または「欠勤」を選択してください。",
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type AttendancePunchInput = z.infer<typeof attendancePunchSchema>;
export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;
