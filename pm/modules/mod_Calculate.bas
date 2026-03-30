Attribute VB_Name = "mod_Calculate"
Option Explicit

'============================================================
' mod_Calculate - 工数計算処理
' 山積み表ツール用モジュール
'============================================================

'============================================================
' 工数集計関数
'============================================================

' 担当者別総工数計算
Public Function CalculateMemberTotal(memberName As String) As Double
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    Dim lastRow As Long
    lastRow = GetLastRow(ws)

    Dim total As Double
    total = 0

    Dim i As Long
    Dim j As Long
    Dim lastCol As Long
    lastCol = colMonthStart + 11 ' 12ヶ月分

    For i = 2 To lastRow
        If ws.Cells(i, colMember).Value = memberName Then
            For j = colMonthStart To lastCol
                If IsNumericValue(ws.Cells(i, j).Value) Then
                    total = total + CDbl(ws.Cells(i, j).Value)
                End If
            Next j
        End If
    Next i

    CalculateMemberTotal = total
End Function

' 工程別総工数計算
Public Function CalculateProcessTotal(processName As String) As Double
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    Dim lastRow As Long
    lastRow = GetLastRow(ws)

    Dim total As Double
    total = 0

    Dim i As Long
    Dim j As Long
    Dim lastCol As Long
    lastCol = colMonthStart + 11 ' 12ヶ月分

    For i = 2 To lastRow
        If ws.Cells(i, colProcess).Value = processName Then
            For j = colMonthStart To lastCol
                If IsNumericValue(ws.Cells(i, j).Value) Then
                    total = total + CDbl(ws.Cells(i, j).Value)
                End If
            Next j
        End If
    Next i

    CalculateProcessTotal = total
End Function

' 月別工数集計
Public Function CalculateMonthlyTotal(yearMonth As String) As Double
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    Dim targetCol As Long
    targetCol = FindMonthColumn(yearMonth)

    If targetCol = 0 Then
        CalculateMonthlyTotal = 0
        Exit Function
    End If

    Dim lastRow As Long
    lastRow = GetLastRow(ws)

    Dim total As Double
    total = 0

    Dim i As Long
    For i = 2 To lastRow
        If IsNumericValue(ws.Cells(i, targetCol).Value) Then
            total = total + CDbl(ws.Cells(i, targetCol).Value)
        End If
    Next i

    CalculateMonthlyTotal = total
End Function

' 月列の検索
Private Function FindMonthColumn(yearMonth As String) As Long
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    Dim i As Long
    For i = colMonthStart To colMonthStart + 11
        Dim headerValue As String
        headerValue = CStr(ws.Cells(1, i).Value)

        ' 形式を正規化して比較
        If NormalizeYearMonth(headerValue) = NormalizeYearMonth(yearMonth) Then
            FindMonthColumn = i
            Exit Function
        End If
    Next i

    FindMonthColumn = 0
End Function

' 年月の正規化
Private Function NormalizeYearMonth(ym As String) As String
    Dim parts() As String
    ym = Replace(ym, "/", "")
    ym = Replace(ym, "-", "")

    If Len(ym) = 6 Then
        NormalizeYearMonth = Left(ym, 4) & "/" & Right(ym, 2)
    ElseIf Len(ym) = 5 Then
        NormalizeYearMonth = Left(ym, 4) & "/0" & Right(ym, 1)
    Else
        NormalizeYearMonth = ym
    End If
End Function

' 行ごとの合計計算
Public Sub CalculateRowTotals()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    Dim lastRow As Long
    lastRow = GetLastRow(ws)

    Dim i As Long
    Dim j As Long
    Dim totalCol As Long
    totalCol = colMonthStart + 12

    For i = 2 To lastRow
        Dim rowTotal As Double
        rowTotal = 0

        For j = colMonthStart To colMonthStart + 11
            If IsNumericValue(ws.Cells(i, j).Value) Then
                rowTotal = rowTotal + CDbl(ws.Cells(i, j).Value)
            End If
        Next j

        ws.Cells(i, totalCol).Value = rowTotal
    Next i
End Sub

'============================================================
' 全工数計算
'============================================================

Public Sub CalculateWorkload()
    On Error GoTo ErrorHandler

    ' 行ごとの合計計算
    Call CalculateRowTotals

    Exit Sub

ErrorHandler:
    Call LogError("CalculateWorkload", Err.Number, Err.Description)
End Sub

'============================================================
' 過積載判定
'============================================================

' 過積載率計算
Public Function CalculateOverloadRate(actualHours As Double, yearMonth As String) As Double
    Dim standardHours As Double
    standardHours = CalculateMonthlyWorkingHours(yearMonth)

    If standardHours > 0 Then
        CalculateOverloadRate = actualHours / standardHours
    Else
        CalculateOverloadRate = 0
    End If
End Function

' 過積載警告チェック
Public Function IsOverloaded(actualHours As Double, yearMonth As String) As Boolean
    Dim rate As Double
    rate = CalculateOverloadRate(actualHours, yearMonth)

    IsOverloaded = (rate > OVERLOAD_THRESHOLD)
End Function

' 担当者別月次過積載チェック
Public Sub CheckMemberOverload(memberName As String, yearMonth As String, ByRef isOverloaded As Boolean, ByRef overloadRate As Double)
    Dim actualHours As Double
    actualHours = GetMemberMonthlyHours(memberName, yearMonth)

    overloadRate = CalculateOverloadRate(actualHours, yearMonth)
    isOverloaded = overloadRate > OVERLOAD_THRESHOLD
End Sub

' 担当者の特定月の工数取得
Public Function GetMemberMonthlyHours(memberName As String, yearMonth As String) As Double
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    Dim targetCol As Long
    targetCol = FindMonthColumn(yearMonth)

    If targetCol = 0 Then
        GetMemberMonthlyHours = 0
        Exit Function
    End If

    Dim lastRow As Long
    lastRow = GetLastRow(ws)

    Dim total As Double
    total = 0

    Dim i As Long
    For i = 2 To lastRow
        If ws.Cells(i, colMember).Value = memberName Then
            If IsNumericValue(ws.Cells(i, targetCol).Value) Then
                total = total + CDbl(ws.Cells(i, targetCol).Value)
            End If
        End If
    Next i

    GetMemberMonthlyHours = total
End Function
