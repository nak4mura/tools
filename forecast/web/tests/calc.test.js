import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const calc = require('../js/calc.js');
const {
  nextYearMonth,
  getMonthRange,
  getProcessMonthlyHours,
  getMemberMonthlyHours,
  forecast,
} = calc;

/* ---------------------------------------------------------- */
/*  Shared sample state                                        */
/* ---------------------------------------------------------- */
const sampleState = {
  config: {
    startYearMonth: '2026/4',
    fiscalYear: 2026,
    fiscalStartMonth: 4,
    hoursPerDay: 8,
    maxHorizonMonths: 36,
  },
  processes: [
    { id: 'P001', name: '要件定義', totalEffort: 200, order: 1, color: '#FF6B6B' },
    { id: 'P002', name: '開発',     totalEffort: 100, order: 2, color: '#45B7D1' },
  ],
  members: [
    { id: 'M001', name: '山田太郎', order: 1 },
    { id: 'M002', name: '鈴木花子', order: 2 },
  ],
  assignments: [
    { id: 'a_1', memberId: 'M001', processId: 'P001', hoursPerMonth: { '2026/4': 40, '2026/5': 60, '2026/6': 60 } },
    { id: 'a_2', memberId: 'M002', processId: 'P001', hoursPerMonth: { '2026/4': 20, '2026/5': 30 } },
    { id: 'a_3', memberId: 'M002', processId: 'P002', hoursPerMonth: { '2026/5': 50, '2026/6': 50, '2026/7': 50 } },
  ],
};

/* ========================================================== */
/*  nextYearMonth                                              */
/* ========================================================== */
describe('nextYearMonth', function () {
  test('increments month within same year', function () {
    assert.equal(nextYearMonth('2026/4'), '2026/5');
  });

  test('increments month 11 to 12', function () {
    assert.equal(nextYearMonth('2026/11'), '2026/12');
  });

  test('rolls over from December to January of next year', function () {
    assert.equal(nextYearMonth('2026/12'), '2027/1');
  });

  test('handles January', function () {
    assert.equal(nextYearMonth('2025/1'), '2025/2');
  });
});

/* ========================================================== */
/*  getMonthRange                                              */
/* ========================================================== */
describe('getMonthRange', function () {
  test('returns correct range of 3 months', function () {
    assert.deepEqual(getMonthRange('2026/4', 3), ['2026/4', '2026/5', '2026/6']);
  });

  test('returns single month for count=1', function () {
    assert.deepEqual(getMonthRange('2026/10', 1), ['2026/10']);
  });

  test('crosses year boundary', function () {
    assert.deepEqual(getMonthRange('2026/11', 4), ['2026/11', '2026/12', '2027/1', '2027/2']);
  });

  test('returns empty array for count=0', function () {
    assert.deepEqual(getMonthRange('2026/4', 0), []);
  });
});

/* ========================================================== */
/*  getProcessMonthlyHours                                     */
/* ========================================================== */
describe('getProcessMonthlyHours', function () {
  test('sums hours from multiple members for a process in a month', function () {
    // P001: M001=40 + M002=20 in 2026/4
    assert.equal(getProcessMonthlyHours(sampleState, 'P001', '2026/4'), 60);
  });

  test('returns single member hours when only one assigned', function () {
    // P002: only M002=50 in 2026/5
    assert.equal(getProcessMonthlyHours(sampleState, 'P002', '2026/5'), 50);
  });

  test('returns 0 for month with no assignments', function () {
    assert.equal(getProcessMonthlyHours(sampleState, 'P001', '2026/9'), 0);
  });

  test('returns 0 for unknown processId', function () {
    assert.equal(getProcessMonthlyHours(sampleState, 'UNKNOWN', '2026/4'), 0);
  });
});

/* ========================================================== */
/*  getMemberMonthlyHours                                      */
/* ========================================================== */
describe('getMemberMonthlyHours', function () {
  test('sums hours across processes for a member in a month', function () {
    // M002 in 2026/5: P001=30 + P002=50
    assert.equal(getMemberMonthlyHours(sampleState, 'M002', '2026/5'), 80);
  });

  test('returns single process hours', function () {
    // M001 in 2026/4: P001=40 only
    assert.equal(getMemberMonthlyHours(sampleState, 'M001', '2026/4'), 40);
  });

  test('returns 0 for month with no work', function () {
    assert.equal(getMemberMonthlyHours(sampleState, 'M001', '2026/9'), 0);
  });

  test('returns 0 for unknown memberId', function () {
    assert.equal(getMemberMonthlyHours(sampleState, 'UNKNOWN', '2026/4'), 0);
  });
});

