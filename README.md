# 勤怠管理システム / Kintai Attendance App

A modern attendance management web app with clock-in/out, break tracking, leave requests, and a Jobcan-style UI. Built for production use with validation, auth guards, and clear documentation.

**商用レベルを想定した勤怠管理Webアプリ。** 出退勤・休憩打刻に加え、**AI時代のビジネス戦闘力向上プラットフォーム**として、打刻するたびに成長できる学習機能を統合しています。

---

## Features / 主な機能

- **勤怠打刻**: 出勤・退勤・休憩開始・休憩戻り（位置情報対応）
- **AI学習＆ニュースバナー**
  - **AIニュース**: 出典リンク付き。「気になったら詳細を見る」でソース記事へ遷移（現状モック、API連携想定）
  - **AI用語解説（営業用）**: 毎日1つ（LLM, RAG, Agent等）。用語説明・お客様へのトーク例・ビジネス使用用途を表示
  - **今日は何の日（詳細版）**: 由来・教訓を含む3〜4行の説明
  - **表示カスタマイズ**: 設定で「AIニュース」「AI用語」「記念日」のON/OFF、表示ボリューム（簡易・詳細）
- **LLMベースのパーソナライズ基盤**
  - **トピック選択**: 10個以上のジャンル（最新テック、経済、歴史、心理学、ガジェット、AI・ML等）から興味を選択
  - **自由記述カスタマイズ**: 「TOEIC 800点を目指すための単語」のように学びたい内容を入力。`lib/llm.ts` でメタ・プロンプトを組み立て、将来的にGPT/Gemini等と連携する拡張ポイントを用意
- **忘却曲線クイズ（一問一答）**
  - 毎日4択クイズ（IT用語・英単語等）。正解/不正解をDBに記録
  - **エビングハウスに基づく出題**: 復習タイミング（nextReviewAt）を計算し、間違えた問題・忘れそうな問題を優先して出題
  - 1日の出題数（5問・10問・15問・20問）を設定で変更可能
- **高度な設定パネル**: トピック選択・学習目標・問題数・表示優先度を一括で制御。プロフィール（名前・メール確認・名前変更）もDBに保存されログインごとに反映
- **打刻後の演出**: 出勤打刻後に「今日のニュースは読みましたか？」の控えめなメッセージを表示
- **AI学習コンシェルジュ（Vercel AI SDK）**
  - **インタラクティブ・プランプレビュー**: 学習目標・レベルを入力すると、その場でAIが「明日出すクイズ3問」と「ニュース解説サンプル」をストリーミング生成。タイピング風表示と「AIがあなたのためのプランを構築中...」演出。`OPENAI_API_KEY` 未設定時はモックストリーム。
  - **4段階レベル**: 初心者 / 中級者 / 上級者 / プロ。レベルに応じてLLMプロンプトの専門用語量・解説の深さを変更。
  - **1分クイック診断**: 3問に答えるとAIが「君は〇〇だね。このプランはどう？」とレベル推定とプラン提案。
  - **忘却曲線インジケーター**: 「この単語はあとX日で忘れます」を一覧表示。
  - **営業トーク・シミュレーター**: クイズ正解後、「この知識を15秒で客先に説明してみて」と入力するとAIがフィードバック。
- **閲覧履歴（ActivityLog）**: ニュース・トピックの閲覧を記録し、パーソナライズ精度向上の基盤。

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

## Vercel デプロイと 404（DEPLOYMENT_NOT_FOUND）の解消

**Habit Logic** を本番で動かすための手順です。

### クリーンビルドで再デプロイ

**方法A: Vercel ダッシュボード（推奨）**

