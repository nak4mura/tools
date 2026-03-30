Attribute VB_Name = "mod_Chart"
Option Explicit

'============================================================
' mod_Chart - グラフ・チャート生成
' 山積み表ツール用モジュール
'============================================================

'============================================================
' グラフ更新メイン
'============================================================

Public Sub UpdateCharts()
    On Error GoTo ErrorHandler

    Application.ScreenUpdating = False

    ' ガントチャート風ビジュアル生成
    Call CreateGanttChart

    ' ダッシュボード更新
    Call UpdateDashboard

    Application.ScreenUpdating = True

    Exit Sub

ErrorHandler:
    Application.ScreenUpdating = True
    Call LogError("UpdateCharts", Err.Number, Err.Description)
End Sub

'============================================================
' ガントチャート風ビジュアル
'============================================================

Public Sub CreateGanttChart()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_GANTT)

    ' シートクリア
    ws.Cells.Clear

    ' メイン入力シートからデータをコピー
    Dim mainWs As Worksheet
    Set mainWs = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    mainWs.UsedRange.Copy
    ws.Range("A1").PasteSpecial Paste:=xlPasteAll
    Application.CutCopyMode = False

    ' データバー（条件付き書式）を適用
    Call ApplyDataBars(ws)

    ' 書式調整
    Call FormatGanttSheet(ws)
End Sub

' データバー適用
Private Sub ApplyDataBars(ws As Worksheet)
    Dim lastRow As Long
    lastRow = GetLastRow(ws)

    If lastRow <= 1 Then Exit Sub

    Dim dataRange As Range
    Set dataRange = ws.Range(ws.Cells(2, colMonthStart), ws.Cells(lastRow, colMonthStart + 11))

    ' 既存の条件付き書式をクリア
    dataRange.FormatConditions.Delete

    ' データバーを追加
    With dataRange.FormatConditions.AddDatabar
        .BarFillType = xlDataBarFillSolid
        .BarColor.Color = RGB(70, 130, 180)  ' Steel Blue
        .ShowValue = True
        .MinPoint.Modify newtype:=xlConditionValueNumber, newvalue:=0
        .MaxPoint.Modify newtype:=xlConditionValueNumber, newvalue:=200
    End With

    ' 工程別の色分け
    Call ApplyProcessColorsToGantt(ws)
End Sub

' ガントチャートに工程別の色を適用
Private Sub ApplyProcessColorsToGantt(ws As Worksheet)
    Dim processWs As Worksheet
    Set processWs = ThisWorkbook.Sheets(SHEET_MASTER_PROCESS)

    Dim lastRow As Long
    lastRow = GetLastRow(ws)

    Dim processLastRow As Long
    processLastRow = GetLastRow(processWs)

    Dim i As Long
    Dim j As Long

    For i = 2 To lastRow
        Dim processName As String
        processName = ws.Cells(i, colProcess).Value

        ' 工程の色を検索
        For j = 2 To processLastRow
            If processWs.Cells(j, colProcessName).Value = processName Then
                Dim hexColor As String
                hexColor = processWs.Cells(j, colProcessColor).Value

                ' 行の最初の2列に色を適用
                ws.Range(ws.Cells(i, 1), ws.Cells(i, 2)).Interior.Color = HexToColor(hexColor)
                Exit For
            End If
        Next j
    Next i
End Sub

' ガントチャートシートの書式設定
Private Sub FormatGanttSheet(ws As Worksheet)
    Dim lastCol As Long
    lastCol = GetLastCol(ws)

    ' ヘッダー書式
    With ws.Range(ws.Cells(1, 1), ws.Cells(1, lastCol))
        .Font.Bold = True
        .Interior.Color = RGB(200, 200, 200)
        .HorizontalAlignment = xlCenter
    End With

    ' 列幅調整
    ws.Columns(colMember).ColumnWidth = 15
    ws.Columns(colProcess).ColumnWidth = 12

    Dim i As Long
    For i = colMonthStart To lastCol
        ws.Columns(i).ColumnWidth = 12
    Next i
End Sub

'============================================================
' ダッシュボード
'============================================================

