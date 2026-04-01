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

  // TODO: implement
  return {
    nextYearMonth: function () {},
    getMonthRange: function () {},
    getProcessMonthlyHours: function () {},
    getMemberMonthlyHours: function () {},
    forecast: function () {},
  };
}));