1. [vercel.com](https://vercel.com) にログインし、対象プロジェクトを開く。
2. **Deployments** タブ → 最新のデプロイメントの **⋯** メニュー → **Redeploy**。
3. **Redeploy** ダイアログで **Use existing Build Cache** のチェックを**外す**（クリーンビルド）。
4. **Redeploy** を実行し、ステータスが **Ready** になるまで待つ。

**方法B: Vercel CLI（ローカルで実行）**

```bash
# 未ログインの場合は一度ログイン
npx vercel login

# 本番へ強制デプロイ（キャッシュ無視）
npx vercel --prod --force
```

完了後、ターミナルに表示される **Production** の URL が本番のアドレスです。

### 本番 URL の確認

- **Vercel ダッシュボード**: プロジェクト → **Settings** → **Domains** で、`.vercel.app` の URL やカスタムドメインを確認。
- デフォルトでは次のいずれかになります:
  - `https://<プロジェクト名>-<チーム or ユーザー>.vercel.app`
  - 例: `https://kintai-app-xxx.vercel.app`

### 404 をなくすための確認

- ルート `/` は `/login` にリダイレクトされるため、**実際に開くURLは `https://<上記のドメイン>/` または `https://<上記のドメイン>/login`** です。
- 古いデプロイのURL（別サブドメインや削除済みデプロイのURL）を使っていると **DEPLOYMENT_NOT_FOUND** や 404 になります。必ず **いまのプロジェクトの「本番」デプロイの URL** を開いてください。
- 友人に共有する場合は、**本番ドメインのトップ**（例: `https://kintai-app-xxx.vercel.app`）を送ると、自動でログイン画面（Habit Logic）に飛びます。

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
│   │   ├── quiz/         # POST: クイズ回答送信（忘却曲線で次回復習日を計算）
│   │   ├── quiz/today/   # GET: 今日の出題（復習優先・ランダム補完）
│   │   └── settings/     # GET/PATCH: ユーザー設定・プロフィール
│   ├── dashboard/        # ダッシュボード・打刻・クイズ・休暇申請・設定
│   │   ├── IntelligentBanner.tsx  # 今日は何の日 + AIニュース + AI用語（出典リンク付き）
│   │   ├── PunchPanel.tsx
│   │   ├── QuizPanel.tsx # 一問一答クイズ（忘却曲線出題）
│   │   └── settings/     # 高度設定（トピック・学習目標・問題数・表示ON/OFF・プロフィール）
│   ├── login/
│   ├── register/
│   └── layout.tsx
├── auth.ts               # NextAuth 設定
├── lib/
│   ├── prisma.ts
│   ├── llm.ts            # LLM連携雛形（メタ・プロンプト組み立て・将来API呼び出し）
│   ├── aiNews.ts         # AIデイリーニュース（モック、出典URL付き）
│   ├── aiTerms.ts        # 営業向けAI用語（用語・トーク例・ビジネス用途）
│   ├── specialDays.ts    # 今日は何の日（詳細説明付き）
│   ├── topics.ts         # 学習トピック（10+ジャンル）
│   ├── quizBank.ts       # 4択クイズプール（IT用語・英単語）
│   ├── ebbinghaus.ts     # 忘却曲線の次回復習日計算
│   └── validations.ts    # Zod スキーマ
└── middleware.ts         # 認証ガード（/dashboard → /login）
```

### Database / データベース

- **UserSettings**: 表示設定（`showSpecialDay`, `showAiNews`, `showAiTerm`, `displayMode`, `displayVolume`）、学習設定（`preferredTopicIds` JSON, `customLearningGoal`, `dailyQuizCount`）。初回取得時にデフォルトでレコード作成。
- **QuizAttempt**: クイズ回答履歴（`userId`, `questionId`, `correct`, `answeredAt`, `nextReviewAt`）。忘却曲線に基づく復習タイミング計算に使用。

---

## For Engineers / 技術的なポイント

- **忘却曲線アルゴリズム**: 単なるランダム出題ではなく、DBの回答履歴から `nextReviewAt` を計算し、復習が due になった問題を優先して出題。
- **メタ・プロンプティング**: `lib/llm.ts` で「ユーザーの学習目標＋トピック」から日次コンテンツ用のプロンプトを組み立て。環境変数（`OPENAI_API_KEY` / `GEMINI_API_KEY`）未設定時はモック返却で拡張可能。
- **パーソナライゼーション**: 勤怠という静的なデータに、学習目標・トピック・クイズ履歴という動的データを組み合わせた設計。設定画面で「TOEIC 800点を目指す」と入力し保存すると、将来的にLLM連携でその要望に沿ったコンテンツを生成する基盤となる。

---

## Deploy on Vercel / Vercel でのデプロイ

1. Push to GitHub and import the repo in Vercel.
2. Add environment variables in Vercel: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`. (Optional: `AUTH_URL` for custom domain.)
3. Deploy. The `build` script runs `prisma generate && next build`.

GitHub にプッシュし、Vercel でリポジトリをインポート。環境変数を設定してデプロイしてください。

---

## License

Private / 個人利用・社内利用を想定しています。
