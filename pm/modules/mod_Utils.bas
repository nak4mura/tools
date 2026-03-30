Attribute VB_Name = "mod_Utils"
Option Explicit

'============================================================
' mod_Utils - 共通ユーティリティ・定数定義
' 山積み表ツール用モジュール
'============================================================

'--- シート名定数 ---
Public Const SHEET_MAIN_INPUT As String = "メイン入力"
Public Const SHEET_MASTER_PROCESS As String = "マスタ_工程"
Public Const SHEET_MASTER_MEMBER As String = "マスタ_担当者"
Public Const SHEET_MASTER_HOLIDAY As String = "マスタ_祝日"
Public Const SHEET_MASTER_CONFIG As String = "マスタ_設定"
Public Const SHEET_SUMMARY_MEMBER As String = "サマリー_担当者別"
Public Const SHEET_SUMMARY_PROCESS As String = "サマリー_工程別"
Public Const SHEET_GANTT As String = "ガントチャート"
Public Const SHEET_DASHBOARD As String = "ダッシュボード"

'--- 計算用定数 ---
Public Const STANDARD_HOURS_PER_DAY As Double = 8#
Public Const STANDARD_WORKING_DAYS_PER_MONTH As Integer = 20
Public Const OVERLOAD_THRESHOLD As Double = 1.2  ' 120%で警告

'--- メイン入力シート列インデックス ---
Public Enum MainInputColumns
    colMember = 1     ' A列: 担当者
    colProcess = 2    ' B列: 工程
    colMonthStart = 3 ' C列から: 月
End Enum

'--- マスタ_工程シート列インデックス ---
Public Enum MasterProcessColumns
    colProcessID = 1   ' A列: 工程ID
    colProcessName = 2 ' B列: 工程名
    colProcessColor = 3 ' C列: 色
    colProcessOrder = 4 ' D列: 表示順
End Enum

'--- マスタ_担当者シート列インデックス ---
Public Enum MasterMemberColumns
    colMemberID = 1   ' A列: 担当者ID
    colMemberName = 2 ' B列: 氏名
    colMemberDept = 3 ' C列: 所属
    colMemberRole = 4 ' D列: 役割
    colMemberOrder = 5 ' E列: 表示順
End Enum

'--- マスタ_祝日シート列インデックス ---
Public Enum MasterHolidayColumns
    colHolidayDate = 1 ' A列: 日付
    colHolidayName = 2 ' B列: 祝日名
    colHolidayType = 3 ' C列: 種別
End Enum

'--- マスタ_設定シート列インデックス ---
Public Enum MasterConfigColumns
    colConfigItem = 1 ' A列: 設定項目
    colConfigValue = 2 ' B列: 設定値
End Enum

'============================================================
' ユーティリティ関数
'============================================================

' シートの存在チェック
Public Function SheetExists(sheetName As String) As Boolean
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets(sheetName)
    SheetExists = Not ws Is Nothing
    On Error GoTo 0
End Function

' 最終行番号取得
Public Function GetLastRow(ws As Worksheet, Optional col As Long = 1) As Long
    GetLastRow = ws.Cells(ws.Rows.Count, col).End(xlUp).Row
End Function

' 最終列番号取得
Public Function GetLastCol(ws As Worksheet, Optional row As Long = 1) As Long
    GetLastCol = ws.Cells(row, ws.Columns.Count).End(xlToLeft).Column
End Function

' 数値チェック
Public Function IsNumericValue(value As Variant) As Boolean
    IsNumericValue = IsNumeric(value) And Not IsEmpty(value) And Not IsError(value)
End Function

' 日付範囲チェック
Public Function IsValidDateRange(startDate As Date, endDate As Date) As Boolean
    IsValidDateRange = startDate <= endDate And startDate >= DateSerial(2000, 1, 1)
End Function

' 担当者存在チェック
Public Function MemberExists(memberName As String) As Boolean
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MASTER_MEMBER)

    Dim lastRow As Long
    lastRow = GetLastRow(ws, 2)

    Dim i As Long
    For i = 2 To lastRow
        If ws.Cells(i, 2).Value = memberName Then
            MemberExists = True
            Exit Function
        End If
    Next i

    MemberExists = False
End Function

' 工程存在チェック
Public Function ProcessExists(processName As String) As Boolean
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MASTER_PROCESS)

    Dim lastRow As Long
    lastRow = GetLastRow(ws, 2)

    Dim i As Long
    For i = 2 To lastRow
        If ws.Cells(i, 2).Value = processName Then
            ProcessExists = True
            Exit Function
        End If
    Next i

    ProcessExists = False
End Function

' エラーログ出力
Public Sub LogError(procName As String, errNumber As Long, errDescription As String)
    Debug.Print "Error in " & procName & ": " & errNumber & " - " & errDescription
    ' 必要に応じてログシートに出力
End Sub

' RGB値からLong値への変換
Public Function RGBToLong(r As Long, g As Long, b As Long) As Long
    RGBToLong = RGB(r, g, b)
End Function

' 16進数カラーコードからLong値への変換
Public Function HexToColor(hexColor As String) As Long
    Dim r As Long, g As Long, b As Long

    hexColor = Replace(hexColor, "#", "")
    If Len(hexColor) = 6 Then
        r = Val("&H" & Left(hexColor, 2))
        g = Val("&H" & Mid(hexColor, 3, 2))
        b = Val("&H" & Right(hexColor, 2))
        HexToColor = RGB(r, g, b)
    End If
End Function

' 設定値取得
Public Function GetConfigValue(itemName As String) As Variant
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MASTER_CONFIG)

    Dim lastRow As Long
    lastRow = GetLastRow(ws, 1)

    Dim i As Long
    For i = 2 To lastRow
        If ws.Cells(i, 1).Value = itemName Then
            GetConfigValue = ws.Cells(i, 2).Value
            Exit Function
        End If
    Next i

    GetConfigValue = Empty
End Function

' 設定値設定
Public Sub SetConfigValue(itemName As String, value As Variant)
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MASTER_CONFIG)

    Dim lastRow As Long
    lastRow = GetLastRow(ws, 1)

    Dim i As Long
    For i = 2 To lastRow
        If ws.Cells(i, 1).Value = itemName Then
            ws.Cells(i, 2).Value = value
            Exit Sub
        End If
    Next i

    ' 新規追加
    ws.Cells(lastRow + 1, 1).Value = itemName
    ws.Cells(lastRow + 1, 2).Value = value
End Sub

' 年度開始月取得
Public Function GetFiscalYearStart() As Integer
    Dim value As Variant
    value = GetConfigValue("年度開始月")

    If IsNumeric(value) And value >= 1 And value <= 12 Then
        GetFiscalYearStart = CInt(value)
    Else
        GetFiscalYearStart = 4  ' デフォルト4月
    End If
End Function

' 対象年度取得
Public Function GetTargetYear() As Integer
    Dim value As Variant
    value = GetConfigValue("対象年度")

    If IsNumeric(value) Then
        GetTargetYear = CInt(value)
    Else
        GetTargetYear = Year(Date)
    End If
End Function
