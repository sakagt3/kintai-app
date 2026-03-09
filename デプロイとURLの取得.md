# Vercel 再デプロイと本番 URL の取得（至急用）

## 手順（ターミナルで実行）

### 1. ログイン（初回またはトークン期限切れ時）

```bash
npx vercel login
```

ブラウザが開くので、Vercel アカウントでログインしてください。

---

### 2. 本番へ強制デプロイ

```bash
cd /Users/yudai/Desktop/kintai-app
npx vercel --prod --force
```

または:

```bash
npm run deploy
```

---

### 3. 本番 URL の特定

コマンド完了後、ターミナルに次のような行が出ます:

```
✅  Production: https://kintai-app-xxxx.vercel.app [2m]
```

この **`https://...` の URL** が本番の Production URL です。

- 友人に送る URL: この URL をそのまま送れば、開くと Habit Logic のログイン画面が表示されます。
- 404 解消の確認: ブラウザでこの URL を開き、ログイン画面が表示されれば OK です。

---

### 4. プロジェクト未リンクの場合

初めて `vercel` を実行すると、「Link to existing project?」と聞かれることがあります。

- **Yes** → 表示される一覧から **kintai-app**（または該当プロジェクト）を選ぶ
- 新規作成する場合は **No** を選び、プロジェクト名を入力（例: `kintai-app`）

リンク後、再度 `npx vercel --prod --force` を実行すると、上記の Production URL が表示されます。

---

## まとめ: 実際に動く URL について

**URL は Vercel がデプロイ完了時に発行するため、実行結果にのみ表示されます。**

- 上記 **手順 2** を**あなたのターミナル**で実行
- 出力の **`Production: https://...`** の部分が、そのまま「実際にアクセス可能な本番 URL」です。
- リポジトリは `github.com/sakagt3/kintai-app` に紐づいているため、Vercel で同じプロジェクトにデプロイしていれば、URL は通常 **`https://kintai-app-<サフィックス>.vercel.app`** の形式になります。