/* ========================================================== */
/*  forecast                                                   */
/* ========================================================== */
describe('forecast', function () {

  test('basic: single process, single member, completes in expected month', function () {
    var state = {
      config: { startYearMonth: '2026/4', maxHorizonMonths: 36 },
      processes: [{ id: 'P1', name: 'テスト工程', totalEffort: 100 }],
      members: [{ id: 'M1', name: 'テスト太郎' }],
      assignments: [
        { id: 'a1', memberId: 'M1', processId: 'P1', hoursPerMonth: { '2026/4': 50, '2026/5': 50 } },
      ],
    };
    var results = forecast(state);
    assert.equal(results.length, 1);
    assert.equal(results[0].processId, 'P1');
    assert.equal(results[0].completionYearMonth, '2026/5');
  });

  test('process completes mid-month when remaining < monthly hours', function () {
    var state = {
      config: { startYearMonth: '2026/4', maxHorizonMonths: 36 },
      processes: [{ id: 'P1', name: 'A', totalEffort: 80 }],
      members: [{ id: 'M1', name: 'X' }],
      assignments: [
        { id: 'a1', memberId: 'M1', processId: 'P1', hoursPerMonth: { '2026/4': 50, '2026/5': 50 } },
      ],
    };
    var results = forecast(state);
    // 50h in month 1 → remaining 30; 50h in month 2 → completes in month 2
    assert.equal(results[0].completionYearMonth, '2026/5');
    // monthlyProgress should track remaining correctly
    assert.equal(results[0].monthlyProgress[0].remainingAfter, 30);
    assert.equal(results[0].monthlyProgress[1].remainingAfter, 0);
  });

  test('multiple processes get independent completion dates', function () {
    var results = forecast(sampleState);
    assert.equal(results.length, 2);

    var p001 = results.find(function (r) { return r.processId === 'P001'; });
    var p002 = results.find(function (r) { return r.processId === 'P002'; });

    // P001: 200h total. 2026/4: 60h(rem 140), 2026/5: 90h(rem 50), 2026/6: 60h(rem 0) → completes 2026/6
    assert.equal(p001.completionYearMonth, '2026/6');

    // P002: 100h total. 2026/5: 50h(rem 50), 2026/6: 50h(rem 0) → completes 2026/6
    assert.equal(p002.completionYearMonth, '2026/6');
  });

  test('zero effort process completes immediately', function () {
    var state = {
      config: { startYearMonth: '2026/4', maxHorizonMonths: 36 },
      processes: [{ id: 'P1', name: 'Zero', totalEffort: 0 }],
      members: [],
      assignments: [],
    };
    var results = forecast(state);
    assert.equal(results[0].completionYearMonth, '2026/4');
  });

  test('process with no assignments never completes (null)', function () {
    var state = {
      config: { startYearMonth: '2026/4', maxHorizonMonths: 6 },
      processes: [{ id: 'P1', name: 'Orphan', totalEffort: 100 }],
      members: [{ id: 'M1', name: 'X' }],
      assignments: [],
    };
    var results = forecast(state);
    assert.equal(results[0].completionYearMonth, null);
  });

  test('multiple members on same process accelerate completion', function () {
    var state = {
      config: { startYearMonth: '2026/4', maxHorizonMonths: 36 },
      processes: [{ id: 'P1', name: 'A', totalEffort: 100 }],
      members: [{ id: 'M1', name: 'X' }, { id: 'M2', name: 'Y' }],
      assignments: [
        { id: 'a1', memberId: 'M1', processId: 'P1', hoursPerMonth: { '2026/4': 30, '2026/5': 30 } },
        { id: 'a2', memberId: 'M2', processId: 'P1', hoursPerMonth: { '2026/4': 30, '2026/5': 30 } },
      ],
    };
    var results = forecast(state);
    // 60h in month 1 → remaining 40; 60h in month 2 → completes in month 2
    assert.equal(results[0].completionYearMonth, '2026/5');
  });

  test('variable monthly hours tracked correctly', function () {
    var state = {
      config: { startYearMonth: '2026/4', maxHorizonMonths: 36 },
      processes: [{ id: 'P1', name: 'A', totalEffort: 100 }],
      members: [{ id: 'M1', name: 'X' }],
      assignments: [
        { id: 'a1', memberId: 'M1', processId: 'P1', hoursPerMonth: { '2026/4': 10, '2026/5': 50, '2026/6': 80 } },
      ],
    };
    var results = forecast(state);
    var progress = results[0].monthlyProgress;
    // month 1: 10h applied, remaining 90
    assert.equal(progress[0].hoursApplied, 10);
    assert.equal(progress[0].remainingAfter, 90);
    // month 2: 50h applied, remaining 40
    assert.equal(progress[1].hoursApplied, 50);
    assert.equal(progress[1].remainingAfter, 40);
    // month 3: 80h available but only 40 needed → applied 40, remaining 0
    assert.equal(progress[2].hoursApplied, 40);
    assert.equal(progress[2].remainingAfter, 0);
    assert.equal(results[0].completionYearMonth, '2026/6');
  });

  test('respects maxHorizonMonths limit', function () {
    var state = {
      config: { startYearMonth: '2026/4', maxHorizonMonths: 3 },
      processes: [{ id: 'P1', name: 'Long', totalEffort: 1000 }],
      members: [{ id: 'M1', name: 'X' }],
      assignments: [
        { id: 'a1', memberId: 'M1', processId: 'P1', hoursPerMonth: { '2026/4': 10, '2026/5': 10, '2026/6': 10 } },
      ],
    };
    var results = forecast(state);
    assert.equal(results[0].completionYearMonth, null);
    assert.equal(results[0].monthlyProgress.length, 3);
  });

  test('partial month assignments (gaps) handled correctly', function () {
    var state = {
      config: { startYearMonth: '2026/4', maxHorizonMonths: 36 },
      processes: [{ id: 'P1', name: 'A', totalEffort: 100 }],
      members: [{ id: 'M1', name: 'X' }],
      assignments: [
        // Gap in 2026/5 - no hours assigned
        { id: 'a1', memberId: 'M1', processId: 'P1', hoursPerMonth: { '2026/4': 40, '2026/6': 40, '2026/7': 40 } },
      ],
    };
    var results = forecast(state);
    var progress = results[0].monthlyProgress;
    // month 1: 40h, rem 60
    assert.equal(progress[0].remainingAfter, 60);
    // month 2 (gap): 0h, rem 60
    assert.equal(progress[1].hoursApplied, 0);
    assert.equal(progress[1].remainingAfter, 60);
    // month 3: 40h, rem 20
    assert.equal(progress[2].remainingAfter, 20);
    // month 4: 40h available, 20 needed → completes
    assert.equal(results[0].completionYearMonth, '2026/7');
  });

  test('monthlyProgress includes yearMonth for each entry', function () {
    var state = {
      config: { startYearMonth: '2026/11', maxHorizonMonths: 36 },
      processes: [{ id: 'P1', name: 'A', totalEffort: 50 }],
      members: [{ id: 'M1', name: 'X' }],
      assignments: [
        { id: 'a1', memberId: 'M1', processId: 'P1', hoursPerMonth: { '2026/11': 20, '2026/12': 20, '2027/1': 20 } },
      ],
    };
    var results = forecast(state);
    assert.equal(results[0].monthlyProgress[0].yearMonth, '2026/11');
    assert.equal(results[0].monthlyProgress[1].yearMonth, '2026/12');
    assert.equal(results[0].monthlyProgress[2].yearMonth, '2027/1');
    assert.equal(results[0].completionYearMonth, '2027/1');
  });

  test('does not continue tracking progress after process completes', function () {
    var state = {
      config: { startYearMonth: '2026/4', maxHorizonMonths: 36 },
      processes: [{ id: 'P1', name: 'A', totalEffort: 50 }],
      members: [{ id: 'M1', name: 'X' }],
      assignments: [
        { id: 'a1', memberId: 'M1', processId: 'P1', hoursPerMonth: { '2026/4': 50, '2026/5': 50 } },
      ],
    };
    var results = forecast(state);
    // Completes in first month, should not have entries for subsequent months
    assert.equal(results[0].completionYearMonth, '2026/4');
    assert.equal(results[0].monthlyProgress.length, 1);
  });
});
