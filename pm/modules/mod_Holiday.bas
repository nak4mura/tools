Attribute VB_Name = "mod_Holiday"
Option Explicit

'============================================================
' mod_Holiday - 祝日管理・稼働日数計算
' 山積み表ツール用モジュール
'============================================================

'============================================================
' 稼働日数計算
'============================================================

' 稼働日数計算（土日・祝日除外）
Public Function CalculateWorkingDays(ByVal startDate As Date, ByVal endDate As Date) As Integer
    Dim currentDate As Date
    Dim workingDays As Integer
    Dim holidays As Object  ' Dictionary

    ' 祝日データをロード
    Set holidays = LoadHolidays()

    workingDays = 0
    currentDate = startDate

    Do While currentDate <= endDate
        ' 土日チェック（vbMonday=1, ..., vbFriday=5, vbSaturday=6, vbSunday=7）
        If Weekday(currentDate, vbMonday) <= 5 Then
            ' 祝日チェック
            If Not holidays.Exists(CLng(currentDate)) Then
                workingDays = workingDays + 1
            End If
        End If
        currentDate = currentDate + 1
    Loop

    CalculateWorkingDays = workingDays
End Function

' 祝日データをディクショナリにロード
Private Function LoadHolidays() As Object
    Dim dict As Object
    Set dict = CreateObject("Scripting.Dictionary")

    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MASTER_HOLIDAY)

    Dim lastRow As Long
    lastRow = GetLastRow(ws)

    Dim i As Long
    For i = 2 To lastRow
        If IsDate(ws.Cells(i, colHolidayDate).Value) Then
            Dim holidayDate As Long
            holidayDate = CLng(CDate(ws.Cells(i, colHolidayDate).Value))

            If Not dict.Exists(holidayDate) Then
                dict.Add holidayDate, ws.Cells(i, colHolidayName).Value
            End If
        End If
    Next i

    Set LoadHolidays = dict
End Function

' 月次稼働時間計算
Public Function CalculateMonthlyWorkingHours(ByVal yearMonth As String) As Double
    Dim startDate As Date
    Dim endDate As Date
    Dim year As Integer
    Dim month As Integer

    ' 年月をパース
    If Not ParseYearMonth(yearMonth, year, month) Then
        CalculateMonthlyWorkingHours = STANDARD_WORKING_DAYS_PER_MONTH * STANDARD_HOURS_PER_DAY
        Exit Function
    End If

    ' 月の初日と最終日を取得
    startDate = DateSerial(year, month, 1)
    endDate = DateSerial(year, month + 1, 0)

    ' 稼働日数 × 標準稼働時間
    CalculateMonthlyWorkingHours = CalculateWorkingDays(startDate, endDate) * STANDARD_HOURS_PER_DAY
End Function

' 月次稼働日数取得
Public Function GetMonthlyWorkingDays(ByVal yearMonth As String) As Integer
    Dim startDate As Date
    Dim endDate As Date
    Dim year As Integer
    Dim month As Integer

    ' 年月をパース
    If Not ParseYearMonth(yearMonth, year, month) Then
        GetMonthlyWorkingDays = STANDARD_WORKING_DAYS_PER_MONTH
        Exit Function
    End If

    ' 月の初日と最終日を取得
    startDate = DateSerial(year, month, 1)
    endDate = DateSerial(year, month + 1, 0)

    GetMonthlyWorkingDays = CalculateWorkingDays(startDate, endDate)
End Function

' 年月のパース
Private Function ParseYearMonth(ym As String, ByRef year As Integer, ByRef month As Integer) As Boolean
    On Error GoTo ErrorHandler

    Dim parts() As String

    ' スラッシュ区切り
    If InStr(ym, "/") > 0 Then
        parts = Split(ym, "/")
    ElseIf InStr(ym, "-") > 0 Then
        parts = Split(ym, "-")
    Else
        ParseYearMonth = False
        Exit Function
    End If

    If UBound(parts) >= 1 Then
        year = CInt(parts(0))
        month = CInt(parts(1))
        ParseYearMonth = True
    Else
        ParseYearMonth = False
    End If

    Exit Function

ErrorHandler:
    ParseYearMonth = False
End Function

'============================================================
' 祝日管理
'============================================================

' 祝日の追加
Public Sub AddHoliday(holidayDate As Date, holidayName As String, Optional holidayType As String = "国民の祝日")
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MASTER_HOLIDAY)

    ' 重複チェック
    If HolidayExists(holidayDate) Then
        MsgBox "この日付の祝日は既に登録されています。", vbExclamation, "確認"
        Exit Sub
    End If

    Dim lastRow As Long
    lastRow = GetLastRow(ws)

    ws.Cells(lastRow + 1, colHolidayDate).Value = holidayDate
    ws.Cells(lastRow + 1, colHolidayName).Value = holidayName
    ws.Cells(lastRow + 1, colHolidayType).Value = holidayType

    ' 日付順にソート
    Call SortHolidays
End Sub

