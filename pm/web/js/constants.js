/* globals YM */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.YM = root.YM || {};
    root.YM.constants = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DEFAULT_PROCESSES = [
    { id: 'REQ', name: '要件定義', color: '#FF6B6B', order: 1 },
    { id: 'DES', name: '設計',     color: '#4ECDC4', order: 2 },
    { id: 'DEV', name: '開発',     color: '#45B7D1', order: 3 },
    { id: 'TST', name: 'テスト',   color: '#96CEB4', order: 4 },
    { id: 'REL', name: 'リリース', color: '#FFEAA7', order: 5 },
  ];

  var DEFAULT_CONFIG = {
    fiscalYear: new Date().getFullYear(),
    fiscalStartMonth: 4,
    hoursPerDay: 8,
    overloadThreshold: 1.2,
  };

  var STORAGE_KEY = 'yamazumi_v1';
  var SCHEMA_VERSION = 1;

  var DEFAULT_HOLIDAYS = [
    // 2024年
    { date: '2024-01-01', name: '元日' },
    { date: '2024-01-08', name: '成人の日' },
    { date: '2024-02-11', name: '建国記念の日' },
    { date: '2024-02-12', name: '振替休日' },
    { date: '2024-03-20', name: '春分の日' },
    { date: '2024-04-29', name: '昭和の日' },
    { date: '2024-05-03', name: '憲法記念日' },
    { date: '2024-05-04', name: 'みどりの日' },
    { date: '2024-05-05', name: 'こどもの日' },
    { date: '2024-05-06', name: '振替休日' },
    { date: '2024-07-15', name: '海の日' },
    { date: '2024-08-11', name: '山の日' },
    { date: '2024-08-12', name: '振替休日' },
    { date: '2024-09-16', name: '敬老の日' },
    { date: '2024-09-22', name: '秋分の日' },
    { date: '2024-09-23', name: '振替休日' },
    { date: '2024-10-14', name: 'スポーツの日' },
    { date: '2024-11-03', name: '文化の日' },
    { date: '2024-11-04', name: '振替休日' },
    { date: '2024-11-23', name: '勤労感謝の日' },
    // 2025年
    { date: '2025-01-01', name: '元日' },
    { date: '2025-01-13', name: '成人の日' },
    { date: '2025-02-11', name: '建国記念の日' },
    { date: '2025-03-20', name: '春分の日' },
    { date: '2025-04-29', name: '昭和の日' },
    { date: '2025-05-03', name: '憲法記念日' },
    { date: '2025-05-04', name: 'みどりの日' },
    { date: '2025-05-05', name: 'こどもの日' },
    { date: '2025-07-21', name: '海の日' },
    { date: '2025-08-11', name: '山の日' },
    { date: '2025-09-15', name: '敬老の日' },
    { date: '2025-09-23', name: '秋分の日' },
    { date: '2025-10-13', name: 'スポーツの日' },
    { date: '2025-11-03', name: '文化の日' },
    { date: '2025-11-23', name: '勤労感謝の日' },
    { date: '2025-11-24', name: '振替休日' },
    // 2026年
    { date: '2026-01-01', name: '元日' },
    { date: '2026-01-12', name: '成人の日' },
    { date: '2026-02-11', name: '建国記念の日' },
    { date: '2026-03-20', name: '春分の日' },
    { date: '2026-04-29', name: '昭和の日' },
    { date: '2026-05-03', name: '憲法記念日' },
    { date: '2026-05-04', name: 'みどりの日' },
    { date: '2026-05-05', name: 'こどもの日' },
    { date: '2026-05-06', name: '振替休日' },
    { date: '2026-07-20', name: '海の日' },
    { date: '2026-08-11', name: '山の日' },
    { date: '2026-09-21', name: '敬老の日' },
    { date: '2026-09-23', name: '秋分の日' },
    { date: '2026-10-12', name: 'スポーツの日' },
    { date: '2026-11-03', name: '文化の日' },
    { date: '2026-11-23', name: '勤労感謝の日' },
  ];

  var SAMPLE_MEMBERS = [
    { id: 'M001', name: '山田太郎', department: '開発部', role: 'PM', order: 1 },
    { id: 'M002', name: '鈴木花子', department: '開発部', role: 'SE', order: 2 },
    { id: 'M003', name: '田中一郎', department: 'QA部',  role: 'QA', order: 3 },
  ];

  var SAMPLE_WORKLOAD = [
    { memberId: 'M001', processId: 'REQ', hours: { '4': 40, '5': 20 } },
    { memberId: 'M001', processId: 'DES', hours: { '5': 40, '6': 60 } },
    { memberId: 'M002', processId: 'DEV', hours: { '6': 80, '7': 120, '8': 80 } },
    { memberId: 'M003', processId: 'TST', hours: { '8': 40, '9': 80, '10': 40 } },
  ];

  return {
    DEFAULT_PROCESSES: DEFAULT_PROCESSES,
    DEFAULT_CONFIG: DEFAULT_CONFIG,
    STORAGE_KEY: STORAGE_KEY,
    SCHEMA_VERSION: SCHEMA_VERSION,
    DEFAULT_HOLIDAYS: DEFAULT_HOLIDAYS,
    SAMPLE_MEMBERS: SAMPLE_MEMBERS,
    SAMPLE_WORKLOAD: SAMPLE_WORKLOAD,
  };
}));
