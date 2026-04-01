/**
 * 計算モジュール - 純粋関数
 * DOM依存なし - Node.jsテスト可能
 */

/**
 * 指定メンバー・月の合計工数を返す。
 * @param {object} state
 * @param {string} memberId
 * @param {string} yearMonth - "YYYY/M"
 * @returns {number}
 */
export function getMemberMonthlyHours(state, memberId, yearMonth) {
  return state.workload
    .filter((row) => row.memberId === memberId)
    .reduce((sum, row) => sum + (row.hours[yearMonth] ?? 0), 0);
}

/**
 * 指定メンバーの全月・全工程合計工数を返す。
 * @param {object} state
 * @param {string} memberId
 * @returns {number}
 */
export function getMemberTotal(state, memberId) {
  return state.workload
    .filter((row) => row.memberId === memberId)
    .reduce((sum, row) => {
      const rowTotal = Object.values(row.hours).reduce((s, h) => s + (h ?? 0), 0);
      return sum + rowTotal;
    }, 0);
}

/**
 * 指定工程の全メンバー・全月合計工数を返す。
 * @param {object} state
 * @param {string} processId
 * @returns {number}
 */
export function getProcessTotal(state, processId) {
  return state.workload
    .filter((row) => row.processId === processId)
    .reduce((sum, row) => {
      const rowTotal = Object.values(row.hours).reduce((s, h) => s + (h ?? 0), 0);
      return sum + rowTotal;
    }, 0);
}

/**
 * 指定月の全メンバー・全工程合計工数を返す。
 * @param {object} state
 * @param {string} yearMonth - "YYYY/M"
 * @returns {number}
 */
export function getMonthlyTotal(state, yearMonth) {
  return state.workload.reduce((sum, row) => sum + (row.hours[yearMonth] ?? 0), 0);
}

/**
 * 過積載率を計算する（実績 / 標準）。
 * @param {number} actualHours
 * @param {number} standardHours
 * @returns {number} 0以上の数値（standardHoursが0の場合は0）
 */
export function calculateOverloadRate(actualHours, standardHours) {
  if (standardHours === 0) return 0;
  return actualHours / standardHours;
}

/**
 * 過積載かどうかを判定する（rate > threshold のみtrue）。
 * @param {number} rate
 * @param {number} threshold
 * @returns {boolean}
 */
export function isOverloaded(rate, threshold) {
  return rate > threshold;
}

/**
 * 担当者別サマリーを生成する。
 * @param {object} state
 * @returns {{ memberId: string, memberName: string, byProcess: Record<string,number>, total: number }[]}
 */
export function buildMemberSummary(state) {
  return state.members.map((member) => {
    const byProcess = {};
    let total = 0;

    state.processes.forEach((process) => {
      const hours = state.workload
        .filter((row) => row.memberId === member.id && row.processId === process.id)
        .reduce((sum, row) => {
          return sum + Object.values(row.hours).reduce((s, h) => s + (h ?? 0), 0);
        }, 0);
      byProcess[process.id] = hours;
      total += hours;
    });

    return { memberId: member.id, memberName: member.name, byProcess, total };
  });
}

/**
 * 工程別サマリーを生成する。
 * @param {object} state
 * @returns {{ processId: string, processName: string, byMonth: Record<string,number>, total: number }[]}
 */
export function buildProcessSummary(state) {
  // 全ての月キーを収集
  const allMonths = new Set();
  state.workload.forEach((row) => {
    Object.keys(row.hours).forEach((m) => allMonths.add(m));
  });

  return state.processes.map((process) => {
    const byMonth = {};
    let total = 0;

    allMonths.forEach((yearMonth) => {
      const hours = state.workload
        .filter((row) => row.processId === process.id)
        .reduce((sum, row) => sum + (row.hours[yearMonth] ?? 0), 0);
      byMonth[yearMonth] = hours;
      total += hours;
    });

    return { processId: process.id, processName: process.name, byMonth, total };
  });
}

/**
 * 担当者+工程の組み合わせが重複しているかチェックする。
 * @param {object} state
 * @param {string} memberId
 * @param {string} processId
 * @param {string|null} excludeRowId - 編集中の行ID（自行除外）
 * @returns {boolean}
 */
export function isDuplicateRow(state, memberId, processId, excludeRowId) {
  return state.workload.some(
    (row) =>
      row.id !== excludeRowId &&
      row.memberId === memberId &&
      row.processId === processId,
  );
}

/**
 * 年度の月キー一覧を生成する。
 * @param {number} fiscalYear
 * @param {number} fiscalStartMonth
 * @returns {string[]} "YYYY/M" 形式の12要素配列
 */
export function getFiscalMonths(fiscalYear, fiscalStartMonth) {
  const months = [];
  for (let i = 0; i < 12; i++) {
    const month = ((fiscalStartMonth - 1 + i) % 12) + 1;
    const year = fiscalYear + Math.floor((fiscalStartMonth - 1 + i) / 12);
    months.push(`${year}/${month}`);
  }
  return months;
}
