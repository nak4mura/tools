#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
山積み表ツール - Excelファイル構造生成スクリプト

このスクリプトは、山積み表ツールのExcelファイル構造（シート、ヘッダー、書式）
を生成します。VBAモジュールは別途Excelにインポートしてください。

使用方法:
    python create_excel_structure.py

出力:
    山積み表ツール.xlsx
"""

import datetime
from xlsxwriter import Workbook
from xlsxwriter.utility import xl_col_to_name

# シート名
SHEET_MAIN_INPUT = "メイン入力"
SHEET_MASTER_PROCESS = "マスタ_工程"
SHEET_MASTER_MEMBER = "マスタ_担当者"
SHEET_MASTER_HOLIDAY = "マスタ_祝日"
SHEET_MASTER_CONFIG = "マスタ_設定"
SHEET_SUMMARY_MEMBER = "サマリー_担当者別"
SHEET_SUMMARY_PROCESS = "サマリー_工程別"
SHEET_GANTT = "ガントチャート"
SHEET_DASHBOARD = "ダッシュボード"

# 列インデックス
COL_MEMBER = 0    # A列
COL_PROCESS = 1   # B列
COL_MONTH_START = 2  # C列から


def create_workbook():
    """Excelファイルを作成"""
    wb = Workbook("山積み表ツール.xlsx")

    # フォーマット定義
    fmt_header = wb.add_format({
        'bold': True,
        'bg_color': '#C0C0C0',
        'align': 'center',
        'valign': 'vcenter',
        'border': 1
    })

    fmt_data = wb.add_format({
        'border': 1,
        'valign': 'vcenter'
    })

    fmt_number = wb.add_format({
        'border': 1,
        'valign': 'vcenter',
        'num_format': '#,##0'
    })

    # 各シートを作成
    create_main_input_sheet(wb, fmt_header, fmt_data, fmt_number)
    create_process_master_sheet(wb, fmt_header, fmt_data)
    create_member_master_sheet(wb, fmt_header, fmt_data)
    create_holiday_master_sheet(wb, fmt_header, fmt_data)
    create_config_master_sheet(wb, fmt_header, fmt_data)
    create_summary_sheets(wb, fmt_header, fmt_data)
    create_gantt_sheet(wb, fmt_header, fmt_data)
    create_dashboard_sheet(wb, fmt_header, fmt_data)

    wb.close()
    print("Excelファイル '山積み表ツール.xlsx' を生成しました。")


def create_main_input_sheet(wb, fmt_header, fmt_data, fmt_number):
    """メイン入力シートを作成"""
    ws = wb.add_worksheet(SHEET_MAIN_INPUT)

    # ヘッダー行
    headers = ["担当者", "工程"]

    # 年度に基づいた月ヘッダー（現在の年度、4月開始）
    current_year = datetime.datetime.now().year
    start_month = 4

    for i in range(12):
        month = start_month + i
        year = current_year
        if month > 12:
            month -= 12
            year = current_year + 1
        headers.append(f"{year}/{month}")

    headers.append("合計")

    # ヘッダー書き込み
    for col, header in enumerate(headers):
        ws.write(0, col, header, fmt_header)
        ws.set_column(col, col, 12 if col >= COL_MONTH_START else 15)

    # サンプルデータ
    sample_data = [
        ["山田太郎", "要件定義", 40, 60, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, "=SUM(C2:N2)"],
        ["山田太郎", "設計", 0, 40, 80, 60, 0, 0, 0, 0, 0, 0, 0, 0, "=SUM(C3:N3)"],
        ["佐藤花子", "設計", 60, 80, 40, 0, 0, 0, 0, 0, 0, 0, 0, 0, "=SUM(C4:N4)"],
        ["佐藤花子", "開発", 0, 0, 40, 80, 120, 80, 0, 0, 0, 0, 0, 0, "=SUM(C5:N5)"],
        ["鈴木一郎", "開発", 0, 0, 0, 40, 80, 120, 80, 0, 0, 0, 0, 0, "=SUM(C6:N6)"],
        ["鈴木一郎", "テスト", 0, 0, 0, 0, 0, 40, 80, 120, 80, 0, 0, 0, "=SUM(C7:N7)"],
        ["田中美咲", "テスト", 0, 0, 0, 0, 0, 0, 0, 40, 80, 120, 60, 0, "=SUM(C8:N8)"],
    ]

    for row_idx, row_data in enumerate(sample_data, start=1):
        for col_idx, value in enumerate(row_data):
            if isinstance(value, str) and value.startswith("="):
                ws.write_formula(row_idx, col_idx, value, fmt_number)
            elif isinstance(value, (int, float)):
                ws.write_number(row_idx, col_idx, value, fmt_number)
            else:
                ws.write(row_idx, col_idx, value, fmt_data)

    # フリーズペイン
    ws.freeze_panes(2, 0)


def create_process_master_sheet(wb, fmt_header, fmt_data):
    """工程マスタシートを作成"""
    ws = wb.add_worksheet(SHEET_MASTER_PROCESS)

    headers = ["工程ID", "工程名", "色", "表示順"]
    for col, header in enumerate(headers):
        ws.write(0, col, header, fmt_header)

    # デフォルトデータ
    default_data = [
        ["REQ", "要件定義", "#FF6B6B", 1],
        ["DES", "設計", "#4ECDC4", 2],
        ["DEV", "開発", "#45B7D1", 3],
        ["TST", "テスト", "#96CEB4", 4],
        ["REL", "リリース", "#FFEAA7", 5],
    ]

    for row_idx, row_data in enumerate(default_data, start=1):
        for col_idx, value in enumerate(row_data):
            ws.write(row_idx, col_idx, value, fmt_data)

    # 列幅
    ws.set_column(0, 0, 10)
    ws.set_column(1, 1, 12)
    ws.set_column(2, 2, 10)
    ws.set_column(3, 3, 10)


def create_member_master_sheet(wb, fmt_header, fmt_data):
    """担当者マスタシートを作成"""
    ws = wb.add_worksheet(SHEET_MASTER_MEMBER)

    headers = ["担当者ID", "氏名", "所属", "役割", "表示順"]
    for col, header in enumerate(headers):
        ws.write(0, col, header, fmt_header)

    # サンプルデータ
    default_data = [
        ["YAMADA_T", "山田太郎", "開発部", "SE", 1],
        ["SATO_H", "佐藤花子", "開発部", "PG", 2],
        ["SUZUKI_K", "鈴木一郎", "開発部", "PG", 3],
        ["TANAKA_M", "田中美咲", "開発部", "PG", 4],
    ]

    for row_idx, row_data in enumerate(default_data, start=1):
        for col_idx, value in enumerate(row_data):
            ws.write(row_idx, col_idx, value, fmt_data)

    # 列幅
    ws.set_column(0, 0, 12)
    ws.set_column(1, 1, 12)
    ws.set_column(2, 2, 10)
    ws.set_column(3, 3, 8)
    ws.set_column(4, 4, 8)


def create_holiday_master_sheet(wb, fmt_header, fmt_data):
    """祝日マスタシートを作成"""
    ws = wb.add_worksheet(SHEET_MASTER_HOLIDAY)

    headers = ["日付", "祝日名", "種別"]
    for col, header in enumerate(headers):
        ws.write(0, col, header, fmt_header)

    # 2024-2025年の祝日データ
    holidays = [
        (datetime.date(2024, 1, 1), "元日", "国民の祝日"),
        (datetime.date(2024, 1, 8), "成人の日", "国民の祝日"),
        (datetime.date(2024, 2, 11), "建国記念の日", "国民の祝日"),
        (datetime.date(2024, 2, 23), "天皇誕生日", "国民の祝日"),
        (datetime.date(2024, 3, 20), "春分の日", "国民の祝日"),
        (datetime.date(2024, 4, 29), "昭和の日", "国民の祝日"),
        (datetime.date(2024, 5, 3), "憲法記念日", "国民の祝日"),
        (datetime.date(2024, 5, 4), "みどりの日", "国民の祝日"),
        (datetime.date(2024, 5, 5), "こどもの日", "国民の祝日"),
        (datetime.date(2024, 7, 15), "海の日", "国民の祝日"),
        (datetime.date(2024, 8, 11), "山の日", "国民の祝日"),
        (datetime.date(2024, 9, 16), "敬老の日", "国民の祝日"),
        (datetime.date(2024, 9, 22), "秋分の日", "国民の祝日"),
        (datetime.date(2024, 10, 14), "スポーツの日", "国民の祝日"),
        (datetime.date(2024, 11, 3), "文化の日", "国民の祝日"),
        (datetime.date(2024, 11, 23), "勤労感謝の日", "国民の祝日"),
        (datetime.date(2025, 1, 1), "元日", "国民の祝日"),
        (datetime.date(2025, 1, 13), "成人の日", "国民の祝日"),
        (datetime.date(2025, 2, 11), "建国記念の日", "国民の祝日"),
        (datetime.date(2025, 2, 23), "天皇誕生日", "国民の祝日"),
        (datetime.date(2025, 3, 20), "春分の日", "国民の祝日"),
        (datetime.date(2025, 4, 29), "昭和の日", "国民の祝日"),
        (datetime.date(2025, 5, 3), "憲法記念日", "国民の祝日"),
        (datetime.date(2025, 5, 4), "みどりの日", "国民の祝日"),
        (datetime.date(2025, 5, 5), "こどもの日", "国民の祝日"),
        (datetime.date(2025, 7, 21), "海の日", "国民の祝日"),
        (datetime.date(2025, 8, 11), "山の日", "国民の祝日"),
        (datetime.date(2025, 9, 15), "敬老の日", "国民の祝日"),
        (datetime.date(2025, 9, 23), "秋分の日", "国民の祝日"),
        (datetime.date(2025, 10, 13), "スポーツの日", "国民の祝日"),
        (datetime.date(2025, 11, 3), "文化の日", "国民の祝日"),
        (datetime.date(2025, 11, 23), "勤労感謝の日", "国民の祝日"),
    ]

    date_fmt = wb.add_format({'num_format': 'yyyy/m/d', 'border': 1})

    for row_idx, (date, name, type_) in enumerate(holidays, start=1):
        ws.write_datetime(row_idx, 0, date, date_fmt)
        ws.write(row_idx, 1, name, fmt_data)
        ws.write(row_idx, 2, type_, fmt_data)

    # 列幅
    ws.set_column(0, 0, 12)
    ws.set_column(1, 1, 15)
    ws.set_column(2, 2, 12)


def create_config_master_sheet(wb, fmt_header, fmt_data):
    """設定マスタシートを作成"""
    ws = wb.add_worksheet(SHEET_MASTER_CONFIG)

    headers = ["設定項目", "設定値"]
    for col, header in enumerate(headers):
        ws.write(0, col, header, fmt_header)

    # デフォルト設定
    current_year = datetime.datetime.now().year
    config_data = [
        ["対象年度", current_year],
        ["年度開始月", 4],
        ["標準稼働時間/日", 8],
        ["過積載警告閾値", 1.2],
    ]

    for row_idx, (item, value) in enumerate(config_data, start=1):
        ws.write(row_idx, 0, item, fmt_data)
        ws.write(row_idx, 1, value, fmt_data)

    # 列幅
    ws.set_column(0, 0, 18)
    ws.set_column(1, 1, 12)


def create_summary_sheets(wb, fmt_header, fmt_data):
    """サマリーシートを作成"""
    # 担当者別サマリー
    ws_member = wb.add_worksheet(SHEET_SUMMARY_MEMBER)
    ws_member.write(0, 0, "担当者", fmt_header)
    ws_member.write(0, 1, "要件定義", fmt_header)
    ws_member.write(0, 2, "設計", fmt_header)
    ws_member.write(0, 3, "開発", fmt_header)
    ws_member.write(0, 4, "テスト", fmt_header)
    ws_member.write(0, 5, "リリース", fmt_header)
    ws_member.write(0, 6, "合計", fmt_header)

    # 工程別サマリー
    ws_process = wb.add_worksheet(SHEET_SUMMARY_PROCESS)
    ws_process.write(0, 0, "工程", fmt_header)

    current_year = datetime.datetime.now().year
    start_month = 4
    for i in range(12):
        month = start_month + i
        year = current_year
        if month > 12:
            month -= 12
            year = current_year + 1
        ws_process.write(0, i + 1, f"{year}/{month}", fmt_header)
    ws_process.write(0, 14, "合計", fmt_header)


def create_gantt_sheet(wb, fmt_header, fmt_data):
    """ガントチャートシートを作成"""
    ws = wb.add_worksheet(SHEET_GANTT)
    ws.write(0, 0, "担当者", fmt_header)
    ws.write(0, 1, "工程", fmt_header)

    current_year = datetime.datetime.now().year
    start_month = 4
    for i in range(12):
        month = start_month + i
        year = current_year
        if month > 12:
            month -= 12
            year = current_year + 1
        ws.write(0, i + 2, f"{year}/{month}", fmt_header)


def create_dashboard_sheet(wb, fmt_header, fmt_data):
    """ダッシュボードシートを作成"""
    ws = wb.add_worksheet(SHEET_DASHBOARD)

    title_fmt = wb.add_format({'bold': True, 'font_size': 20})
    subtitle_fmt = wb.add_format({'bold': True, 'font_size': 14})

    ws.write(0, 0, "山積み表ダッシュボード", title_fmt)
    ws.write(2, 0, "■ プロジェクト概要", subtitle_fmt)
    ws.write(3, 0, "（VBAマクロ実行後に更新されます）")


if __name__ == "__main__":
    create_workbook()
