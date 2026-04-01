/* globals YM */
(function (root) {
  'use strict';
  var el = root.YM.render.el;
  var clearAndAppend = root.YM.render.clearAndAppend;
  var calc = root.YM.calc;
  var holiday = root.YM.holiday;

  function render(container, state) {
    var months = calc.getFiscalMonths(state.config.fiscalYear, state.config.fiscalStartMonth);
    var holidaySet = holiday.buildHolidaySet(state.holidays);

    var allHours = state.workload.reduce(function (arr, row) {
      return arr.concat(Object.values(row.hours).filter(Boolean));
    }, []);
    var maxHours = allHours.length > 0 ? Math.max.apply(null, allHours) : 1;

    var thead = el('thead', {}, el.apply(null, ['tr', {}]
      .concat([el('th', { class: 'col-member' }, '担当者'), el('th', { class: 'col-process' }, '工程')])
      .concat(months.map(function (m) { return el('th', { class: 'col-month' }, m.split('/')[1] + '月'); }))
    ));

    var tbody = el('tbody', {});
    state.workload.forEach(function (row) {
      var member = state.members.find(function (m) { return m.id === row.memberId; });
      var process = state.processes.find(function (p) { return p.id === row.processId; });
      var color = process ? process.color : '#ccc';

      var monthCells = months.map(function (m) {
        var hours = row.hours[m] || 0;
        var std = holiday.getMonthlyWorkingHours(m, state.config, holidaySet);
        var rate = calc.calculateOverloadRate(hours, std);
        var overloaded = std > 0 && calc.isOverloaded(rate, state.config.overloadThreshold);
        var pct = maxHours > 0 ? Math.min((hours / maxHours) * 100, 100) : 0;

        var bar = el('div', { class: 'gantt-bar', style: { width: pct + '%', background: overloaded ? '#e74c3c' : color } });
        var td = el('td', { class: 'col-month gantt-cell' + (overloaded ? ' overloaded' : '') }, bar);
        if (hours > 0) {
          td.appendChild(el('span', { class: 'gantt-label' }, String(hours)));
        }
        return td;
      });

      tbody.appendChild(el.apply(null, ['tr', { style: { borderLeft: '4px solid ' + color } }]
        .concat([
          el('td', { class: 'col-member' }, member ? member.name : row.memberId),
          el('td', { class: 'col-process' }, process ? process.name : row.processId),
        ])
        .concat(monthCells)
      ));
    });

    if (!state.workload.length) {
      tbody.appendChild(el('tr', {}, el('td', { colspan: String(months.length + 2), class: 'empty-msg' }, 'データがありません')));
    }

    clearAndAppend(container, el('div', { class: 'view-container' },
      el('div', { class: 'view-header' }, el('h2', {}, 'ガントチャート')),
      el('p', { class: 'hint' }, 'バー幅は最大工数を基準に表示。赤は過積載を示します。'),
      el('div', { class: 'table-wrapper' }, el('table', { class: 'data-table gantt-table' }, thead, tbody))
    ));
  }

  root.YM.views = root.YM.views || {};
  root.YM.views.gantt = { render: render };
}(typeof globalThis !== 'undefined' ? globalThis : this));
