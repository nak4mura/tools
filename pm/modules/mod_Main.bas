Attribute VB_Name = "mod_Main"
Option Explicit

'============================================================
' mod_Main - メイン処理エントリーポイント
' 山積み表ツール用モジュール
'============================================================

'============================================================
' 初期化処理
'============================================================

' プロジェクト初期化（メインエントリーポイント）
Public Sub InitializeProject()
    On Error GoTo ErrorHandler

    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual

    ' シートの存在確認・作成
    Call EnsureSheetsExist

    ' マスタシートの初期化
    Call InitializeMasterSheets

    ' メイン入力シートの構築
    Call SetupMainInputSheet

    ' 入力規則の設定
    Call SetupDataValidation

    ' 条件付き書式の設定
    Call SetupConditionalFormatting

    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True

    MsgBox "初期化が完了しました。", vbInformation, "山積み表ツール"
    Exit Sub

ErrorHandler:
    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True
    Call LogError("InitializeProject", Err.Number, Err.Description)
    MsgBox "初期化中にエラーが発生しました: " & Err.Description, vbCritical, "エラー"
End Sub

' シートの存在確認・作成
Private Sub EnsureSheetsExist()
    Dim sheetNames As Variant
    Dim i As Long

    sheetNames = Array( _
        SHEET_MAIN_INPUT, _
        SHEET_MASTER_PROCESS, _
        SHEET_MASTER_MEMBER, _
        SHEET_MASTER_HOLIDAY, _
        SHEET_MASTER_CONFIG, _
        SHEET_SUMMARY_MEMBER, _
        SHEET_SUMMARY_PROCESS, _
        SHEET_GANTT, _
        SHEET_DASHBOARD _
    )

    For i = LBound(sheetNames) To UBound(sheetNames)
        If Not SheetExists(sheetNames(i)) Then
            ThisWorkbook.Sheets.Add(After:=ThisWorkbook.Sheets(ThisWorkbook.Sheets.Count)).Name = sheetNames(i)
        End If
    Next i
End Sub

' マスタシートの初期化
Private Sub InitializeMasterSheets()
    Call InitializeProcessMaster
    Call InitializeMemberMaster
    Call InitializeHolidayMaster
    Call InitializeConfigMaster
End Sub

' 工程マスタの初期化
Private Sub InitializeProcessMaster()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MASTER_PROCESS)

    ' ヘッダー設定
    ws.Cells(1, colProcessID).Value = "工程ID"
    ws.Cells(1, colProcessName).Value = "工程名"
    ws.Cells(1, colProcessColor).Value = "色"
    ws.Cells(1, colProcessOrder).Value = "表示順"

    ' デフォルトデータ（データがない場合のみ追加）
    If GetLastRow(ws) = 1 Then
        Dim defaultData As Variant
        defaultData = Array( _
            Array("REQ", "要件定義", "#FF6B6B", 1), _
            Array("DES", "設計", "#4ECDC4", 2), _
            Array("DEV", "開発", "#45B7D1", 3), _
            Array("TST", "テスト", "#96CEB4", 4), _
            Array("REL", "リリース", "#FFEAA7", 5) _
        )

        Dim i As Long
        For i = LBound(defaultData) To UBound(defaultData)
            ws.Cells(i + 2, colProcessID).Value = defaultData(i)(0)
            ws.Cells(i + 2, colProcessName).Value = defaultData(i)(1)
            ws.Cells(i + 2, colProcessColor).Value = defaultData(i)(2)
            ws.Cells(i + 2, colProcessOrder).Value = defaultData(i)(3)
        Next i
    End If

    ' ヘッダー書式設定
    Call FormatHeaderRow(ws, 1, 4)
End Sub

' 担当者マスタの初期化
Private Sub InitializeMemberMaster()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MASTER_MEMBER)

    ' ヘッダー設定
    ws.Cells(1, colMemberID).Value = "担当者ID"
    ws.Cells(1, colMemberName).Value = "氏名"
    ws.Cells(1, colMemberDept).Value = "所属"
    ws.Cells(1, colMemberRole).Value = "役割"
    ws.Cells(1, colMemberOrder).Value = "表示順"

    ' ヘッダー書式設定
    Call FormatHeaderRow(ws, 1, 5)
