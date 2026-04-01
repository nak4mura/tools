/* globals FC */
(function (root) {
  'use strict';
  var el = root.FC.render.el;
  var clearAndAppend = root.FC.render.clearAndAppend;
  var calc = root.FC.calc;

  function render(container, state) {
    var results = calc.forecast(state);

    if (!state.processes.length) {
      clearAndAppend(container, el('div', { class: 'view-container' },
        el('h2', {}, '予測タイムライン'),
        el('p', { class: 'empty-msg' }, '工程マスタにデータを登録してください。')
      ));
      return;
    }

    // Determine month range to display
    var maxProgressLen = 0;
    results.forEach(function (r) {
      if (r.monthlyProgress.length > maxProgressLen) maxProgressLen = r.monthlyProgress.length;
    });
    var displayMonths = Math.max(maxProgressLen, 6);
    var months = calc.getMonthRange(state.config.startYearMonth, displayMonths);

    // Find max effort for scaling
    var maxEffort = 0;
    results.forEach(function (r) { if (r.totalEffort > maxEffort) maxEffort = r.totalEffort; });

    // Build header row
    var headerCells = [el('div', { class: 'gantt-label-col' }, '')];
    months.forEach(function (m) {
      var parts = m.split('/');
      headerCells.push(el('div', { class: 'gantt-header-cell' }, parts[0].slice(2) + '/' + parts[1]));
    });
    headerCells.push(el('div', { class: 'gantt-completion-col' }, '完了予定'));
    var headerRow = el.apply(null, ['div', { class: 'gantt-row gantt-header-row' }].concat(headerCells));

    // Build process rows
    var dataRows = results.map(function (r) {
      var proc = state.processes.find(function (p) { return p.id === r.processId; });
      var color = proc ? proc.color : '#ccc';

      var label = el('div', { class: 'gantt-label-col' },
        el('span', { class: 'gantt-process-name', style: { borderLeft: '4px solid ' + color, paddingLeft: '8px' } }, r.processName || r.processId)
      );

      var progressMap = {};
      r.monthlyProgress.forEach(function (mp) { progressMap[mp.yearMonth] = mp; });

      var cells = [label];
      months.forEach(function (m) {
        var mp = progressMap[m];
        if (!mp || mp.hoursApplied === 0) {
          cells.push(el('div', { class: 'gantt-bar-cell' }));
          return;
        }

        var pct = maxEffort > 0 ? Math.max(8, Math.round((mp.hoursApplied / maxEffort) * 80)) : 8;
        var barFill = el('div', { class: 'gantt-bar-fill', style: { height: pct + 'px', background: color } });
        var hoursLabel = el('span', { class: 'gantt-hours-label' }, String(mp.hoursApplied) + 'h');

        var cellClass = 'gantt-bar-cell';
        if (mp.remainingAfter === 0) cellClass += ' gantt-bar-complete';

        cells.push(el('div', { class: cellClass },
          el('div', { class: 'gantt-bar-active' }, barFill, hoursLabel)
        ));
      });

      // Completion column
      var completionText = r.completionYearMonth || '未定';
      var completionClass = r.completionYearMonth ? 'completion-done' : 'completion-pending';
      cells.push(el('div', { class: 'gantt-completion-col ' + completionClass }, completionText));

      return el.apply(null, ['div', { class: 'gantt-row gantt-data-row' }].concat(cells));
    });

    var timelineCols = 'minmax(140px, auto) repeat(' + months.length + ', minmax(56px, 1fr)) minmax(80px, auto)';
    var chart = el('div', { class: 'gantt-chart', style: { display: 'grid', gridTemplateColumns: timelineCols } });
    // Flatten header and data rows into grid cells
    headerCells.forEach(function (c) { chart.appendChild(c); });
    dataRows.forEach(function (row) {
      // Extract children from the row div
      while (row.firstChild) chart.appendChild(row.firstChild);
    });

    // Summary cards
    var summaryItems = results.map(function (r) {
      var proc = state.processes.find(function (p) { return p.id === r.processId; });
      var color = proc ? proc.color : '#ccc';
      return el('div', { class: 'summary-card', style: { borderLeft: '4px solid ' + color } },
        el('div', { class: 'summary-card-name' }, r.processName),
        el('div', { class: 'summary-card-effort' }, '総工数: ' + r.totalEffort + 'h'),
        el('div', { class: r.completionYearMonth ? 'summary-card-date' : 'summary-card-date pending' },
          '完了予定: ' + (r.completionYearMonth || '未定 (工数不足)'))
      );
    });

    clearAndAppend(container, el('div', { class: 'view-container' },
      el('div', { class: 'view-header' }, el('h2', {}, '予測タイムライン')),
      el('div', { class: 'summary-cards' }, ...summaryItems),
      el('div', { class: 'table-wrapper' }, chart)
    ));
  }

  root.FC.views = root.FC.views || {};
  root.FC.views.resultTimeline = { render: render };
}(typeof globalThis !== 'undefined' ? globalThis : this));
