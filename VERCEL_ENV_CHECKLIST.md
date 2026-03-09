# 【最優先】Vercel 環境変数 修正チェックリスト（本番ログイン不具合用）

**Vercel の環境変数は Vercel ダッシュボードでしか変更できません。**  
以下を **必ず Vercel ダッシュボード** で実施してください。

---

## 1. 引用符（ダブルクォート）を外す

**Settings** → **Environment Variables** で、次の変数の **値** を確認し、  
先頭と末尾の `"`（ダブルクォーテーション）があれば **削除** してください。

- `DATABASE_URL` → 値は `postgresql://...` のみ（`"` で囲まない）
- `DIRECT_URL` → 同様に `"` なし
- `AUTH_SECRET` → 値だけ（`"` なし）
- `NEXTAUTH_URL` → 値だけ（`"` なし）

例）  
❌ `"MbCJme3+xlYYrlG7f/CLqhjtT4uyUdmkt"`  
✅ `MbCJme3+xlYYrlG7f/CLqhjtT4uyUdmkt`

---

## 2. NEXTAUTH_URL を本番 URL に設定

**NEXTAUTH_URL** の値を、**Vercel の本番ドメイン** に書き換えてください。

1. Vercel → kintai-app → **Settings** → **Domains** を開く  
2. **Production** に表示されているドメイン（例: `kintai-app-khaki.vercel.app`）を確認  
3. そのドメインに `https://` を付けたものを入れる（例: `https://kintai-app-khaki.vercel.app`）

※ プレビュー用の長いURL（`kintai-xxxxx-sakagt3s-projects.vercel.app`）は使わないこと。

※ 先頭・末尾に `"` を付けないこと。

---

## 3. 保存後に Redeploy

1. 上記を **Save** する  
2. **Deployments** タブを開く  
3. 直近のデプロイの **⋯** → **Redeploy** を実行する  

以上でログイン・新規登録が本番で動作する想定です。
