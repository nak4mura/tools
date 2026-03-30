Attribute VB_Name = "mod_Summary"
Option Explicit

'============================================================
' mod_Summary - サマリー生成
' 山積み表ツール用モジュール
'============================================================

'============================================================
' サマリー生成メイン
'============================================================

' 担当者別サマリー生成
Public Sub GenerateMemberSummary()
    On Error GoTo ErrorHandler

    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_SUMMARY_MEMBER)

    ' シートクリア
    ws.Cells.Clear

    ' ヘッダー生成
    Call GenerateMemberSummaryHeader(ws)

    ' データ生成
    Call GenerateMemberSummaryData(ws)

    ' 書式設定
    Call FormatMemberSummarySheet(ws)

    Exit Sub

ErrorHandler:
    Call LogError("GenerateMemberSummary", Err.Number, Err.Description)
End Sub

' 工程別サマリー生成
Public Sub GenerateProcessSummary()
    On Error GoTo ErrorHandler

    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_SUMMARY_PROCESS)

    ' シートクリア
    ws.Cells.Clear

    ' ヘッダー生成
    Call GenerateProcessSummaryHeader(ws)

    ' データ生成
    Call GenerateProcessSummaryData(ws)

    ' 書式設定
    Call FormatProcessSummarySheet(ws)

    Exit Sub

ErrorHandler:
    Call LogError("GenerateProcessSummary", Err.Number, Err.Description)
End Sub

'============================================================
' 担当者別サマリー
'============================================================

' ヘッダー生成
Private Sub GenerateMemberSummaryHeader(ws As Worksheet)
    ' A1: 担当者
    ws.Cells(1, 1).Value = "担当者"

    ' 工程列を取得
    Dim processWs As Worksheet
    Set processWs = ThisWorkbook.Sheets(SHEET_MASTER_PROCESS)

    Dim lastRow As Long
    lastRow = GetLastRow(processWs)

    Dim i As Long
    Dim colOffset As Long
    colOffset = 2

    For i = 2 To lastRow
        ws.Cells(1, colOffset).Value = processWs.Cells(i, colProcessName).Value
        colOffset = colOffset + 1
    Next i

    ' 合計列
    ws.Cells(1, colOffset).Value = "合計"

    ' 稼働日数行
    ws.Cells(2, 1).Value = "月次稼働時間"
    colOffset = 2

    Dim mainWs As Worksheet
    Set mainWs = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    For i = colMonthStart To colMonthStart + 11
        Dim yearMonth As String
        yearMonth = CStr(mainWs.Cells(1, i).Value)
        ws.Cells(2, colOffset).Value = CalculateMonthlyWorkingHours(yearMonth)
        colOffset = colOffset + 1
    Next i
End Sub

' データ生成
Private Sub GenerateMemberSummaryData(ws As Worksheet)
    Dim mainWs As Worksheet
    Set mainWs = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    Dim memberWs As Worksheet
    Set memberWs = ThisWorkbook.Sheets(SHEET_MASTER_MEMBER)

    Dim processWs As Worksheet
    Set processWs = ThisWorkbook.Sheets(SHEET_MASTER_PROCESS)

    Dim memberLastRow As Long
    memberLastRow = GetLastRow(memberWs)

    Dim processLastRow As Long
    processLastRow = GetLastRow(processWs)

    Dim mainLastRow As Long
    mainLastRow = GetLastRow(mainWs)

    Dim outputRow As Long
    outputRow = 3  ' ヘッダーと稼働時間行の後

    ' 担当者ごとに処理
    Dim i As Long
    Dim j As Long
    Dim k As Long

    For i = 2 To memberLastRow
        Dim memberName As String
        memberName = memberWs.Cells(i, colMemberName).Value

        ws.Cells(outputRow, 1).Value = memberName

        ' 工程ごとの工数を集計
        Dim totalWorkload As Double
        totalWorkload = 0

        For j = 2 To processLastRow
            Dim processName As String
            processName = processWs.Cells(j, colProcessName).Value

            Dim processTotal As Double
            processTotal = 0

            ' メイン入力シートから集計
            For k = 2 To mainLastRow
                If mainWs.Cells(k, colMember).Value = memberName And mainWs.Cells(k, colProcess).Value = processName Then
                    Dim m As Long
                    For m = colMonthStart To colMonthStart + 11
                        If IsNumericValue(mainWs.Cells(k, m).Value) Then
                            processTotal = processTotal + CDbl(mainWs.Cells(k, m).Value)
                        End If
                    Next m
                End If
            Next k

            ws.Cells(outputRow, j).Value = processTotal
            totalWorkload = totalWorkload + processTotal
        Next j

        ' 合計
        ws.Cells(outputRow, processLastRow + 1).Value = totalWorkload

        outputRow = outputRow + 1
    Next i

    ' 総計行
    ws.Cells(outputRow, 1).Value = "総計"

    For j = 2 To processLastRow + 1
        Dim colTotal As Double
        colTotal = 0

        For k = 3 To outputRow - 1
            If IsNumericValue(ws.Cells(k, j).Value) Then
                colTotal = colTotal + CDbl(ws.Cells(k, j).Value)
            End If
        Next k

        ws.Cells(outputRow, j).Value = colTotal
    Next j
