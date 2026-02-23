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
- プロジェクトID: `dummy-app-xxxxx`
- 認証: Google認証（メールアドレスでアクセス制限: `dummy@gmail.com`）

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
    - **日本語ソート対応**: ドロップダウンリストのタグを「あいうえお順」でソート（`Intl.Collator`を使用）
    - **タグ一括削除機能**: 設定画面（Settings）に「タグ管理」セクションを追加し、不要なタグを一括削除可能に（使用中の全レコードから削除）
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
23. **開発環境の改善 & バグ修正**
    - 開発環境でPWAを無効化してworkboxエラーを回避
    - 本番環境のみでPWAを有効化
    - **SSRエラー修正**: サーバーサイドレンダリング時にIndexedDB（`persistentLocalCache`）にアクセスして発生するInternal Server Errorを修正（`lib/firebase.ts`で条件分岐を追加）

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

---
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

## 更新履歴

- **2025-11-29**: 初期開発完了
- **2025-11-30**: 機能追加フェーズ1、Vercelデプロイ、PWAインストール機能追加
- **2025-12-04**: タグ機能、CSVエクスポート機能追加
- **2025-12-05**: UI改善（入力フィールドの視認性向上）
- **2025-12-13〜14**: UI/UX改善フェーズ3（時間表示修正、タグオートコンプリート、フィルターバー折りたたみ、カテゴリ不一致修正、マップ表示改善、開発環境改善）
- **2025-12-15**: 
    - **カテゴリごとのマップ表示設定**: 設定画面からカテゴリごとにマップへの表示/非表示を切り替えられる機能を追加
    - **開発環境のPWA無効化**: localhostでのService Workerエラー（真っ白な画面）を解消するため、開発モード時はPWAを無効化する設定を追加
- **2025-12-20**:
    - **写真の個別削除機能**: 編集画面で既存の写真を1枚ずつ削除可能に（保存時に削除実行）
    - **ランディングページの変更**: ルートURL（`/`）のアクセス先をマップから新規登録画面（`/records/new`）に変更し、アクセス性を向上
    - **カレンダービューの実装**: タイムラインにリスト表示とカレンダー表示の切り替え機能を追加。月ごとに記録を確認可能に

---

- **2025-12-23**:
    - **マップ機能の強化**:
        - **現在地表示**: マップ初期表示時にBrowser Geolocation APIを使用して現在地を中心に表示
        - **場所検索機能**: マップ画面に検索バーを追加。記録のメモやタグを検索して、選択したピンの位置へスムーズに移動（FlyTo）
        - **自動ズーム（Auto-fit）**: フィルター適用時、該当するピンがすべて収まるようにマップ範囲を自動調整

---

- **2025-12-26**:
    - **アプリアイコンの刷新**:
        - デザインを一新し、モバイル端末での視認性を考慮した「マスかブル（Maskable）」対応アイコンを作成
        - アイコン内の要素（手帳・肉球）を極力大きく表示されるように最適化（Zoomed-in version）
    - **メタデータの修正**: `layout.tsx`のタイトルを「Footprint App」に変更
    - **Next.js App Routerアイコン設定**: `icon.png`, `apple-icon.png` を配置し、Favicon生成を自動化

---

- **2025-12-28**:
    - **CSVインポート機能の強化**:
        - **IDによる更新対応**: CSVに`id`列を追加し、インポート時に既存データを更新（重複回避）できるように改善
        - **画像URL対応**: CSVエクスポート/インポート時に画像URLを維持するように修正（`imageUrls`列）
        - **ヘッダーの柔軟性向上**: 大文字小文字や空白を許容するようにパーサーを調整（`Category` vs `category`など）
    - **アプリの安定性向上（クラッシュ修正）**:
        - **タイムライン/マップ/統計画面**: 場所情報（`location`）がないデータが含まれていてもクラッシュしないようにガード処理を追加（CSVインポートデータ対策）
        - **ビルドエラー修正**: 削除済みの型を参照していた不要ファイル（`AreaEditForm.tsx`）を削除
    - **デザイン刷新**: テーマカラーを青系からアプリの雰囲気に合わせた暖色系に変更
    - **Vercelデプロイ設定**: 本番環境変数の不足（`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`）を解消し、最新版をデプロイ

---

- **2026-01-12**:
    - **マップ機能の大幅改善**:
        - **近接ピンのグループ化（Proximity Grouping）**: GPS誤差によるピンの重なりを解消するため、約5m以内の記録を視覚的にグループ化（スナップ）する機能を実装。クリックで重なったピンをスムーズに巡回可能に。
        - **カテゴリ別ピン色分け**: 設定画面（Category Manager）にカラーパレットを追加。カテゴリごとにピンの色（10色から選択）をカスタマイズできるように変更。デフォルトは青。
    - **ドキュメント更新**:
        - README.mdを最新の機能（マップ改善、統計、CSV管理など）に合わせて全面的にリライト。
        - 画面キャプチャ（マップ、入力画面、タイムライン、設定など）を追加し、視覚的な説明を強化。
        - walkthrough.mdを日本語化し、今回のマップ改善の詳細を記録。

