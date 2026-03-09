# 勤怠管理システム / Kintai Attendance App

A modern attendance management web app with clock-in/out, break tracking, leave requests, and a Jobcan-style UI. Built for production use with validation, auth guards, and clear documentation.

**商用レベルを想定した勤怠管理Webアプリ。** 出退勤・休憩打刻、休暇申請、ジョブカン風UIに加え、**インテリジェント・ダッシュボード**（今日は何の日・AIデイリーニュース・表示設定の保存）を備えています。

---

## Features / 主な機能

- **勤怠打刻**: 出勤・退勤・休憩開始・休憩戻り（位置情報対応）
- **インテリジェント・トップバナー**
  - **今日は何の日（詳細版）**: 由来や現代に活かせる教訓を含む3〜4行の説明
  - **AIデイリーニュース**: AI業界の動向（RAG・エージェント・新モデル等）の要約（現状モック、将来API連携想定）
  - **表示モード**: 標準（両方表示）／詳細解説モード（今日は何の日 or AIニュースを深掘り）
- **設定画面**: 「今日は何の日」「AIニュース」のON/OFF、表示モード選択、プロフィール（名前・メール確認・名前変更）。設定はDBに保存されログインごとに反映。
- **打刻後の演出**: 出勤打刻後に「今日のニュースは読みましたか？」の控えめなメッセージを表示

---

## Tech Stack / 使用技術

| Category      | Technology |
|---------------|------------|
| Framework     | **Next.js 14** (App Router) |
| Auth          | **NextAuth.js v5** (Credentials, JWT) |
| Database      | **PostgreSQL** (Prisma ORM) |
| Hosting (DB)  | **Supabase** (or Neon, etc.) |
| Styling       | **Tailwind CSS** |
| Validation    | **Zod** |
| UI / Motion   | Framer Motion, Lucide React, Sonner (toast) |

---

## Environment Variables / 環境変数の設定

Copy `.env.example` to `.env` and fill in the values.

`.env.example` をコピーして `.env` を作成し、値を設定してください。

```bash
cp .env.example .env
```

| Variable       | Description (EN) | 説明 (JA) |
|----------------|------------------|-----------|
| `DATABASE_URL` | PostgreSQL connection string (pooled). | 接続文字列（プール用）。Supabase/Neon 等の URL。 |
| `DIRECT_URL`   | Direct connection string for migrations. | マイグレーション用の直接接続URL。 |
| `AUTH_SECRET`  | Secret for NextAuth JWT signing. Generate with `openssl rand -base64 32`. | NextAuth の JWT 署名用。32文字以上推奨。 |
| `AUTH_URL`     | (Optional) App URL in production. Vercel sets this automatically. | （任意）本番のアプリURL。Vercel では未設定で可。 |

---

## Getting Started / 開発環境の立ち上げ

### 1. Install dependencies / 依存関係のインストール

```bash
npm install
```

### 2. Set up environment / 環境変数の設定

Create `.env` from `.env.example` and set `DATABASE_URL`, `DIRECT_URL`, and `AUTH_SECRET`.

`.env.example` を元に `.env` を作成し、`DATABASE_URL`・`DIRECT_URL`・`AUTH_SECRET` を設定してください。

### 3. Database / データベース

```bash
# Apply schema (creates/updates tables)
npx prisma db push

# (Optional) Seed test user
npx prisma db seed
```

Default seed user: `test@example.com` / `password123`  
シードのテストユーザー: メール `test@example.com`、パスワード `password123`

### 4. Run development server / 開発サーバーの起動

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) (port 3001).  
ブラウザで [http://localhost:3001](http://localhost:3001) を開いてください。

### 5. Build for production / 本番ビルド

```bash
npm run build
npm run start
```

---

## Project Structure / プロジェクト構成

```
src/
├── app/
│   ├── api/
│   │   ├── attendance/   # GET: 勤怠取得, POST: 打刻
│   │   ├── auth/         # NextAuth ルート
│   │   ├── leave/        # 休暇申請 API
│   │   ├── register/     # 新規登録 API
│   │   └── settings/     # GET/PATCH: ユーザー設定・プロフィール
│   ├── dashboard/        # ダッシュボード・打刻・休暇申請・設定
│   │   ├── IntelligentBanner.tsx  # 今日は何の日 + AIニュース
│   │   ├── PunchPanel.tsx
│   │   └── settings/     # 設定画面（表示カスタマイズ・表示モード・プロフィール）
│   ├── login/
│   ├── register/
│   └── layout.tsx
├── auth.ts               # NextAuth 設定
├── lib/
│   ├── prisma.ts
│   ├── aiNews.ts         # AIデイリーニュース（モック、API連携想定）
│   ├── specialDays.ts    # 今日は何の日（詳細説明付き）
│   └── validations.ts    # Zod スキーマ
└── middleware.ts         # 認証ガード（/dashboard → /login）
```

### Database / データベース

- **UserSettings**: ユーザーごとの表示設定（`showSpecialDay`, `showAiNews`, `displayMode`）。初回取得時にデフォルトでレコード作成。

---

## Deploy on Vercel / Vercel でのデプロイ

1. Push to GitHub and import the repo in Vercel.
2. Add environment variables in Vercel: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`. (Optional: `AUTH_URL` for custom domain.)
3. Deploy. The `build` script runs `prisma generate && next build`.

GitHub にプッシュし、Vercel でリポジトリをインポート。環境変数を設定してデプロイしてください。

---

## License

Private / 個人利用・社内利用を想定しています。