End Sub

' 書式設定
Private Sub FormatMemberSummarySheet(ws As Worksheet)
    Dim lastCol As Long
    lastCol = GetLastCol(ws)

    Dim lastRow As Long
    lastRow = GetLastRow(ws)

    ' ヘッダー書式
    With ws.Range(ws.Cells(1, 1), ws.Cells(1, lastCol))
        .Font.Bold = True
        .Interior.Color = RGB(200, 200, 200)
        .HorizontalAlignment = xlCenter
    End With

    ' 総計行書式
    With ws.Range(ws.Cells(lastRow, 1), ws.Cells(lastRow, lastCol))
        .Font.Bold = True
        .Interior.Color = RGB(230, 230, 230)
    End With

    ' 列幅調整
    ws.Columns(1).ColumnWidth = 15
    Dim i As Long
    For i = 2 To lastCol
        ws.Columns(i).ColumnWidth = 12
    Next i

    ' 数値書式
    ws.Range(ws.Cells(3, 2), ws.Cells(lastRow, lastCol)).NumberFormat = "#,##0"
End Sub

'============================================================
' 工程別サマリー
'============================================================

' ヘッダー生成
Private Sub GenerateProcessSummaryHeader(ws As Worksheet)
    ' A1: 工程
    ws.Cells(1, 1).Value = "工程"

    ' 月列ヘッダー
    Dim mainWs As Worksheet
    Set mainWs = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    Dim i As Long
    Dim colOffset As Long
    colOffset = 2

    For i = colMonthStart To colMonthStart + 11
        ws.Cells(1, colOffset).Value = mainWs.Cells(1, i).Value
        colOffset = colOffset + 1
    Next i

    ' 合計列
    ws.Cells(1, colOffset).Value = "合計"
End Sub

' データ生成
Private Sub GenerateProcessSummaryData(ws As Worksheet)
    Dim mainWs As Worksheet
    Set mainWs = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    Dim processWs As Worksheet
    Set processWs = ThisWorkbook.Sheets(SHEET_MASTER_PROCESS)

    Dim processLastRow As Long
    processLastRow = GetLastRow(processWs)

    Dim mainLastRow As Long
    mainLastRow = GetLastRow(mainWs)

    Dim outputRow As Long
    outputRow = 2

    ' 工程ごとに処理
    Dim i As Long
    Dim j As Long
    Dim k As Long

    For i = 2 To processLastRow
        Dim processName As String
        processName = processWs.Cells(i, colProcessName).Value

        ws.Cells(outputRow, 1).Value = processName

        Dim rowTotal As Double
        rowTotal = 0

        ' 月ごとの工数を集計
        For j = 0 To 11
            Dim monthTotal As Double
            monthTotal = 0

            For k = 2 To mainLastRow
                If mainWs.Cells(k, colProcess).Value = processName Then
                    If IsNumericValue(mainWs.Cells(k, colMonthStart + j).Value) Then
                        monthTotal = monthTotal + CDbl(mainWs.Cells(k, colMonthStart + j).Value)
                    End If
                End If
            Next k

            ws.Cells(outputRow, 2 + j).Value = monthTotal
            rowTotal = rowTotal + monthTotal
        Next j

        ' 合計
        ws.Cells(outputRow, 14).Value = rowTotal

        outputRow = outputRow + 1
    Next i

    ' 月次合計行
    ws.Cells(outputRow, 1).Value = "月次合計"

    For j = 0 To 11
        Dim monthSum As Double
        monthSum = 0

        For k = 2 To outputRow - 1
            If IsNumericValue(ws.Cells(k, 2 + j).Value) Then
                monthSum = monthSum + CDbl(ws.Cells(k, 2 + j).Value)
            End If
        Next k

        ws.Cells(outputRow, 2 + j).Value = monthSum
    Next j

    ' 総合計
    Dim grandTotal As Double
    grandTotal = 0
    For k = 2 To outputRow - 1
        If IsNumericValue(ws.Cells(k, 14).Value) Then
            grandTotal = grandTotal + CDbl(ws.Cells(k, 14).Value)
        End If
    Next k
    ws.Cells(outputRow, 14).Value = grandTotal
End Sub

' 書式設定
Private Sub FormatProcessSummarySheet(ws As Worksheet)
    Dim lastCol As Long
    lastCol = GetLastCol(ws)

    Dim lastRow As Long
    lastRow = GetLastRow(ws)

    ' ヘッダー書式
    With ws.Range(ws.Cells(1, 1), ws.Cells(1, lastCol))
        .Font.Bold = True
        .Interior.Color = RGB(200, 200, 200)
        .HorizontalAlignment = xlCenter
    End With

    ' 月次合計行書式
    With ws.Range(ws.Cells(lastRow, 1), ws.Cells(lastRow, lastCol))
        .Font.Bold = True
        .Interior.Color = RGB(230, 230, 230)
    End With

    ' 列幅調整
    ws.Columns(1).ColumnWidth = 12
    Dim i As Long
    For i = 2 To lastCol
        ws.Columns(i).ColumnWidth = 10
    Next i

    ' 数値書式
    ws.Range(ws.Cells(2, 2), ws.Cells(lastRow, lastCol)).NumberFormat = "#,##0"
End Sub