---

- **2026-02-23〜24（今回のセッション）**:
    - **ビルドエラーの修正**:
        - `CategoryManager.tsx` のリファクタリング時に消失したと思われるステート（`loading`, `error`）と関数（`loadCategories`, `saveCategories`, `handleDelete`, `handleReset`）を復元。
        - Vercel でのビルド失敗（`npm run build` エラー）を解消し、デプロイ成功を確認。
    - **写真から位置情報が取得できない問題の修正（`lib/exif.ts`）**:
        - 手動のDMS（度分秒→10進変換）に頼らず、`exifr.gps()` という専用の公式APIを使うように変更。
        - 配列の長さが3以外でも緯度経度を正しく計算できるよう、DMS変換関数を柔軟化（`dms.length >= 1` に変更）。
        - 緯度経度のリファレンス（南緯`S`・西経`W`の際のマイナス符号処理）を追加。
        - エラー発生時にエラーメッセージ文字列を返すよう改善（デバッグしやすさ向上）。
    - **マップにピンが表示されない問題を修正（キー名不一致）**:
        - カテゴリー設定のFirestore保存キーが `list` → `items` に変わったことで、マップ表示（`app/map/page.tsx`）・レコード新規作成（`components/RecordForm.tsx`）・フィルターバー（`components/FilterBar.tsx`）の3ファイルで設定が読み込めなくなっていた問題を修正。
        - `docSnap.data().items || docSnap.data().list` として新旧両方のキー名に対応。
    - **GPS不在時の警告表示の追加（`components/RecordForm.tsx`）**:
        - 写真にGPS情報が含まれていない場合、「写真に位置情報(GPS)が含まれていません。端末の現在地を使用します。」というトースト警告を出すように追加。
    - **Androidの写真ピッカー（Photo Picker）によるGPS削除問題への回避策（部分対応）**:
        - `input[type="file"]` の `accept` 属性を `image/*` から `image/jpeg, image/png, image/heic, .jpg, .jpeg, .png, .heic` に変更し、Androidがレガシーファイルピッカーを起動するよう誘導を試みた。
        - **結果：効果なし。** Pixel 9a + Android最新版では、`accept` 属性の値に関わらず強制的に写真ピッカー（Googleフォト連携のピッカーUI）が起動し、この画面に渡されたファイルはOSによってEXIF位置情報が削除されてしまう。

---

## ⚠️ 未解決・引き継ぎ事項（次回のAIへ）

### 現在の状況

- ユーザーの端末: **Android Pixel 9a**
- ログインURL: **https://footprint-app.vercel.app/** （このURLのみFirebaseの認証を通過可能）
- PC（Windows）のChromeでGoogleフォトからダウンロードした写真をアップロードすると、**EXIF位置情報は正常に取得できる。**
- しかし、**AndroidスマホのPWAアプリやChromeブラウザから写真を選択した場合のみ、OSのPhoto Picker（写真ピッカー）が必ず起動し、そこから渡されてくるファイルにはEXIF位置情報が含まれていない。**（OSレベルのプライバシー保護機能による自動削除）

### 提案済みの次の対応策：Web Share Target API の実装

この問題を根本的に解決する唯一の方法として、**「Web Share Target API」** の実装を提案済み。

**概要:**
- PWAアプリ（`manifest.json` と Service Worker）に `share_target` を設定することで、Footprint App を**Androidの「共有（Share）」メニューに宛先として登録**できる。
- ユーザーはGoogleフォトなどから写真を選び、「共有」ボタン → 「Footprint App」にタップして送信することで、**ブラウザのファイルピッカーを一切経由しない**ため、OSによるGPS削除が発生しない。
- 受け取ったファイルを `/records/new` ページで処理し、フォームに写真と位置情報を自動入力する。

**現在のGitの状態:**
- 作業用ブランチ `feature/web-share-target` を作成済み（`main` は現在の安定版を維持）。
- ただし、このブランチをVercelにプッシュすると「テスト専用のプレビューURL」が発行され、そのURLへのログインは**FirebaseのConsoleで `Authorized domains（承認済みドメイン）`** に当該URLを追加しない限り `auth/unauthorized-domain` エラーになる。

**ユーザーの判断待ち（次回再開時に確認）:**
- **A案:** `feature/web-share-target` ブランチで開発 → Vercelのプレビュー専用URLをFirebaseに登録してテスト → OKならmainにマージ（安全だが、Firebaseの設定作業が1回必要）
- **B案:** `main` ブランチに直接実装 → 不具合があれば即リバート（手軽だが、一時的にメイン環境に影響が出る可能性あり）

**変更が必要になるファイル（Web Share Target 実装時）:**
1. `public/manifest.json` — `share_target` の追記
2. `app/records/new/page.tsx` or `app/records/new/_shareHandler.tsx` — 共有されたファイルを受け取る新規ロジック
3. `components/RecordForm.tsx` — 共有で渡されたファイルをフォームに自動セットするロジック

**最終更新**: 2026-02-24 03:30（次回AI引き継ぎ用サマリーを追記）