End Sub

' 祝日マスタの初期化
Private Sub InitializeHolidayMaster()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MASTER_HOLIDAY)

    ' ヘッダー設定
    ws.Cells(1, colHolidayDate).Value = "日付"
    ws.Cells(1, colHolidayName).Value = "祝日名"
    ws.Cells(1, colHolidayType).Value = "種別"

    ' デフォルト祝日データ（2024-2025年度）
    If GetLastRow(ws) = 1 Then
        Call AddDefaultHolidays(ws)
    End If

    ' ヘッダー書式設定
    Call FormatHeaderRow(ws, 1, 3)
End Sub

' デフォルト祝日データ追加
Private Sub AddDefaultHolidays(ws As Worksheet)
    Dim holidays As Variant
    holidays = Array( _
        Array(DateSerial(2024, 1, 1), "元日", "国民の祝日"), _
        Array(DateSerial(2024, 1, 8), "成人の日", "国民の祝日"), _
        Array(DateSerial(2024, 2, 11), "建国記念の日", "国民の祝日"), _
        Array(DateSerial(2024, 2, 23), "天皇誕生日", "国民の祝日"), _
        Array(DateSerial(2024, 3, 20), "春分の日", "国民の祝日"), _
        Array(DateSerial(2024, 4, 29), "昭和の日", "国民の祝日"), _
        Array(DateSerial(2024, 5, 3), "憲法記念日", "国民の祝日"), _
        Array(DateSerial(2024, 5, 4), "みどりの日", "国民の祝日"), _
        Array(DateSerial(2024, 5, 5), "こどもの日", "国民の祝日"), _
        Array(DateSerial(2024, 7, 15), "海の日", "国民の祝日"), _
        Array(DateSerial(2024, 8, 11), "山の日", "国民の祝日"), _
        Array(DateSerial(2024, 9, 16), "敬老の日", "国民の祝日"), _
        Array(DateSerial(2024, 9, 22), "秋分の日", "国民の祝日"), _
        Array(DateSerial(2024, 10, 14), "スポーツの日", "国民の祝日"), _
        Array(DateSerial(2024, 11, 3), "文化の日", "国民の祝日"), _
        Array(DateSerial(2024, 11, 23), "勤労感謝の日", "国民の祝日"), _
        Array(DateSerial(2025, 1, 1), "元日", "国民の祝日"), _
        Array(DateSerial(2025, 1, 13), "成人の日", "国民の祝日"), _
        Array(DateSerial(2025, 2, 11), "建国記念の日", "国民の祝日"), _
        Array(DateSerial(2025, 2, 23), "天皇誕生日", "国民の祝日"), _
        Array(DateSerial(2025, 3, 20), "春分の日", "国民の祝日"), _
        Array(DateSerial(2025, 4, 29), "昭和の日", "国民の祝日"), _
        Array(DateSerial(2025, 5, 3), "憲法記念日", "国民の祝日"), _
        Array(DateSerial(2025, 5, 4), "みどりの日", "国民の祝日"), _
        Array(DateSerial(2025, 5, 5), "こどもの日", "国民の祝日"), _
        Array(DateSerial(2025, 7, 21), "海の日", "国民の祝日"), _
        Array(DateSerial(2025, 8, 11), "山の日", "国民の祝日"), _
        Array(DateSerial(2025, 9, 15), "敬老の日", "国民の祝日"), _
        Array(DateSerial(2025, 9, 23), "秋分の日", "国民の祝日"), _
        Array(DateSerial(2025, 10, 13), "スポーツの日", "国民の祝日"), _
        Array(DateSerial(2025, 11, 3), "文化の日", "国民の祝日"), _
        Array(DateSerial(2025, 11, 23), "勤労感謝の日", "国民の祝日") _
    )

    Dim i As Long
    For i = LBound(holidays) To UBound(holidays)
        ws.Cells(i + 2, colHolidayDate).Value = holidays(i)(0)
        ws.Cells(i + 2, colHolidayName).Value = holidays(i)(1)
        ws.Cells(i + 2, colHolidayType).Value = holidays(i)(2)
    Next i
