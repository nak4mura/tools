Attribute VB_Name = "mod_DataEntry"
Option Explicit

'============================================================
' mod_DataEntry - データ入力支援
' 山積み表ツール用モジュール
'============================================================

'============================================================
' 入力規則設定
'============================================================

' データ検証（ドロップダウンリスト）の設定
Public Sub SetupDataValidation()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    Dim lastRow As Long
    lastRow = 1000 ' 十分な行数を確保

    ' 担当者列のドロップダウン設定
    Call SetupMemberValidation ws, lastRow

    ' 工程列のドロップダウン設定
    Call SetupProcessValidation ws, lastRow
End Sub

' 担当者ドロップダウン設定
Private Sub SetupMemberValidation(ws As Worksheet, lastRow As Long)
    Dim memberList As String
    memberList = GetMemberListString()

    With ws.Range(ws.Cells(2, colMember), ws.Cells(lastRow, colMember)).Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Formula1:=memberList
        .IgnoreBlank = True
        .InCellDropdown = True
    End With
End Sub

' 工程ドロップダウン設定
Private Sub SetupProcessValidation(ws As Worksheet, lastRow As Long)
    Dim processList As String
    processList = GetProcessListString()

    With ws.Range(ws.Cells(2, colProcess), ws.Cells(lastRow, colProcess)).Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Formula1:=processList
        .IgnoreBlank = True
        .InCellDropdown = True
    End With
End Sub

' 担当者リスト文字列取得
Private Function GetMemberListString() As String
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MASTER_MEMBER)

    Dim lastRow As Long
    lastRow = GetLastRow(ws, 2)

    Dim result As String
    result = ""

    Dim i As Long
    For i = 2 To lastRow
        If result = "" Then
            result = ws.Cells(i, colMemberName).Value
        Else
            result = result & "," & ws.Cells(i, colMemberName).Value
        End If
    Next i

    GetMemberListString = result
End Function

' 工程リスト文字列取得
Private Function GetProcessListString() As String
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MASTER_PROCESS)

    Dim lastRow As Long
    lastRow = GetLastRow(ws, 2)

    Dim result As String
    result = ""

    Dim i As Long
    For i = 2 To lastRow
        If result = "" Then
            result = ws.Cells(i, colProcessName).Value
        Else
            result = result & "," & ws.Cells(i, colProcessName).Value
        End If
    Next i

    GetProcessListString = result
End Function

'============================================================
' 条件付き書式設定
'============================================================

' 条件付き書式の設定
Public Sub SetupConditionalFormatting()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    ' 既存の条件付き書式をクリア
    ws.Cells.FormatConditions.Delete

    ' 工程別の色分け
    Call SetupProcessColorFormatting(ws)

    ' 過積載警告
    Call SetupOverloadWarning(ws)
End Sub

' 工程別の色分け設定
Private Sub SetupProcessColorFormatting(ws As Worksheet)
    Dim processWs As Worksheet
    Set processWs = ThisWorkbook.Sheets(SHEET_MASTER_PROCESS)

    Dim lastRow As Long
    lastRow = GetLastRow(processWs)

    Dim i As Long
    For i = 2 To lastRow
        Dim processName As String
        Dim processColor As String

        processName = processWs.Cells(i, colProcessName).Value
        processColor = processWs.Cells(i, colProcessColor).Value

        If processName <> "" And processColor <> "" Then
            Call AddProcessColorCondition ws, processName, processColor
        End If
    Next i
End Sub

