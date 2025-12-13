# Footprint App - 開発進捗記録

## プロジェクト概要
個人用のフットプリント（足跡）記録アプリ。写真と位置情報を紐づけて記録し、タイムラインやマップで振り返ることができるPWA（Progressive Web App）。

**技術スタック:**
- **フロントエンド**: Next.js 16.0.5 (App Router), React 19.2.0, TypeScript
- **スタイリング**: Tailwind CSS v4
- **バックエンド**: Firebase (Authentication, Firestore, Storage)
- **地図**: OpenStreetMap (react-leaflet)
- **PWA**: @ducanh2912/next-pwa
- **デプロイ**: Vercel
- **バージョン管理**: GitHub (リポジトリ: `calico-blanket/footprint-app`)

**Firebase プロジェクト:**
- プロジェクトID: `footprint-app-e48fa`
- 認証: Google認証（メールアドレスでアクセス制限: `sesame0518@gmail.com`）

**デプロイURL:**
- Vercel: `https://footprint-app-[ランダム文字列].vercel.app`

---

## 開発の経緯

### 初期開発（2025-11-29）
1. Next.jsプロジェクトの作成とFirebaseセットアップ
2. Google認証の実装（メールアドレスによるアクセス制限）
3. 基本的なCRUD機能の実装
   - 記録の作成・編集・削除
   - 写真アップロード（最大5枚、圧縮機能付き）
   - EXIF情報の自動抽出（位置情報・撮影日時）
4. マップビューとタイムラインビューの実装
5. フィルター機能（カテゴリ、日付範囲、キーワード検索）
6. オフライン対応（IndexedDB使用）
7. データのインポート/エクスポート（JSON形式）

### 機能追加フェーズ1（2025-11-30）
8. **写真ズーム/ライトボックス機能**
   - タイムラインと記録フォームで写真をクリックすると全画面表示
   - 矢印キーで前後の写真に移動、ESCで閉じる
9. **カテゴリカスタマイズ機能**
   - 設定画面からカテゴリの追加・編集・削除が可能
   - ユーザーごとにFirestoreに保存
10. **統計ダッシュボード**
    - 総記録数、写真数、ユニーク位置数
    - カテゴリ別内訳、月別アクティビティ、トップ位置
11. **タイムラインからマップへのリンク**
    - タイムラインの座標をクリックするとマップページに遷移し、その位置を中心に表示

### デプロイフェーズ（2025-11-30）
12. GitHubリポジトリの作成とコードのプッシュ
13. Vercelへのデプロイ
    - ビルドエラーの修正（Turbopack/Webpack競合、TypeScript型エラー、Suspense対応）
    - Firebase Authenticationの承認済みドメイン設定
14. PWAインストール機能の追加
    - 設定画面に「アプリをインストール」セクションを追加
    - Android/iOSそれぞれの手順を表示

### 機能追加フェーズ2（2025-12-04）
15. **タグ機能**
    - 記録にタグを追加・削除可能
    - タイムラインとマップでタグを表示
    - フィルターバーでタグ検索が可能
16. **CSVエクスポート機能**
    - 設定画面から全記録をCSV形式でエクスポート
    - Excel互換（BOM付きUTF-8）
    - カテゴリ、日時、メモ、タグ、画像URL、緯度、経度を含む

### UI改善（2025-12-05）
17. **入力フィールドの視認性向上**
    - 記録フォームの入力欄の文字色を濃く変更（`text-gray-900`）
    - タグ、日時、緯度、経度、メモの各入力欄に適用

### UI/UX改善フェーズ3（2025-12-13〜14）
18. **時間表示の修正**
    - UTC/JSTのタイムゾーン問題を解決（9時間ずれを修正）
    - `formatDateTimeLocal`関数を追加してローカルタイムゾーンで正しく表示
    - EXIF日時の取得時もタイムゾーンを考慮
