import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { getMonthlyWorkingDays, getMonthlyWorkingHours } = require('../js/holiday.js');

const holidays2024 = new Set([
  '2024-01-01', '2024-01-08', '2024-02-11', '2024-02-12', '2024-03-20',
  '2024-04-29', '2024-05-03', '2024-05-04', '2024-05-05', '2024-05-06',
  '2024-07-15', '2024-08-11', '2024-08-12', '2024-09-16', '2024-09-22',
  '2024-09-23', '2024-10-14', '2024-11-03', '2024-11-04', '2024-11-23',
]);

const emptyHolidays = new Set();
const config = { hoursPerDay: 8 };

describe('getMonthlyWorkingDays', () => {
  test('2024年4月の稼働日数は21日（昭和の日=4/29を除く）', () => {
    assert.equal(getMonthlyWorkingDays('2024/4', holidays2024), 21);
  });
  test('2024年5月の稼働日数（祝日あり）', () => {
    assert.equal(getMonthlyWorkingDays('2024/5', holidays2024), 21);
  });
  test('祝日なしの2024年4月は22日（土日のみ除く）', () => {
    assert.equal(getMonthlyWorkingDays('2024/4', emptyHolidays), 22);
  });
  test('祝日セットが存在する場合は0より大きい', () => {
    assert.ok(getMonthlyWorkingDays('2024/4', emptyHolidays) > 0);
  });
  test('不正な月文字列は0を返す', () => {
    assert.equal(getMonthlyWorkingDays('invalid', emptyHolidays), 0);
  });
});

describe('getMonthlyWorkingHours', () => {
  test('稼働日数 × hoursPerDay を返す（祝日なし2024/4 = 22×8 = 176）', () => {
    assert.equal(getMonthlyWorkingHours('2024/4', config, emptyHolidays), 176);
  });
  test('祝日ありの2024/4 = 21日 × 8時間 = 168時間', () => {
    assert.equal(getMonthlyWorkingHours('2024/4', config, holidays2024), 168);
  });
  test('不正な月文字列は0を返す', () => {
    assert.equal(getMonthlyWorkingHours('invalid', config, emptyHolidays), 0);
  });
});
