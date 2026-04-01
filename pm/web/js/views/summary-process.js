/* globals YM */
(function (root) {
  'use strict';
  var el = root.YM.render.el;
  var clearAndAppend = root.YM.render.clearAndAppend;
  var calc = root.YM.calc;
  var holiday = root.YM.holiday;

  function render(container, state) {
    var summary = calc.buildProcessSummary(state);
    var months = calc.getFiscalMonths(state.config.fiscalYear, state.config.fiscalStartMonth);
    var holidaySet = holiday.buildHolidaySet(state.holidays);

    var thead = el('thead', {}, el.apply(null, ['tr', {}]
      .concat([el('th', {}, '工程')])
      .concat(months.map(function (m) { return el('th', { class: 'col-month' }, fmt(m)); }))
      .concat([el('th', { class: 'total-col' }, '合計')])
    ));

    var tbody = el('tbody', {});

    // 標準稼働時間行
    var stdCells = months.map(function (m) {
      return el('td', { class: 'std-cell' }, String(holiday.getMonthlyWorkingHours(m, state.config, holidaySet)));
    });
    tbody.appendChild(el.apply(null, ['tr', { class: 'std-row' }]
      .concat([el('td', { class: 'std-label' }, '標準稼働時間')])
      .concat(stdCells)
      .concat([el('td', {})])
    ));

    summary.forEach(function (row) {
      var proc = state.processes.find(function (p) { return p.id === row.processId; });
      var color = proc ? proc.color : '#ccc';
      var cells = months.map(function (m) {
        var h = row.byMonth[m] || 0;
        return el('td', { class: 'col-month' + (h > 0 ? ' has-value' : '') }, h > 0 ? String(h) : '');
      });
      tbody.appendChild(el.apply(null, ['tr', { style: { borderLeft: '4px solid ' + color } }]
        .concat([el('td', {}, row.processName)])
        .concat(cells)
        .concat([el('td', { class: 'total-col bold' }, row.total > 0 ? String(row.total) : '')])
      ));
    });

    // 月別合計行
    var monthTotals = months.map(function (m) {
      var t = calc.getMonthlyTotal(state, m);
      return el('td', { class: 'footer-cell' }, t > 0 ? String(t) : '');
    });
    var grand = summary.reduce(function (s, r) { return s + r.total; }, 0);
    tbody.appendChild(el.apply(null, ['tr', { class: 'footer-row' }]
      .concat([el('td', { class: 'footer-label' }, '月別合計')])
      .concat(monthTotals)
      .concat([el('td', { class: 'footer-cell bold' }, grand > 0 ? String(grand) : '')])
    ));

    clearAndAppend(container, el('div', { class: 'view-container' },
      el('div', { class: 'view-header' }, el('h2', {}, 'サマリー：工程別')),
      el('div', { class: 'table-wrapper' }, el('table', { class: 'data-table summary-table' }, thead, tbody))
    ));
  }

  function fmt(yearMonth) {
    var parts = yearMonth.split('/');
    return parts[0] + '/' + parts[1].padStart(2, '0');
  }

  root.YM.views = root.YM.views || {};
  root.YM.views.summaryProcess = { render: render };
}(typeof globalThis !== 'undefined' ? globalThis : this));
