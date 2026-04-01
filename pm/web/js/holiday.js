/**
 * 稼働日数・稼働時間計算モジュール
 * DOM依存なし - Node.jsテスト可能
 */

/**
 * YYYY/M 形式の文字列をパースして { year, month } を返す。
 * 不正な場合は null を返す。
 */
function parseYearMonth(yearMonth) {
  if (typeof yearMonth !== 'string') return null;
  const parts = yearMonth.split('/');
  if (parts.length !== 2) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return null;
  return { year, month };
}

/**
 * 指定月の稼働日数を計算する。
 * @param {string} yearMonth - "YYYY/M" 形式
 * @param {Set<string>} holidaySet - ISO日付文字列のSet ("YYYY-MM-DD")
 * @returns {number} 稼働日数
 */
export function getMonthlyWorkingDays(yearMonth, holidaySet) {
  const parsed = parseYearMonth(yearMonth);
  if (!parsed) return 0;

  const { year, month } = parsed;
  // その月の日数
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay(); // 0=日, 6=土

    // 土日スキップ
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // 祝日スキップ
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (holidaySet && holidaySet.has(iso)) continue;

    workingDays++;
  }

  return workingDays;
}

/**
 * 指定月の標準稼働時間を計算する。
 * @param {string} yearMonth - "YYYY/M" 形式
 * @param {{ hoursPerDay: number }} config
 * @param {Set<string>} holidaySet
 * @returns {number} 標準稼働時間
 */
export function getMonthlyWorkingHours(yearMonth, config, holidaySet) {
  const days = getMonthlyWorkingDays(yearMonth, holidaySet);
  return days * (config.hoursPerDay ?? 8);
}

/**
 * holidays 配列（{ date: "YYYY-MM-DD" }[]）から Set<string> を作成する。
 * @param {{ date: string }[]} holidays
 * @returns {Set<string>}
 */
export function buildHolidaySet(holidays) {
  return new Set(holidays.map((h) => h.date));
}
