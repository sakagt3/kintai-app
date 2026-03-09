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

## 2. Vercel の画面でやること（詳しい手順）

### 2-1. プロジェクトを開く

1. ブラウザで **https://vercel.com** を開き、ログインする。
2. 左上の **「Dashboard」** または **自分の名前／チーム名** をクリックする。
3. プロジェクト一覧から **「kintai-app」** をクリックする。  
   （一覧にない場合は、左上の検索や「All」で探す。）

---

### 2-2. 環境変数を追加する

1. 開いた **kintai-app** の画面で、**上タブの「Settings」** をクリックする。
2. 左サイドバーの **「Environment Variables」** をクリックする。
3. 次の4つを **1つずつ** 追加する。

---

#### ① DATABASE_URL

- **Key**（下をコピーして Vercel の Key 欄に貼り付け）:
```
DATABASE_URL
```
- **Value:** 自分の **.env** を開き、`DATABASE_URL=` の右側（接続文字列）を**そのままコピー**して Vercel の Value 欄に貼り付け。前後の `"` は付けない。
- **Environment:** **Production** にチェック → **Save**。

---

#### ② DIRECT_URL

- **「Add New」** をクリックしてから、
- **Key**（コピーして貼り付け）:
```
DIRECT_URL
```
- **Value:** .env の `DIRECT_URL=` の右側を**そのままコピー**して貼り付け。
- **Environment:** **Production** にチェック → **Save**。

---

#### ③ AUTH_SECRET

- **「Add New」** をクリックしてから、
- **Key**（コピーして貼り付け）:
```
AUTH_SECRET
```
- **Value:** .env の `AUTH_SECRET=` の右側を**そのままコピー**して貼り付け。
- **Environment:** **Production** にチェック → **Save**。

---

#### ④ AUTH_URL（Key も Value もそのままコピペ可）

- **「Add New」** をクリックしてから、
- **Key**（コピーして貼り付け）:
```
AUTH_URL
```
- **Value**（そのままコピーして貼り付け）:
```
https://kintai-app-khaki.vercel.app
```
- **Environment:** **Production** にチェック → **Save**。

---

### 2-3. 設定したあとに再デプロイする

1. 上タブの **「Deployments」** をクリックする。
2. 一番上にある **最新のデプロイ** の行の、右側の **「⋯」（3点リーダー）** をクリックする。
3. メニューから **「Redeploy」** をクリックする。
4. 出てきたウィンドウで **「Redeploy」** をもう一度クリックする。  
   （「Use existing Build Cache」のチェックは**外す**と安全。）
5. ステータスが **Building** → **Ready** になるまで待つ（1〜3分程度）。
6. **「Visit」** をクリックするか、**https://kintai-app-khaki.vercel.app** を開いて動作を確認する。

---

### 2-4. デプロイ状況だけ確認したいとき

1. **「Deployments」** タブを開く。
2. 一番上のデプロイが **緑の「Ready」** になっていれば、その時点のコードが本番に反映されている。
3. 本番URLは **「Domains」** タブ（Settings の左メニュー）でも確認できる。  
   → **kintai-app-khaki.vercel.app** が Production の正しいURL。

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
