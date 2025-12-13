# Footprint App

自分だけの足跡（フットプリント）を記録する、プライベートなライフログアプリケーション。
写真、位置情報、タグ、メモを紐付けて記録し、地図やタイムラインで振り返ることができます。PWA対応でスマホアプリとしても動作します。

## 主な機能

### 📝 記録する
- **写真記録**: 1件につき最大5枚まで写真をアップロード可能（自動圧縮機能付き）
- **位置情報**: EXIFデータから自動取得、または現在地を取得。地図上で場所を指定することも可能
- **詳細情報**: メモ、カスタムカテゴリ、タグ付け機能
- **自動入力**: 撮影日時や撮影場所を写真から自動抽出

### 🗺️ 振り返る
- **タイムラインビュー**: 時系列で思い出をスクロール表示。フィルター機能（日付、タグ、キーワード）付き
- **マップビュー**: 地図上に足跡をピン表示。カテゴリごとにアイコンが変化
- **詳細ビュー**: 写真を全画面表示できるライトボックス機能

### ⚙️ 管理する
- **オフライン対応**: 電波がない場所でも閲覧・記録が可能（次回起動時に同期）
- **データ管理**: JSON/CSV形式でのエクスポート・インポート対応
- **カスタマイズ**: 自分だけのカテゴリやタグを作成・管理（設定画面で一括削除も可能）
- **プライバシー**: Google認証によるログイン制限（許可されたメールアドレスのみアクセス可能）

## 技術スタック
- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Map**: React-Leaflet (OpenStreetMap)
- **PWA**: next-pwa

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Environment Variables
Create `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# ... (see PROGRESS.md for details)
```