Public Sub UpdateDashboard()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_DASHBOARD)

    ' シートクリア
    ws.Cells.Clear

    ' タイトル
    ws.Cells(1, 1).Value = "山積み表ダッシュボード"
    ws.Cells(1, 1).Font.Size = 20
    ws.Cells(1, 1).Font.Bold = True

    ' サマリー情報
    Call AddDashboardSummary(ws)

    ' グラフを追加
    Call AddDashboardCharts(ws)
End Sub

' ダッシュボードにサマリー情報を追加
Private Sub AddDashboardSummary(ws As Worksheet)
    Dim mainWs As Worksheet
    Set mainWs = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    Dim lastRow As Long
    lastRow = GetLastRow(mainWs)

    ' 基本統計
    ws.Cells(3, 1).Value = "■ プロジェクト概要"
    ws.Cells(3, 1).Font.Bold = True
    ws.Cells(3, 1).Font.Size = 14

    ' 担当者数
    Dim memberCount As Long
    memberCount = CountUniqueMembers()
    ws.Cells(5, 1).Value = "担当者数:"
    ws.Cells(5, 2).Value = memberCount & "名"

    ' 総工数
    Dim totalWorkload As Double
    totalWorkload = CalculateTotalWorkload()
    ws.Cells(6, 1).Value = "総工数:"
    ws.Cells(6, 2).Value = Format(totalWorkload, "#,##0") & "時間"

    ' 工程数
    Dim processCount As Long
    processCount = CountUniqueProcesses()
    ws.Cells(7, 1).Value = "工程数:"
    ws.Cells(7, 2).Value = processCount & "種類"

    ' 対象期間
    ws.Cells(9, 1).Value = "■ 対象期間"
    ws.Cells(9, 1).Font.Bold = True
    ws.Cells(9, 1).Font.Size = 14

    Dim targetYear As Integer
    Dim startMonth As Integer
    targetYear = GetTargetYear()
    startMonth = GetFiscalYearStart()

    ws.Cells(10, 1).Value = "年度:"
    ws.Cells(10, 2).Value = targetYear & "年度"

    ws.Cells(11, 1).Value = "期間:"
    ws.Cells(11, 2).Value = targetYear & "/" & startMonth & " 〜 " & (targetYear + 1) & "/" & (startMonth - 1)

    ' 過積載警告
    ws.Cells(13, 1).Value = "■ 過積載警告"
    ws.Cells(13, 1).Font.Bold = True
    ws.Cells(13, 1).Font.Size = 14
    ws.Cells(13, 1).Font.Color = RGB(255, 0, 0)

    Call AddOverloadWarnings ws, 14
End Sub

' ユニーク担当者数
Private Function CountUniqueMembers() As Long
    Dim mainWs As Worksheet
    Set mainWs = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    Dim lastRow As Long
    lastRow = GetLastRow(mainWs)

    Dim members As Object
    Set members = CreateObject("Scripting.Dictionary")

    Dim i As Long
    For i = 2 To lastRow
        Dim memberName As String
        memberName = mainWs.Cells(i, colMember).Value

        If memberName <> "" And Not members.Exists(memberName) Then
            members.Add memberName, 1
        End If
    Next i

    CountUniqueMembers = members.Count
End Function

' ユニーク工程数
Private Function CountUniqueProcesses() As Long
    Dim processWs As Worksheet
    Set processWs = ThisWorkbook.Sheets(SHEET_MASTER_PROCESS)

    CountUniqueProcesses = GetLastRow(processWs) - 1
End Function

' 総工数計算
Private Function CalculateTotalWorkload() As Double
    Dim mainWs As Worksheet
    Set mainWs = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    Dim lastRow As Long
    lastRow = GetLastRow(mainWs)

    Dim total As Double
    total = 0

    Dim i As Long
    Dim j As Long

    For i = 2 To lastRow
        For j = colMonthStart To colMonthStart + 11
            If IsNumericValue(mainWs.Cells(i, j).Value) Then
                total = total + CDbl(mainWs.Cells(i, j).Value)
            End If
        Next j
    Next i

    CalculateTotalWorkload = total
End Function