19. **タグ機能の大幅強化**
    - オートコンプリート機能：既存タグの候補を入力中に表示
    - 矢印キー（↑↓）で候補選択、Enterで追加
    - カンマ区切りで複数タグを一度に入力可能（例: 旅行,東京,グルメ）
    - サンプル表示を追加（「例: 旅行, 東京, グルメ (#は不要です)」）
    - 入力欄と追加ボタンのサイズを適切に調整
20. **フィルターバーの折りたたみ機能**
    - スマホでの画面占有問題を解決
    - デフォルトで折りたたまれた状態に変更
    - 🔍フィルターボタンをタップして展開/折りたたみ
    - フィルター適用中は「適用中」バッジを表示
    - 「フィルターをクリア」ボタンを追加
    - ラベルを日本語化（開始日、終了日、カテゴリ、タグ、キーワード）
    - タイムラインとマップの両方に適用
21. **カテゴリの不一致問題を修正**
    - FilterBarがFirestoreからユーザーのカスタムカテゴリを読み込むように変更
    - RecordFormとFilterBarのカテゴリリストが一致するように修正
    - ハードコードされたカテゴリリストを削除
22. **マップ表示の改善**
    - 家事カテゴリの記録をマップ上に表示しないように変更
    - タイムラインには引き続き表示（マップのみ非表示）
23. **開発環境の改善**
    - 開発環境でPWAを無効化してworkboxエラーを回避
    - 本番環境のみでPWAを有効化

---

## 実装が完了した機能

### 認証・セキュリティ
- ✅ Google認証（Firebase Authentication）
- ✅ メールアドレスによるアクセス制限（`NEXT_PUBLIC_ALLOWED_EMAILS`）
- ✅ Firestoreセキュリティルール（ユーザーIDベースのアクセス制御）

### 記録管理（CRUD）
- ✅ 記録の作成・編集・削除
- ✅ 写真アップロード（最大5枚、圧縮機能付き）
- ✅ EXIF情報の自動抽出（位置情報・撮影日時）
- ✅ 現在地の自動取得
- ✅ カテゴリ選択（カスタマイズ可能）
- ✅ タグ追加・削除
- ✅ メモ入力

### 表示・閲覧
- ✅ タイムラインビュー（日付降順）
- ✅ マップビュー（OpenStreetMap）
- ✅ 写真ライトボックス（全画面表示、矢印キーナビゲーション）
- ✅ タイムラインからマップへのリンク（座標クリック）
- ✅ 統計ダッシュボード

### フィルター・検索
- ✅ カテゴリフィルター
- ✅ 日付範囲フィルター
- ✅ キーワード検索（メモ内容）
- ✅ タグ検索

### データ管理
- ✅ JSONエクスポート/インポート
- ✅ CSVエクスポート（Excel互換）
- ✅ オフライン対応（IndexedDB）
- ✅ オンライン時の自動同期

### カスタマイズ
- ✅ カテゴリのカスタマイズ（追加・編集・削除）
- ✅ ユーザーごとの設定保存（Firestore）

### PWA・デプロイ
- ✅ PWA対応（Service Worker、マニフェスト）
- ✅ ホーム画面へのインストール機能
- ✅ Vercelへのデプロイ
- ✅ GitHubリポジトリ管理

---

## 技術的な詳細

### ディレクトリ構成
```
footprint-app/
├── app/                    # Next.js App Router
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx           # ホームページ
│   ├── map/
│   │   └── page.tsx       # マップページ
│   ├── records/
│   │   ├── new/
│   │   │   └── page.tsx   # 新規記録作成
│   │   └── [id]/
│   │       └── page.tsx   # 記録編集
│   ├── settings/
│   │   └── page.tsx       # 設定ページ
│   ├── stats/
│   │   └── page.tsx       # 統計ダッシュボード
│   └── timeline/
│       └── page.tsx       # タイムラインページ
├── components/            # Reactコンポーネント
│   ├── AuthProvider.tsx   # 認証プロバイダー
│   ├── CategoryManager.tsx # カテゴリ管理
│   ├── ConfirmDialog.tsx  # 確認ダイアログ
│   ├── DataManagement.tsx # データ管理（エクスポート/インポート）
│   ├── FilterBar.tsx      # フィルターバー
│   ├── ImageLightbox.tsx  # 画像ライトボックス
│   ├── InstallPrompt.tsx  # PWAインストールプロンプト
│   ├── LoadingSpinner.tsx # ローディング表示
│   ├── MapView.tsx        # マップビュー
│   ├── Navbar.tsx         # ナビゲーションバー
│   ├── RecordForm.tsx     # 記録フォーム
│   ├── SyncManager.tsx    # オフライン同期マネージャー
│   ├── TimelineView.tsx   # タイムラインビュー
│   └── ToastProvider.tsx  # トースト通知プロバイダー
├── lib/                   # ユーティリティ・ライブラリ
│   ├── compression.ts     # 画像圧縮
│   ├── exif.ts           # EXIF情報抽出
│   ├── firebase.ts       # Firebase初期化
│   ├── firestore.ts      # Firestoreヘルパー
│   ├── idb.ts            # IndexedDB（オフライン対応）
│   ├── storage.ts        # Firebase Storage操作
│   └── types.ts          # TypeScript型定義
├── public/               # 静的ファイル
│   ├── icons/            # PWAアイコン
│   ├── manifest.json     # PWAマニフェスト
│   └── sw.js            # Service Worker
├── .env.local           # 環境変数（Gitignore）
├── next.config.ts       # Next.js設定
├── package.json
└── tsconfig.json
```

### 重要なファイル

#### `lib/types.ts`
```typescript
export interface Record {
    id: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    date: Timestamp;
    location: { lat: number; lng: number };
    memo: string;
    category: string;
    tags?: string[];
    imageUrls: string[];
    syncedFromOffline: boolean;
    userId: string;
}
```

#### 環境変数（`.env.local`）
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDtaJyvmin9jHpF78ML9SHIIcqcUo4D23U
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=footprint-app-e48fa.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=footprint-app-e48fa
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=footprint-app-e48fa.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=453237862592
NEXT_PUBLIC_FIREBASE_APP_ID=1:453237862592:web:e94a7d4734e5fd25
NEXT_PUBLIC_ALLOWED_EMAILS=sesame0518@gmail.com
```

### ビルド設定の注意点
- `package.json`の`build`スクリプトは`next build --webpack`を使用（Turbopack競合回避）
- `next.config.ts`で`@ducanh2912/next-pwa`を使用（`skipWaiting`プロパティは削除済み）
- `app/map/page.tsx`は`Suspense`でラップ（`useSearchParams`使用のため）

---

## 既知の問題・制限事項

### 解決済み
1. ~~Turbopack/Webpack競合エラー~~ → `--webpack`フラグで解決
2. ~~TypeScript型エラー（`Record`型の競合）~~ → `Record as FootprintRecord`にエイリアス
3. ~~マップページのプリレンダリングエラー~~ → `Suspense`でラップ
4. ~~PWAインストールボタンが表示されない~~ → `InstallPrompt`コンポーネント追加
5. ~~CSVエクスポートがAndroidで正しく動作しない~~ → ダウンロードフォルダに正常に保存されることを確認（OneDrive誘導は端末設定の問題）
6. ~~入力フィールドの文字が薄い~~ → `text-gray-900`を追加

### 現在の制限事項
- **地図サービス**: OpenStreetMapを使用（Google Maps APIキー不要）
- **写真の最大枚数**: 1記録あたり5枚まで
- **オフライン機能**: 新規作成と更新のみ対応（削除は未対応）
- **認証**: Googleアカウントのみ（メールアドレス制限あり）

---

## 次にやるべきタスク

### 優先度: 高
現時点で特になし（すべての主要機能が実装済み）

### 優先度: 中（将来的な改善案）
1. **写真の削除機能の強化**
   - 記録編集時に既存の写真を個別に削除できるようにする
   - 現在は新規追加のみ対応

2. **オフライン削除対応**
   - オフライン時の記録削除をキューに追加し、オンライン時に同期

3. **検索機能の強化**
   - 複数タグの AND/OR 検索
   - 位置情報による範囲検索

4. **パフォーマンス最適化**
   - 記録が増えた場合のページネーション
   - 画像の遅延読み込み（Lazy Loading）

5. **UI/UX改善**
   - ダークモード対応
   - マップのクラスタリング（記録が密集している場合）
   - ドラッグ&ドロップでの写真アップロード

### 優先度: 低（アイデア）
1. **共有機能**
   - 特定の記録を他のユーザーと共有
   - 公開リンクの生成

2. **バックアップ機能**
   - 定期的な自動バックアップ
   - Google Driveへのバックアップ

3. **多言語対応**
   - 英語版の追加

---

## 改善点の提案

### コードの品質
1. **テストの追加**
   - 現在テストコードなし
   - Jest + React Testing Libraryの導入を検討

2. **エラーハンドリングの統一**
   - エラーメッセージの一元管理
   - エラーログの収集（Sentryなど）

3. **型安全性の向上**
   - Firestoreのデータ型をより厳密に定義
   - Zodなどのバリデーションライブラリの導入

### パフォーマンス
1. **画像最適化**
   - Next.js Imageコンポーネントの活用
   - WebP形式への変換

2. **バンドルサイズの削減**
   - 未使用ライブラリの削除
   - Code Splittingの最適化

### セキュリティ
1. **環境変数の管理**
   - Vercelの環境変数機能を活用
   - シークレット情報の暗号化

2. **CSRFトークンの実装**
   - フォーム送信時のセキュリティ強化

---

## デバッグ・トラブルシューティング

### よくある問題と解決方法

#### 1. ビルドエラー
**問題**: `npm run build`でエラーが発生
**解決**:
- `node_modules`を削除して`npm install`を再実行
- `next.config.ts`の設定を確認
- TypeScriptエラーを確認（`npm run lint`）

#### 2. Firebase接続エラー
**問題**: 認証やデータ取得ができない
**解決**:
- `.env.local`の環境変数を確認
- Firebase Consoleでプロジェクト設定を確認
- ブラウザのコンソールでエラーメッセージを確認

#### 3. PWAがインストールできない
**問題**: ホーム画面に追加できない
**解決**:
- HTTPSで接続していることを確認（Vercelは自動的にHTTPS）
- `manifest.json`が正しく読み込まれているか確認
- Service Workerが登録されているか確認（DevTools > Application）

#### 4. 画像がアップロードできない
**問題**: 写真を選択しても保存されない
**解決**:
- Firebase Storageのルールを確認
- ブラウザのコンソールでエラーを確認
- ファイルサイズが大きすぎないか確認（圧縮機能が動作しているか）

---

## 開発環境のセットアップ手順

### 前提条件
- Node.js 20以上
- npm または yarn
- Firebaseプロジェクト
- Vercelアカウント（デプロイ用）
- GitHubアカウント

### 初回セットアップ
```bash
# リポジトリのクローン
git clone https://github.com/calico-blanket/footprint-app.git
cd footprint-app

# 依存関係のインストール
npm install

# 環境変数の設定
# .env.local ファイルを作成し、Firebase設定を記述

# 開発サーバーの起動
npm run dev
```

### デプロイ手順
```bash
# ビルドの確認
npm run build

# Gitにコミット
git add .
git commit -m "Update"
git push origin main

# Vercelが自動的にデプロイ
```

---

## 連絡先・リソース

- **GitHubリポジトリ**: https://github.com/calico-blanket/footprint-app
- **Firebaseコンソール**: https://console.firebase.google.com/project/footprint-app-e48fa
- **Vercelダッシュボード**: https://vercel.com/dashboard

---

## 更新履歴

- **2025-11-29**: 初期開発完了
- **2025-11-30**: 機能追加フェーズ1、Vercelデプロイ、PWAインストール機能追加
- **2025-12-04**: タグ機能、CSVエクスポート機能追加
- **2025-12-05**: UI改善（入力フィールドの視認性向上）
- **2025-12-13〜14**: UI/UX改善フェーズ3（時間表示修正、タグオートコンプリート、フィルターバー折りたたみ、カテゴリ不一致修正、マップ表示改善、開発環境改善）

---

**最終更新**: 2025-12-14 02:02