' 祝日の削除
Public Sub RemoveHoliday(holidayDate As Date)
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MASTER_HOLIDAY)

    Dim lastRow As Long
    lastRow = GetLastRow(ws)

    Dim i As Long
    For i = lastRow To 2 Step -1
        If IsDate(ws.Cells(i, colHolidayDate).Value) Then
            If CDate(ws.Cells(i, colHolidayDate).Value) = holidayDate Then
                ws.Rows(i).Delete
            End If
        End If
    Next i
End Sub

' 祝日の存在チェック
Public Function HolidayExists(holidayDate As Date) As Boolean
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MASTER_HOLIDAY)

    Dim lastRow As Long
    lastRow = GetLastRow(ws)

    Dim i As Long
    For i = 2 To lastRow
        If IsDate(ws.Cells(i, colHolidayDate).Value) Then
            If CDate(ws.Cells(i, colHolidayDate).Value) = holidayDate Then
                HolidayExists = True
                Exit Function
            End If
        End If
    Next i

    HolidayExists = False
End Function

' 祝日データのソート
Private Sub SortHolidays()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MASTER_HOLIDAY)

    Dim lastRow As Long
    lastRow = GetLastRow(ws)

    If lastRow <= 2 Then Exit Sub

    ws.Sort.SortFields.Clear
    ws.Sort.SortFields.Add Key:=ws.Range("A2:A" & lastRow), SortOn:=xlSortOnValues, Order:=xlAscending

    With ws.Sort
        .SetRange ws.Range("A2:C" & lastRow)
        .Header = xlNo
        .Apply
    End With
End Sub

' 祝日名取得
Public Function GetHolidayName(holidayDate As Date) As String
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MASTER_HOLIDAY)

    Dim lastRow As Long
    lastRow = GetLastRow(ws)

    Dim i As Long
    For i = 2 To lastRow
        If IsDate(ws.Cells(i, colHolidayDate).Value) Then
            If CDate(ws.Cells(i, colHolidayDate).Value) = holidayDate Then
                GetHolidayName = ws.Cells(i, colHolidayName).Value
                Exit Function
            End If
        End If
    Next i

    GetHolidayName = ""
End Function

'============================================================
' 祝日データ自動取得（オプション）
'============================================================

' 内閣府の祝日CSVから祝日データを取得
Public Sub FetchHolidaysFromWeb()
    On Error GoTo ErrorHandler

    ' 注: 実際の環境ではHTTPリクエストが必要
    ' 現在はサンプルとしてコメントアウト

    ' Dim httpReq As Object
    ' Set httpReq = CreateObject("MSXML2.XMLHTTP")
    ' Dim url As String
    ' url = "https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv"
    ' httpReq.Open "GET", url, False
    ' httpReq.send
    '
    ' If httpReq.Status = 200 Then
    '     Call ParseHolidayCSV(httpReq.responseText)
    ' End If

    MsgBox "祝日データの自動取得は現在無効になっています。" & vbCrLf & _
           "手動でマスタ_祝日シートに追加してください。", vbInformation, "案内"

    Exit Sub

ErrorHandler:
    MsgBox "祝日データの取得中にエラーが発生しました: " & Err.Description, vbCritical, "エラー"
End Sub

'============================================================
' ユーティリティ
'============================================================

' 特定年の祝日一覧を取得
Public Function GetHolidaysByYear(targetYear As Integer) As Collection
    Dim result As New Collection
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MASTER_HOLIDAY)

    Dim lastRow As Long
    lastRow = GetLastRow(ws)

    Dim i As Long
    For i = 2 To lastRow
        If IsDate(ws.Cells(i, colHolidayDate).Value) Then
            Dim holidayDate As Date
            holidayDate = CDate(ws.Cells(i, colHolidayDate).Value)

            If Year(holidayDate) = targetYear Then
                Dim holidayInfo As String
                holidayInfo = holidayDate & ":" & ws.Cells(i, colHolidayName).Value
                result.Add holidayInfo
            End If
        End If
    Next i

    Set GetHolidaysByYear = result
End Function

' 全期間の稼働サマリーを取得
Public Function GetWorkingDaysSummary(startYear As Integer, startMonth As Integer, endYear As Integer, endMonth As Integer) As Variant
    Dim result() As Variant
    ReDim result(1 To 12, 1 To 3)  ' 月, 稼働日数, 稼働時間

    Dim currentYear As Integer
    Dim currentMonth As Integer
    Dim i As Long

    i = 1
    currentYear = startYear
    currentMonth = startMonth

    Do While (currentYear < endYear) Or (currentYear = endYear And currentMonth <= endMonth)
        Dim yearMonth As String
        yearMonth = currentYear & "/" & currentMonth

        result(i, 1) = yearMonth
        result(i, 2) = GetMonthlyWorkingDays(yearMonth)
        result(i, 3) = CalculateMonthlyWorkingHours(yearMonth)

        i = i + 1
        currentMonth = currentMonth + 1
        If currentMonth > 12 Then
            currentMonth = 1
            currentYear = currentYear + 1
        End If

        If i > 12 Then Exit Do
    Loop

    GetWorkingDaysSummary = result
End Function
