# 404 DEPLOYMENT_NOT_FOUND を消す手順

**「このデプロイは見つかりません」** = 開いているURLが、もう存在しない（または失敗した）デプロイを指しています。

---

## やること（2つ）

### 1. 新しいデプロイを作る

どれか**1つ**を実行してください。

#### A. GitHub に push する（Vercel と連携している場合）

```bash
cd /Users/yudai/Desktop/kintai-app
git add .
git status   # 変更があれば
git commit -m "chore: trigger Vercel redeploy"
git push origin main
```

push 後、Vercel が自動でビルドし、**新しい本番デプロイ**ができます。

#### B. Vercel ダッシュボードから Redeploy

1. **https://vercel.com** にログイン
2. 対象プロジェクト（kintai-app など）を開く
3. **Deployments** タブ → 一覧のいちばん上にあるデプロイの **⋯** → **Redeploy**
4. **Use existing Build Cache** のチェックを**外す** → **Redeploy**
5. ステータスが **Ready** になるまで待つ（2〜5分）

---

### 2. 「本番用の正しいURL」を開く

**重要: ブックマークや昔のリンクは使わないでください。**

- **Vercel ダッシュボード**で、プロジェクトを開く
- 画面上部の **Visit** または **Production URL** をクリック  
  例: `https://kintai-app-xxxx.vercel.app`
- そのURLを**新しいタブ**で開く（シークレットウィンドウでも可）

この **Dashboard に表示されている Production URL** が、いま動いている本番のURLです。  
ここを開けば 404 は解消されます。

---

## まだ 404 になる場合

- **開いているURLを確認する**  
  `https://kintai-app-xxx-123abc.vercel.app` のような**プレビュー用URL**（長いハッシュ付き）だと、そのデプロイが消えると 404 になります。  
  → 必ず **プロジェクトの「Production」/「Visit」で表示されている短いURL** を開く。
- **キャッシュを外して開く**  
  シークレットウィンドウで開くか、`Cmd+Shift+R`（Mac）でハードリロード。
- **本番デプロイが1つも成功していない場合**  
  **Deployments** で直近がすべて Failed なら、**Redeploy** を実行して **Ready** になるまで待つ。  
  環境変数（`DATABASE_URL`, `AUTH_SECRET` など）が Vercel に設定されているかも確認する。

---

## まとめ

1. **新しいデプロイを作る**（push または Dashboard の Redeploy）
2. **Dashboard の「Production」/「Visit」のURLだけ**を使う
3. 古いURL・ブックマークは使わない

これで 404: DEPLOYMENT_NOT_FOUND は解消できます。