' 過積載警告を追加
Private Sub AddOverloadWarnings(ws As Worksheet, startRow As Long)
    Dim mainWs As Worksheet
    Set mainWs = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    Dim lastRow As Long
    lastRow = GetLastRow(mainWs)

    Dim outputRow As Long
    outputRow = startRow

    Dim warningFound As Boolean
    warningFound = False

    ' 担当者ごとの月次工数をチェック
    Dim i As Long
    Dim j As Long

    For i = 2 To lastRow
        Dim memberName As String
        memberName = mainWs.Cells(i, colMember).Value

        If memberName <> "" Then
            For j = 0 To 11
                Dim yearMonth As String
                yearMonth = CStr(mainWs.Cells(1, colMonthStart + j).Value)

                Dim actualHours As Double
                actualHours = GetMemberMonthlyHours(memberName, yearMonth)

                Dim isOverloaded As Boolean
                Dim overloadRate As Double

                Call CheckMemberOverload(memberName, yearMonth, isOverloaded, overloadRate)

                If isOverloaded Then
                    warningFound = True
                    ws.Cells(outputRow, 1).Value = "⚠ " & memberName & " (" & yearMonth & ")"
                    ws.Cells(outputRow, 2).Value = Format(actualHours, "#,##0") & "時間 (" & Format(overloadRate * 100, "0") & "%)"
                    ws.Cells(outputRow, 1).Font.Color = RGB(255, 0, 0)
                    outputRow = outputRow + 1
                End If
            Next j
        End If
    Next i

    If Not warningFound Then
        ws.Cells(outputRow, 1).Value = "過積載の担当者はいません"
        ws.Cells(outputRow, 1).Font.Color = RGB(0, 128, 0)
    End If
End Sub

' ダッシュボードにグラフを追加
Private Sub AddDashboardCharts(ws As Worksheet)
    ' 工程別円グラフ
    Call CreateProcessPieChart(ws)

    ' 担当者別棒グラフ
    Call CreateMemberBarChart(ws)
End Sub

' 工程別円グラフ作成
Private Sub CreateProcessPieChart(ws As Worksheet)
    Dim summaryWs As Worksheet
    Set summaryWs = ThisWorkbook.Sheets(SHEET_SUMMARY_PROCESS)

    Dim lastRow As Long
    lastRow = GetLastRow(summaryWs)

    If lastRow <= 1 Then Exit Sub

    ' グラフを作成
    Dim chtObj As ChartObject
    Set chtObj = ws.ChartObjects.Add(Left:=ws.Range("D3").Left, Top:=ws.Range("D3").Top, Width:=300, Height:=200)

    With chtObj.Chart
        .ChartType = xlPie
        .SetSourceData Source:=summaryWs.Range("A2:A" & lastRow & ",N2:N" & lastRow)
        .HasTitle = True
        .ChartTitle.Text = "工程別工数構成比"

        ' データラベル
        .ApplyDataLabels
        .SeriesCollection(1).DataLabels.ShowPercentage = True
        .SeriesCollection(1).DataLabels.ShowValue = False
    End With
End Sub

' 担当者別棒グラフ作成
Private Sub CreateMemberBarChart(ws As Worksheet)
    Dim summaryWs As Worksheet
    Set summaryWs = ThisWorkbook.Sheets(SHEET_SUMMARY_MEMBER)

    Dim lastRow As Long
    lastRow = GetLastRow(summaryWs)

    If lastRow <= 3 Then Exit Sub

    ' グラフを作成（合計列のみ）
    Dim chtObj As ChartObject
    Set chtObj = ws.ChartObjects.Add(Left:=ws.Range("D18").Left, Top:=ws.Range("D18").Top, Width:=300, Height:=200)

    Dim processLastRow As Long
    processLastRow = GetLastRow(ThisWorkbook.Sheets(SHEET_MASTER_PROCESS))

    ' 最終列（合計列）を取得
    Dim totalCol As Long
    totalCol = processLastRow + 1

    With chtObj.Chart
        .ChartType = xlColumnClustered
        .SetSourceData Source:=summaryWs.Range("A3:A" & (lastRow - 1) & "," & Cells(3, totalCol).Address(False, False) & ":" & Cells(lastRow - 1, totalCol).Address(False, False))
        .HasTitle = True
        .ChartTitle.Text = "担当者別総工数"
    End With
End Sub
