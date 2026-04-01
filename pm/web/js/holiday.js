/* globals YM */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.YM = root.YM || {};
    root.YM.holiday = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function parseYearMonth(yearMonth) {
    if (typeof yearMonth !== 'string') return null;
    var parts = yearMonth.split('/');
    if (parts.length !== 2) return null;
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return null;
    return { year: year, month: month };
  }

  function getMonthlyWorkingDays(yearMonth, holidaySet) {
    var parsed = parseYearMonth(yearMonth);
    if (!parsed) return 0;
    var year = parsed.year;
    var month = parsed.month;
    var daysInMonth = new Date(year, month, 0).getDate();
    var workingDays = 0;
    for (var day = 1; day <= daysInMonth; day++) {
      var date = new Date(year, month - 1, day);
      var dow = date.getDay();
      if (dow === 0 || dow === 6) continue;
      var iso = year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      if (holidaySet && holidaySet.has(iso)) continue;
      workingDays++;
    }
    return workingDays;
  }

  function getMonthlyWorkingHours(yearMonth, config, holidaySet) {
    var days = getMonthlyWorkingDays(yearMonth, holidaySet);
    var hpd = (config && config.hoursPerDay != null) ? config.hoursPerDay : 8;
    return days * hpd;
  }

  function buildHolidaySet(holidays) {
    return new Set(holidays.map(function (h) { return h.date; }));
  }

  return {
    getMonthlyWorkingDays: getMonthlyWorkingDays,
    getMonthlyWorkingHours: getMonthlyWorkingHours,
    buildHolidaySet: buildHolidaySet,
  };
}));
