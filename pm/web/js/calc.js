/* globals YM */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.YM = root.YM || {};
    root.YM.calc = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function getMemberMonthlyHours(state, memberId, yearMonth) {
    return state.workload
      .filter(function (row) { return row.memberId === memberId; })
      .reduce(function (sum, row) { return sum + (row.hours[yearMonth] || 0); }, 0);
  }

  function getMemberTotal(state, memberId) {
    return state.workload
      .filter(function (row) { return row.memberId === memberId; })
      .reduce(function (sum, row) {
        return sum + Object.values(row.hours).reduce(function (s, h) { return s + (h || 0); }, 0);
      }, 0);
  }

  function getProcessTotal(state, processId) {
    return state.workload
      .filter(function (row) { return row.processId === processId; })
      .reduce(function (sum, row) {
        return sum + Object.values(row.hours).reduce(function (s, h) { return s + (h || 0); }, 0);
      }, 0);
  }

  function getMonthlyTotal(state, yearMonth) {
    return state.workload.reduce(function (sum, row) {
      return sum + (row.hours[yearMonth] || 0);
    }, 0);
  }

  function calculateOverloadRate(actualHours, standardHours) {
    if (standardHours === 0) return 0;
    return actualHours / standardHours;
  }

  function isOverloaded(rate, threshold) {
    return rate > threshold;
  }

  function buildMemberSummary(state) {
    return state.members.map(function (member) {
      var byProcess = {};
      var total = 0;
      state.processes.forEach(function (process) {
        var hours = state.workload
          .filter(function (row) { return row.memberId === member.id && row.processId === process.id; })
          .reduce(function (sum, row) {
            return sum + Object.values(row.hours).reduce(function (s, h) { return s + (h || 0); }, 0);
          }, 0);
        byProcess[process.id] = hours;
        total += hours;
      });
      return { memberId: member.id, memberName: member.name, byProcess: byProcess, total: total };
    });
  }

  function buildProcessSummary(state) {
    var allMonths = new Set();
    state.workload.forEach(function (row) {
      Object.keys(row.hours).forEach(function (m) { allMonths.add(m); });
    });
    return state.processes.map(function (process) {
      var byMonth = {};
      var total = 0;
      allMonths.forEach(function (yearMonth) {
        var hours = state.workload
          .filter(function (row) { return row.processId === process.id; })
          .reduce(function (sum, row) { return sum + (row.hours[yearMonth] || 0); }, 0);
        byMonth[yearMonth] = hours;
        total += hours;
      });
      return { processId: process.id, processName: process.name, byMonth: byMonth, total: total };
    });
  }

  function isDuplicateRow(state, memberId, processId, excludeRowId) {
    return state.workload.some(function (row) {
      return row.id !== excludeRowId && row.memberId === memberId && row.processId === processId;
    });
  }

  function getFiscalMonths(fiscalYear, fiscalStartMonth) {
    var months = [];
    for (var i = 0; i < 12; i++) {
      var month = ((fiscalStartMonth - 1 + i) % 12) + 1;
      var year = fiscalYear + Math.floor((fiscalStartMonth - 1 + i) / 12);
      months.push(year + '/' + month);
    }
    return months;
  }

  return {
    getMemberMonthlyHours: getMemberMonthlyHours,
    getMemberTotal: getMemberTotal,
    getProcessTotal: getProcessTotal,
    getMonthlyTotal: getMonthlyTotal,
    calculateOverloadRate: calculateOverloadRate,
    isOverloaded: isOverloaded,
    buildMemberSummary: buildMemberSummary,
    buildProcessSummary: buildProcessSummary,
    isDuplicateRow: isDuplicateRow,
    getFiscalMonths: getFiscalMonths,
  };
}));
