# Vercel で 500 を防ぐ環境変数設定

デプロイは「Ready」でも、**開くと 500 になる**場合は、ほぼ **環境変数が未設定か本番用でない** ことが原因です。

## 必須：Vercel にこの 4 つを設定する

Vercel ダッシュボード → **kintai-app** → **Settings** → **Environment Variables** で、次を **Production** に追加してください。

| 名前 | 値の例 | 説明 |
|------|--------|------|
| `DATABASE_URL` | `postgresql://...@...supabase.com:6543/postgres?pgbouncer=true` | Supabase の「Connection string」の **Pooler**（port 6543） |
| `DIRECT_URL` | `postgresql://...@...supabase.com:5432/postgres` | Supabase の「Connection string」の **Direct**（port 5432） |
| `AUTH_SECRET` | 32文字以上のランダム文字列 | 本番用の秘密鍵。ターミナルで `npx auth secret` を実行して生成 |
| `AUTH_URL` | **https://kintai-app-khaki.vercel.app** | **必ず本番のURL**。Vercel の「Domains」に表示されている Production の URL（末尾の `/` なし）。プレビューURLは使わない。 |

- 値に **ダブルクォート `"` は付けない**でください（Vercel がそのまま渡します）。
- `AUTH_URL` を **localhost** のままにしていると本番で 500 になりやすいです。上のように **Vercel の本番URL** に変更してください。

## 設定後の手順

1. **Save** で保存する。
2. **Deployments** タブへ戻る。
3. 最新のデプロイの **⋯** → **Redeploy** を実行（「Use existing Build Cache」はオフ推奨）。

再デプロイ後、もう一度本番URLを開いて確認してください。

## まだ 500 になる場合

- **Runtime Logs**: Vercel の該当デプロイ → **Runtime Logs** で、どのリクエストで何が起きているか確認できます。
- **Build Logs**: ビルド時の警告（例: Prisma の生成失敗）がないか確認してください。
