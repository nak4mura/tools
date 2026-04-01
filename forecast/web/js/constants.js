/* globals FC */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.FC = root.FC || {};
    root.FC.constants = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var STORAGE_KEY = 'forecast_v1';
  var SCHEMA_VERSION = 1;

  var DEFAULT_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  ];

  var DEFAULT_CONFIG = {
    startYearMonth: new Date().getFullYear() + '/4',
    fiscalYear: new Date().getFullYear(),
    fiscalStartMonth: 4,
    hoursPerDay: 8,
    maxHorizonMonths: 36,
  };

  var SAMPLE_PROCESSES = [
    { id: 'P001', name: '要件定義', totalEffort: 200, order: 1, color: '#FF6B6B' },
    { id: 'P002', name: '設計',     totalEffort: 300, order: 2, color: '#4ECDC4' },
    { id: 'P003', name: '開発',     totalEffort: 800, order: 3, color: '#45B7D1' },
    { id: 'P004', name: 'テスト',   totalEffort: 400, order: 4, color: '#96CEB4' },
  ];

  var SAMPLE_MEMBERS = [
    { id: 'M001', name: '山田太郎', order: 1 },
    { id: 'M002', name: '鈴木花子', order: 2 },
    { id: 'M003', name: '田中一郎', order: 3 },
  ];

  var SAMPLE_ASSIGNMENTS = [
    { id: 'a_1', memberId: 'M001', processId: 'P001', hoursPerMonth: { '2026/4': 80, '2026/5': 80, '2026/6': 40 } },
    { id: 'a_2', memberId: 'M002', processId: 'P001', hoursPerMonth: { '2026/4': 40, '2026/5': 40 } },
    { id: 'a_3', memberId: 'M001', processId: 'P002', hoursPerMonth: { '2026/6': 40, '2026/7': 80, '2026/8': 80, '2026/9': 80 } },
    { id: 'a_4', memberId: 'M002', processId: 'P002', hoursPerMonth: { '2026/6': 40, '2026/7': 80, '2026/8': 80 } },
    { id: 'a_5', memberId: 'M002', processId: 'P003', hoursPerMonth: { '2026/7': 40, '2026/8': 80, '2026/9': 120, '2026/10': 120, '2026/11': 120, '2026/12': 120 } },
    { id: 'a_6', memberId: 'M003', processId: 'P003', hoursPerMonth: { '2026/7': 80, '2026/8': 120, '2026/9': 120, '2026/10': 120 } },
    { id: 'a_7', memberId: 'M003', processId: 'P004', hoursPerMonth: { '2026/10': 40, '2026/11': 120, '2026/12': 120, '2027/1': 120 } },
  ];

  return {
    STORAGE_KEY: STORAGE_KEY,
    SCHEMA_VERSION: SCHEMA_VERSION,
    DEFAULT_COLORS: DEFAULT_COLORS,
    DEFAULT_CONFIG: DEFAULT_CONFIG,
    SAMPLE_PROCESSES: SAMPLE_PROCESSES,
    SAMPLE_MEMBERS: SAMPLE_MEMBERS,
    SAMPLE_ASSIGNMENTS: SAMPLE_ASSIGNMENTS,
  };
}));