' 工程の色条件を追加
Private Sub AddProcessColorCondition(ws As Worksheet, processName As String, hexColor As String)
    Dim colorValue As Long
    colorValue = HexToColor(hexColor)

    Dim dataRange As Range
    Set dataRange = ws.Range("A2:Z1000")

    ' B列（工程列）の値に基づいて色分け
    Dim formula As String
    formula = "=$B2=""" & processName & """"

    With dataRange.FormatConditions.Add(Type:=xlExpression, Formula1:=formula)
        .Interior.Color = colorValue
    End With
End Sub

' 過積載警告設定
Private Sub SetupOverloadWarning(ws As Worksheet)
    ' 工数入力セルに対する過積載警告（赤字）
    Dim dataRange As Range
    Set dataRange = ws.Range(ws.Cells(2, colMonthStart), ws.Cells(1000, colMonthStart + 11))

    ' 標準の120%以上（160時間以上）で警告
    With dataRange.FormatConditions.Add(Type:=xlCellValue, Operator:=xlGreaterEqual, Formula1:="160")
        .Font.Color = RGB(255, 0, 0)
        .Font.Bold = True
    End With
End Sub

'============================================================
' 行操作
'============================================================

' 新規行追加（担当者×工程）
Public Sub AddWorkloadRow(Optional memberName As String = "", Optional processName As String = "")
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    Dim lastRow As Long
    lastRow = GetLastRow(ws)

    ' 新しい行に値を設定
    If memberName <> "" Then
        ws.Cells(lastRow + 1, colMember).Value = memberName
    End If

    If processName <> "" Then
        ws.Cells(lastRow + 1, colProcess).Value = processName
    End If

    ' 数式をコピー（合計列など）
    If lastRow >= 2 Then
        ' 書式をコピー
        ws.Rows(lastRow).Copy
        ws.Rows(lastRow + 1).PasteSpecial Paste:=xlPasteFormats
        Application.CutCopyMode = False
    End If

    ' 新しい行を選択
    ws.Cells(lastRow + 1, colMember).Select
End Sub

' 選択行の削除
Public Sub DeleteSelectedRow()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    Dim selectedRow As Long
    selectedRow = Selection.Row

    If selectedRow <= 1 Then
        MsgBox "ヘッダー行は削除できません。", vbExclamation, "確認"
        Exit Sub
    End If

    If MsgBox("選択した行を削除しますか？", vbQuestion + vbYesNo, "確認") = vbYes Then
        ws.Rows(selectedRow).Delete
    End If
End Sub

' 行のコピー
Public Sub CopySelectedRow()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    Dim selectedRow As Long
    selectedRow = Selection.Row

    If selectedRow <= 1 Then
        MsgBox "ヘッダー行はコピーできません。", vbExclamation, "確認"
        Exit Sub
    End If

    Dim lastRow As Long
    lastRow = GetLastRow(ws)

    ws.Rows(selectedRow).Copy
    ws.Rows(lastRow + 1).PasteSpecial Paste:=xlPasteAll
    Application.CutCopyMode = False

    ' コピー先の担当者名を変更
    ws.Cells(lastRow + 1, colMember).Value = ws.Cells(lastRow + 1, colMember).Value & " (コピー)"
    ws.Cells(lastRow + 1, colMember).Select
End Sub

'============================================================
' 入力バリデーション
'============================================================

' 入力値のバリデーション
Public Function ValidateInput(value As Variant) As Boolean
    If IsEmpty(value) Or value = "" Then
        ValidateInput = True
        Exit Function
    End If

    ' 数値チェック
    If Not IsNumeric(value) Then
        ValidateInput = False
        Exit Function
    End If

    ' 正の値チェック
    If CDbl(value) < 0 Then
        ValidateInput = False
        Exit Function
    End If

    ValidateInput = True
End Function

' 担当者・工程の組み合わせ重複チェック
Public Function IsDuplicateRow(memberName As String, processName As String, Optional excludeRow As Long = 0) As Boolean
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    Dim lastRow As Long
    lastRow = GetLastRow(ws)

    Dim i As Long
    For i = 2 To lastRow
        If i <> excludeRow Then
            If ws.Cells(i, colMember).Value = memberName And ws.Cells(i, colProcess).Value = processName Then
                IsDuplicateRow = True
                Exit Function
            End If
        End If
    Next i

    IsDuplicateRow = False
End Function

'============================================================
' 一括操作
'============================================================

' 全データクリア
Public Sub ClearAllData()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    If MsgBox("全データを削除しますか？", vbQuestion + vbYesNo, "確認") = vbYes Then
        Dim lastRow As Long
        lastRow = GetLastRow(ws)

        If lastRow > 1 Then
            ws.Rows("2:" & lastRow).Delete
        End If

        MsgBox "データをクリアしました。", vbInformation, "完了"
    End If
End Sub

' サンプルデータ入力
Public Sub InsertSampleData()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(SHEET_MAIN_INPUT)

    ' 既存データの確認
    Dim lastRow As Long
    lastRow = GetLastRow(ws)

    If lastRow > 1 Then
        If MsgBox("既存データがあります。サンプルデータを追加しますか？", vbQuestion + vbYesNo, "確認") = vbNo Then
            Exit Sub
        End If
    End If

    ' サンプルデータ
    Dim sampleData As Variant
    sampleData = Array( _
        Array("山田太郎", "要件定義", 40, 60, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0), _
        Array("山田太郎", "設計", 0, 40, 80, 60, 0, 0, 0, 0, 0, 0, 0, 0), _
        Array("佐藤花子", "設計", 60, 80, 40, 0, 0, 0, 0, 0, 0, 0, 0, 0), _
        Array("佐藤花子", "開発", 0, 0, 40, 80, 120, 80, 0, 0, 0, 0, 0, 0), _
        Array("鈴木一郎", "開発", 0, 0, 0, 40, 80, 120, 80, 0, 0, 0, 0, 0), _
        Array("鈴木一郎", "テスト", 0, 0, 0, 0, 0, 40, 80, 120, 80, 0, 0, 0), _
        Array("田中美咲", "テスト", 0, 0, 0, 0, 0, 0, 0, 40, 80, 120, 60, 0) _
    )

    Dim i As Long
    Dim j As Long
    Dim startRow As Long

    startRow = lastRow + 1

    For i = LBound(sampleData) To UBound(sampleData)
        ws.Cells(startRow + i, colMember).Value = sampleData(i)(0)
        ws.Cells(startRow + i, colProcess).Value = sampleData(i)(1)

        For j = 0 To 11
            ws.Cells(startRow + i, colMonthStart + j).Value = sampleData(i)(2 + j)
        Next j
    Next i

    ' 合計計算
    Call CalculateWorkload

    MsgBox "サンプルデータを追加しました。", vbInformation, "完了"
End Sub
