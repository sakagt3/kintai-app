# ローカル（localhost:3002）の内容を Vercel に同期する手順

## 1. コードを GitHub にプッシュする（自分のPCで）

```bash
cd /Users/yudai/Desktop/kintai-app

# 変更を全部ステージ
git add -A

# コミット（メッセージは自由）
git commit -m "fix: ダッシュボードなど"

# GitHub にプッシュ
git push origin main
```

→ **Vercel が GitHub の kintai-app と連携していれば、プッシュすると自動で新しいデプロイが始まります。**

---

## 2. Vercel で環境変数を設定する（まだなら）

**場所:** https://vercel.com → **sakagt3s-projects** → **kintai-app** → **Settings** → **Environment Variables**

次の4つを **Production** に設定：

| 名前 | 値 |
|------|-----|
| `DATABASE_URL` | Supabase の接続文字列（Pooler / port 6543 推奨） |
| `DIRECT_URL` | Supabase の接続文字列（Direct / port 5432） |
| `AUTH_SECRET` | 32文字以上の秘密鍵（.env と同じ値でOK） |
| `AUTH_URL` | `https://kintai-app-khaki.vercel.app` |

保存後、**Deployments** から「Redeploy」すると反映されます。

---

## 3. 同期の流れ（まとめ）

| やること | どこで |
|----------|--------|
| コードを push | ターミナルで `git push origin main` |
| 自動デプロイ | Vercel が GitHub を監視していれば自動 |
| 環境変数 | Vercel → kintai-app → Settings → Environment Variables |
| 本番URL確認 | https://kintai-app-khaki.vercel.app |

---

## 4. Vercel が GitHub と連携していない場合

- Vercel ダッシュボード → **kintai-app** → **Settings** → **Git**
- 「Connect Git Repository」で **sakagt3/kintai-app** を接続
- 接続後は `git push origin main` で自動デプロイされます。
