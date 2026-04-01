import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const calc = require('../js/calc.js');
const {
  getMemberMonthlyHours,
  getMemberTotal,
  getProcessTotal,
  getMonthlyTotal,
  calculateOverloadRate,
  isOverloaded,
  buildMemberSummary,
  buildProcessSummary,
  isDuplicateRow,
} = calc;

const sampleState = {
  config: { fiscalYear: 2024, fiscalStartMonth: 4, hoursPerDay: 8, overloadThreshold: 1.2 },
  processes: [
    { id: 'REQ', name: '要件定義', color: '#FF6B6B', order: 1 },
    { id: 'DEV', name: '開発',     color: '#45B7D1', order: 2 },
  ],
  members: [
    { id: 'M001', name: '山田太郎', department: '開発部', role: 'PM', order: 1 },
    { id: 'M002', name: '鈴木花子', department: '開発部', role: 'SE', order: 2 },
  ],
  holidays: [],
  workload: [
    { id: 'row_1', memberId: 'M001', processId: 'REQ', hours: { '2024/4': 40, '2024/5': 60, '2024/6': 20 } },
    { id: 'row_2', memberId: 'M001', processId: 'DEV', hours: { '2024/4': 80, '2024/5': 40 } },
    { id: 'row_3', memberId: 'M002', processId: 'DEV', hours: { '2024/4': 100, '2024/6': 50 } },
  ],
};

describe('getMemberMonthlyHours', () => {
  test('指定メンバー・月の合計時間を返す', () => {
    assert.equal(getMemberMonthlyHours(sampleState, 'M001', '2024/4'), 120);
  });
  test('該当月のデータがない場合は0を返す', () => {
    assert.equal(getMemberMonthlyHours(sampleState, 'M001', '2024/7'), 0);
  });
  test('不明なメンバーIDは0を返す', () => {
    assert.equal(getMemberMonthlyHours(sampleState, 'M999', '2024/4'), 0);
  });
  test('複数工程の合算が正しい', () => {
    assert.equal(getMemberMonthlyHours(sampleState, 'M001', '2024/5'), 100);
  });
});

describe('getMemberTotal', () => {
  test('メンバーの全月・全工程合計を返す', () => {
    assert.equal(getMemberTotal(sampleState, 'M001'), 240);
  });
  test('不明なメンバーIDは0を返す', () => {
    assert.equal(getMemberTotal(sampleState, 'M999'), 0);
  });
});

describe('getProcessTotal', () => {
  test('工程の全メンバー・全月合計を返す', () => {
    assert.equal(getProcessTotal(sampleState, 'DEV'), 270);
  });
  test('不明な工程IDは0を返す', () => {
    assert.equal(getProcessTotal(sampleState, 'TST'), 0);
  });
});

describe('getMonthlyTotal', () => {
  test('指定月の全メンバー・全工程合計を返す', () => {
    assert.equal(getMonthlyTotal(sampleState, '2024/4'), 220);
  });
  test('データのない月は0を返す', () => {
    assert.equal(getMonthlyTotal(sampleState, '2025/1'), 0);
  });
});

describe('calculateOverloadRate', () => {
  test('正常な割り算結果を返す', () => {
    assert.equal(calculateOverloadRate(120, 100), 1.2);
  });
  test('標準時間が0の場合は0を返す', () => {
    assert.equal(calculateOverloadRate(120, 0), 0);
  });
  test('小数点の精度が保たれる', () => {
    assert.ok(Math.abs(calculateOverloadRate(50, 160) - 0.3125) < 0.0001);
  });
});

describe('isOverloaded', () => {
  test('閾値超過でtrueを返す', () => {
    assert.equal(isOverloaded(1.3, 1.2), true);
  });
  test('閾値未満でfalseを返す', () => {
    assert.equal(isOverloaded(1.1, 1.2), false);
  });
  test('閾値ちょうどはfalseを返す（超過ではない）', () => {
    assert.equal(isOverloaded(1.2, 1.2), false);
  });
});

describe('buildMemberSummary', () => {
  test('担当者別サマリーの形状が正しい', () => {
    const summary = buildMemberSummary(sampleState);
    assert.ok(Array.isArray(summary));
    assert.equal(summary.length, 2);
  });
  test('M001のREQ合計が正しい', () => {
    const summary = buildMemberSummary(sampleState);
    const m001 = summary.find((r) => r.memberId === 'M001');
    assert.ok(m001);
    assert.equal(m001.byProcess['REQ'], 120);
  });
  test('M001の総計が正しい', () => {
    const summary = buildMemberSummary(sampleState);
    const m001 = summary.find((r) => r.memberId === 'M001');
    assert.equal(m001.total, 240);
  });
});

describe('buildProcessSummary', () => {
  test('工程別サマリーの形状が正しい', () => {
    const summary = buildProcessSummary(sampleState);
    assert.ok(Array.isArray(summary));
    assert.equal(summary.length, 2);
  });
  test('DEVの2024/4合計が正しい', () => {
    const summary = buildProcessSummary(sampleState);
    const dev = summary.find((r) => r.processId === 'DEV');
    assert.ok(dev);
    assert.equal(dev.byMonth['2024/4'], 180);
  });
  test('全工程グランドトータルが全workload合計と一致する', () => {
    const summary = buildProcessSummary(sampleState);
    const grandTotal = summary.reduce((sum, r) => sum + r.total, 0);
    assert.equal(grandTotal, 390);
  });
});

describe('isDuplicateRow', () => {
  test('既存の担当者+工程の組み合わせを検出する', () => {
    assert.equal(isDuplicateRow(sampleState, 'M001', 'REQ', null), true);
  });
  test('新しい組み合わせはfalseを返す', () => {
    assert.equal(isDuplicateRow(sampleState, 'M002', 'REQ', null), false);
  });
  test('自行を除外して検証する（編集時）', () => {
    assert.equal(isDuplicateRow(sampleState, 'M001', 'REQ', 'row_1'), false);
  });
});
