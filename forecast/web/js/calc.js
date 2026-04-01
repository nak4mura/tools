/* globals FC */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.FC = root.FC || {};
    root.FC.calc = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Increment a "YYYY/M" string by one month.
   */
  function nextYearMonth(ym) {
    var parts = ym.split('/');
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    if (month === 12) {
      return (year + 1) + '/1';
    }
    return year + '/' + (month + 1);
  }

  /**
   * Return an array of "YYYY/M" strings starting from startYM for count months.
   */
  function getMonthRange(startYM, count) {
    var result = [];
    var current = startYM;
    for (var i = 0; i < count; i++) {
      result.push(current);
      current = nextYearMonth(current);
    }
    return result;
  }

  /**
   * Sum all member assignment hours for a given process in a given month.
   */
  function getProcessMonthlyHours(state, processId, yearMonth) {
    return state.assignments.reduce(function (sum, a) {
      if (a.processId === processId && a.hoursPerMonth[yearMonth]) {
        return sum + a.hoursPerMonth[yearMonth];
      }
      return sum;
    }, 0);
  }

  /**
   * Sum all process assignment hours for a given member in a given month.
   */
  function getMemberMonthlyHours(state, memberId, yearMonth) {
    return state.assignments.reduce(function (sum, a) {
      if (a.memberId === memberId && a.hoursPerMonth[yearMonth]) {
        return sum + a.hoursPerMonth[yearMonth];
      }
      return sum;
    }, 0);
  }

  /**
   * Run the month-by-month forecast simulation.
   *
   * Returns an array of:
   *   { processId, processName, totalEffort, completionYearMonth, monthlyProgress }
   *
   * monthlyProgress entries: { yearMonth, hoursApplied, remainingAfter }
   */
  function forecast(state) {
    var config = state.config;
    var maxMonths = config.maxHorizonMonths || 36;

    return state.processes.map(function (proc) {
      var remaining = proc.totalEffort;
      var monthlyProgress = [];
      var completionYearMonth = null;
      var current = config.startYearMonth;

      // Zero-effort process completes immediately
      if (remaining <= 0) {
        monthlyProgress.push({ yearMonth: current, hoursApplied: 0, remainingAfter: 0 });
        return {
          processId: proc.id,
          processName: proc.name,
          totalEffort: proc.totalEffort,
          completionYearMonth: current,
          monthlyProgress: monthlyProgress,
        };
      }

      for (var i = 0; i < maxMonths; i++) {
        var available = getProcessMonthlyHours(state, proc.id, current);
        var applied = Math.min(available, remaining);
        remaining = remaining - applied;
        // Clamp to 0 for floating-point safety
        if (remaining < 0) { remaining = 0; }

        monthlyProgress.push({
          yearMonth: current,
          hoursApplied: applied,
          remainingAfter: remaining,
        });

        if (remaining === 0) {
          completionYearMonth = current;
          break;
        }

        current = nextYearMonth(current);
      }

      return {
        processId: proc.id,
        processName: proc.name,
        totalEffort: proc.totalEffort,
        completionYearMonth: completionYearMonth,
        monthlyProgress: monthlyProgress,
      };
    });
  }

  return {
    nextYearMonth: nextYearMonth,
    getMonthRange: getMonthRange,
    getProcessMonthlyHours: getProcessMonthlyHours,
    getMemberMonthlyHours: getMemberMonthlyHours,
    forecast: forecast,
  };
}));
