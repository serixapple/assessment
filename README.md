# CERO 審査事例集

CEROレーティング審査事例のデータベースシステム。Claudeを使った自然言語での類似事例検索機能付き。

## 機能

- **事例一覧ページ** — CERO A〜Zのフィルタリング
- **AI類似検索** — Claudeを使った自然言語クエリ（「こういう表現に似た事例は？」）
- **事例詳細ページ** — 審査番号、タイトル名、事例概要、参考資料（動画・写真）
- **事例登録フォーム** — Webフォームから新規事例を登録

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env
```

`.env` を編集して Anthropic API キーを設定：

```
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. データベースの初期化

```bash
npx prisma migrate dev
```

### 4. サンプルデータの投入（オプション）

```bash
DATABASE_URL="file:./dev.db" npx ts-node --esm prisma/seed.ts
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開く。

## 技術スタック

| 分野 | 技術 |
|------|------|
| フレームワーク | Next.js 16 (App Router) + TypeScript |
| スタイリング | Tailwind CSS v4 |
| データベース | SQLite（Prisma 7 + libsql adapter） |
| AI検索 | Claude (claude-haiku-4-5) via Anthropic API |
| ファイル保存 | ローカルファイルシステム (`/public/uploads/`) |

## CEROレーティング

| レーティング | 対象年齢 |
|-------------|---------|
| A | 全年齢対象 |
| B | 12才以上対象 |
| C | 15才以上対象 |
| D | 17才以上対象 |
| Z | 18才以上のみ対象 |

## API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/cases` | 事例一覧（`?rating=A`でフィルタ） |
| POST | `/api/cases` | 新規事例作成 |
| GET | `/api/cases/:id` | 事例詳細 |
| DELETE | `/api/cases/:id` | 事例削除 |
| POST | `/api/search` | AI類似検索 |
| POST | `/api/upload` | ファイルアップロード |
