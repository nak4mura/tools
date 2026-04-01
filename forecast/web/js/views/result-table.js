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
        el('h2', {}, '予測テーブル'),
        el('p', { class: 'empty-msg' }, '工程マスタにデータを登録してください。')
      ));
      return;
    }

    // Determine month range
    var maxProgressLen = 0;
    results.forEach(function (r) {
      if (r.monthlyProgress.length > maxProgressLen) maxProgressLen = r.monthlyProgress.length;
    });
    var displayMonths = Math.max(maxProgressLen, 6);
    var months = calc.getMonthRange(state.config.startYearMonth, displayMonths);

    // Header
    var headerCells = [el('th', {}, '工程'), el('th', {}, '総工数')];
    months.forEach(function (m) {
      var parts = m.split('/');
      headerCells.push(el('th', { class: 'col-month' }, parts[0].slice(2) + '/' + parts[1]));
    });
    headerCells.push(el('th', {}, '完了予定'));

    var thead = el('thead', {}, el.apply(null, ['tr', {}].concat(headerCells)));

    // Body
    var tbody = el('tbody', {});
    results.forEach(function (r) {
      var proc = state.processes.find(function (p) { return p.id === r.processId; });
      var color = proc ? proc.color : '#ccc';

      var progressMap = {};
      r.monthlyProgress.forEach(function (mp) { progressMap[mp.yearMonth] = mp; });

      var cells = [
        el('td', { style: { borderLeft: '4px solid ' + color, fontWeight: '500' } }, r.processName),
        el('td', { class: 'col-month' }, String(r.totalEffort) + 'h'),
      ];

      months.forEach(function (m) {
        var mp = progressMap[m];
        if (!mp) {
          cells.push(el('td', { class: 'col-month' }, ''));
          return;
        }

        var cellClass = 'col-month';
        var content = '';

        if (mp.hoursApplied > 0) {
          content = String(mp.remainingAfter) + 'h';
          if (mp.remainingAfter === 0) {
            cellClass += ' cell-complete';
            content = '完了';
          }
        } else if (mp.remainingAfter < r.totalEffort) {
          // After start but no hours this month
          content = String(mp.remainingAfter) + 'h';
          cellClass += ' cell-idle';
        }

        var td = el('td', { class: cellClass }, content);

        // Progress bar background
        if (r.totalEffort > 0) {
          var pct = Math.round(((r.totalEffort - mp.remainingAfter) / r.totalEffort) * 100);
          td.style.background = 'linear-gradient(90deg, ' + color + '22 ' + pct + '%, transparent ' + pct + '%)';
        }

        cells.push(td);
      });

      // Completion column
      var completionText = r.completionYearMonth || '未定';
      var compClass = r.completionYearMonth ? 'completion-done' : 'completion-pending';
      cells.push(el('td', { class: compClass }, completionText));

      tbody.appendChild(el.apply(null, ['tr', {}].concat(cells)));
    });

    // Footer: monthly total hours applied
    var footerCells = [el('td', { class: 'footer-label' }, '月別投入工数'), el('td', {})];
    months.forEach(function (m) {
      var total = 0;
      results.forEach(function (r) {
        var mp = r.monthlyProgress.find(function (p) { return p.yearMonth === m; });
        if (mp) total += mp.hoursApplied;
      });
      footerCells.push(el('td', { class: 'col-month footer-cell' }, total > 0 ? String(total) + 'h' : ''));
    });
    footerCells.push(el('td', {}));
    tbody.appendChild(el.apply(null, ['tr', { class: 'footer-row' }].concat(footerCells)));

    clearAndAppend(container, el('div', { class: 'view-container' },
      el('div', { class: 'view-header' }, el('h2', {}, '予測テーブル')),
      el('p', { class: 'hint' }, '各月末時点の残工数を表示します。セルの背景は進捗率を示します。'),
      el('div', { class: 'table-wrapper' },
        el('table', { class: 'data-table forecast-table' }, thead, tbody)
      )
    ));
  }

  root.FC.views = root.FC.views || {};
  root.FC.views.resultTable = { render: render };
}(typeof globalThis !== 'undefined' ? globalThis : this));