End Sub

' 設定マスタの初期化
Private Sub InitializeConfigMaster()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MASTER_CONFIG)

    ' ヘッダー設定
    ws.Cells(1, colConfigItem).Value = "設定項目"
    ws.Cells(1, colConfigValue).Value = "設定値"

    ' デフォルト設定（データがない場合のみ追加）
    If GetLastRow(ws) = 1 Then
        ws.Cells(2, colConfigItem).Value = "対象年度"
        ws.Cells(2, colConfigValue).Value = Year(Date)

        ws.Cells(3, colConfigItem).Value = "年度開始月"
        ws.Cells(3, colConfigValue).Value = 4

        ws.Cells(4, colConfigItem).Value = "標準稼働時間/日"
        ws.Cells(4, colConfigValue).Value = 8

        ws.Cells(5, colConfigItem).Value = "過積載警告閾値"
        ws.Cells(5, colConfigValue).Value = 1.2
    End If

    ' ヘッダー書式設定
    Call FormatHeaderRow(ws, 1, 2)
End Sub

' ヘッダー行の書式設定
Private Sub FormatHeaderRow(ws As Worksheet, row As Long, lastCol As Long)
    With ws.Range(ws.Cells(row, 1), ws.Cells(row, lastCol))
        .Font.Bold = True
        .Interior.Color = RGB(200, 200, 200)
        .HorizontalAlignment = xlCenter
    End With
End Sub

' メイン入力シートの構築
Private Sub SetupMainInputSheet()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    ' シートクリア
    ws.Cells.Clear

    ' タイトル行
    ws.Cells(1, colMember).Value = "担当者"
    ws.Cells(1, colProcess).Value = "工程"

    ' 年度に基づいた月ヘッダー設定
    Dim targetYear As Integer
    Dim startMonth As Integer
    Dim i As Long

    targetYear = GetTargetYear()
    startMonth = GetFiscalYearStart()

    For i = 0 To 11
        Dim currentMonth As Integer
        Dim currentYear As Integer
        Dim colOffset As Long

        currentMonth = startMonth + i
        currentYear = targetYear

        If currentMonth > 12 Then
            currentMonth = currentMonth - 12
            currentYear = targetYear + 1
        End If

        colOffset = colMonthStart + i
        ws.Cells(1, colOffset).Value = currentYear & "/" & currentMonth
        ws.Cells(1, colOffset).NumberFormat = "yyyy/m"
    Next i

    ' 合計列
    ws.Cells(1, colMonthStart + 12).Value = "合計"

    ' ヘッダー書式設定
    Call FormatHeaderRow(ws, 1, colMonthStart + 12)

    ' 列幅調整
    ws.Columns(colMember).ColumnWidth = 15
    ws.Columns(colProcess).ColumnWidth = 12
    For i = 0 To 12
        ws.Columns(colMonthStart + i).ColumnWidth = 10
    Next i
End Sub

'============================================================
' 全体更新処理
'============================================================

' 全体更新
Public Sub RefreshAll()
    On Error GoTo ErrorHandler

    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual

    ' 工数計算
    Call CalculateWorkload

    ' サマリー生成
    Call GenerateMemberSummary
    Call GenerateProcessSummary

    ' グラフ更新
    Call UpdateCharts

    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True

    MsgBox "更新が完了しました。", vbInformation, "山積み表ツール"
    Exit Sub

ErrorHandler:
    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True
    Call LogError("RefreshAll", Err.Number, Err.Description)
    MsgBox "更新中にエラーが発生しました: " & Err.Description, vbCritical, "エラー"
End Sub
