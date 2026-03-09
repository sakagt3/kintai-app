# Vercel 404 / DEPLOYMENT_NOT_FOUND 復旧手順（Habit Logic）

## 1. クリーンビルドで再デプロイ

### 推奨: Vercel ダッシュボードから

1. **https://vercel.com** にログイン
2. 対象プロジェクト（Habit Logic / kintai-app）を開く
3. **Deployments** タブを開く
4. いちばん上のデプロイの **⋯（三点メニュー）** → **Redeploy**
5. **「Use existing Build Cache」のチェックを外す**（クリーンビルド）
6. **Redeploy** をクリック
7. ビルドが **Ready** になるまで待つ（2〜5分程度）

### 別の方法: ローカルで Vercel CLI

```bash
npx vercel login    # 未ログインの場合のみ
npx vercel --prod --force
```

実行後、ターミナルに表示される **Production** の URL が本番アドレスです。

---

## 2. 実際に動く URL の確認

- **Vercel ダッシュボード** → プロジェクト → **Settings** → **Domains**
- または **Deployments** → 一番上の **Ready** なデプロイをクリック → 表示される **Visit** の URL

よくあるパターン:

- `https://kintai-app-xxxx.vercel.app`
- `https://kintai-app-<チーム名>.vercel.app`
- カスタムドメインを設定している場合はその URL

**友人に送る URL**: 上記の本番 URL のトップ（例: `https://kintai-app-xxxx.vercel.app`）を送れば、開くと自動で **Habit Logic のログイン画面** に遷移します。

---

## 3. 404 が続く場合の確認

- 開いている URL が **いまのプロジェクトの「本番」デプロイ** のものか確認する（古い・別デプロイの URL だと 404 や DEPLOYMENT_NOT_FOUND になります）
- ブラウザの **ハードリロード**: Mac は `Cmd + Shift + R`、Windows は `Ctrl + Shift + R`
- プロジェクト名を「Habit Logic」に変更した場合、Vercel の **プロジェクト表示名** は変わっても **URL（ドメイン）は通常そのまま** です。Settings → Domains で表示されている URL をそのまま使ってください。
