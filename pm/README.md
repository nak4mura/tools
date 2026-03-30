# 山積み表ツール - セットアップガイド

## 概要

システムエンジニア向けの山積み表Excelツールです。人×月ごとの稼働や工程ごとの総工数を可視化できます。

### 主な機能
- 📊 **山積み入力**: 担当者×工程×月ごとの工数入力
- 📈 **サマリー機能**: 担当者別・工程別の工数集計
- 📉 **グラフ表示**: ガントチャート風ビジュアル、円グラフ、棒グラフ
- 📅 **稼働日数計算**: 土日・祝日を考慮した稼働日数自動計算
- ⚠️ **過積載警告**: 標準稼働時間の120%超過で警告表示

---

## セットアップ手順

### ステップ1: Excelファイルの生成

Pythonがインストールされている場合:

```bash
pip install xlsxwriter
python create_excel_structure.py
```

Pythonがない場合は、Excelを開いて手動でシートを作成してください（後述）。

### ステップ2: ExcelファイルにVBAモジュールをインポート

1. 生成された `山積み表ツール.xlsx` を開く
2. `.xlsm` 形式で保存（マクロ有効ブック）
3. `Alt + F11` でVBE（Visual Basic Editor）を開く
4. メニューから `ファイル > ファイルのインポート` を選択
5. `modules` フォルダ内の `.bas` ファイルをすべてインポート:
   - `mod_Utils.bas`
   - `mod_Main.bas`
   - `mod_Calculate.bas`
   - `mod_Holiday.bas`
   - `mod_DataEntry.bas`
   - `mod_Summary.bas`
   - `mod_Chart.bas`
6. VBEを閉じる
7. ファイルを保存

### ステップ3: 初期化実行

1. Excelで `Alt + F8` を押す
2. `InitializeProject` を選択して「実行」
3. シート構造とマスタデータが初期化されます

---

## 手動シート作成（Python不使用の場合）

以下の9シートを作成してください:

### 1. メイン入力
| A | B | C | D | ... | N | O |
|---|---|---|---|-----|---|---|
| 担当者 | 工程 | 2024/4 | 2024/5 | ... | 2025/3 | 合計 |

### 2. マスタ_工程
| A | B | C | D |
|---|---|---|---|
| 工程ID | 工程名 | 色 | 表示順 |
| REQ | 要件定義 | #FF6B6B | 1 |
| DES | 設計 | #4ECDC4 | 2 |
| DEV | 開発 | #45B7D1 | 3 |
| TST | テスト | #96CEB4 | 4 |
| REL | リリース | #FFEAA7 | 5 |

### 3. マスタ_担当者
| A | B | C | D | E |
|---|---|---|---|---|
| 担当者ID | 氏名 | 所属 | 役割 | 表示順 |

### 4. マスタ_祝日
| A | B | C |
|---|---|---|
| 日付 | 祝日名 | 種別 |

### 5. マスタ_設定
| A | B |
|---|---|
| 設定項目 | 設定値 |
| 対象年度 | 2024 |
| 年度開始月 | 4 |
| 標準稼働時間/日 | 8 |
| 過積載警告閾値 | 1.2 |

### 6. サマリー_担当者別
### 7. サマリー_工程別
### 8. ガントチャート
### 9. ダッシュボード

---

## 使い方

### 基本操作

1. **担当者追加**: `マスタ_担当者` シートに担当者情報を入力
2. **工程追加**: `マスタ_工程` シートに工程情報を入力
3. **工数入力**: `メイン入力` シートに担当者×工程ごとの工数を入力
4. **更新**: `Alt + F8` → `RefreshAll` を実行

### VBAマクロ一覧

| マクロ名 | 機能 |
|---------|------|
| `InitializeProject` | プロジェクト初期化 |
| `RefreshAll` | 全体更新（サマリー・グラフ再生成） |
| `AddWorkloadRow` | 新規行追加 |
| `DeleteSelectedRow` | 選択行削除 |
| `ClearAllData` | 全データクリア |
| `InsertSampleData` | サンプルデータ挿入 |

### ショートカットキーの設定（オプション）

VBEで以下のコードを `ThisWorkbook` モジュールに追加:

```vba
Private Sub Workbook_Open()
    ' ショートカットキー登録
    Application.OnKey "^+N", "AddWorkloadRow"  ' Ctrl+Shift+N: 行追加
    Application.OnKey "^+R", "RefreshAll"       ' Ctrl+Shift+R: 全体更新
End Sub

Private Sub Workbook_BeforeClose(Cancel As Boolean)
    ' ショートカットキー解除
    Application.OnKey "^+N"
    Application.OnKey "^+R"
End Sub
```

---

## カスタマイズ

### 工程の追加・変更

`マスタ_工程` シートで行を追加・編集:
- 工程ID: 一意の識別子（英数字）
- 工程名: 表示名
- 色: カラーコード（#RRGGBB形式）
- 表示順: 並び順

### 年度設定の変更

`マスタ_設定` シートで値を変更:
- 対象年度: 表示する年度
- 年度開始月: 4月以外の年度開始の場合に変更

### 祝日の追加

`マスタ_祝日` シートに祝日を追加:
- 日付: 祝日の日付
- 祝日名: 祝日の名称
- 種別: 「国民の祝日」など

---

## トラブルシューティング

### マクロが実行できない
- ファイルが `.xlsm` 形式で保存されているか確認
- Excelのセキュリティ設定でマクロが有効になっているか確認

### グラフが正しく表示されない
- `RefreshAll` マクロを再実行
- `InitializeProject` で初期化し直す

### 祝日計算が正しくない
- `マスタ_祝日` シートに祝日データが正しく入力されているか確認

---

## ファイル構成

```
pm/
├── README.md                       # このガイド
├── create_excel_structure.py       # Excel生成スクリプト
├── modules/
│   ├── mod_Utils.bas              # 共通ユーティリティ
│   ├── mod_Main.bas               # メイン処理
│   ├── mod_Calculate.bas          # 工数計算
│   ├── mod_Holiday.bas            # 祝日管理
│   ├── mod_DataEntry.bas          # データ入力支援
│   ├── mod_Summary.bas            # サマリー生成
│   └── mod_Chart.bas              # グラフ生成
└── 山積み表ツール.xlsm             # 生成されるExcelファイル
```

---

## 動作環境

- Microsoft Excel 2016以降
- Windows 10 / 11 または macOS

---

## ライセンス

MIT License
