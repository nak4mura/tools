/* globals YM */
(function (root) {
  'use strict';
  var el = root.YM.render.el;
  var clearAndAppend = root.YM.render.clearAndAppend;
  var calc = root.YM.calc;

  function render(container, state) {
    var months = calc.getFiscalMonths(state.config.fiscalYear, state.config.fiscalStartMonth);
    var processSummary = calc.buildProcessSummary(state);
    var processes = state.processes.slice().sort(function (a, b) { return a.order - b.order; });

    // 全工程の最大月別工数（バー高さの基準）
    var maxHours = 0;
    processSummary.forEach(function (ps) {
      months.forEach(function (m) {
        var h = ps.byMonth[m] || 0;
        if (h > maxHours) maxHours = h;
      });
    });
    if (maxHours === 0) maxHours = 1;

    // ヘッダー（月ラベル）
    var headerCells = months.map(function (m) {
      return el('div', { class: 'gantt-header-cell' }, m.split('/')[1] + '月');
    });

    var header = el('div', { class: 'gantt-row gantt-header-row' },
      el('div', { class: 'gantt-label-col' }, '工程'),
      el.apply(null, ['div', { class: 'gantt-timeline' }].concat(headerCells))
    );

    // 工程行
    var rows = processes.map(function (proc) {
      var ps = processSummary.find(function (s) { return s.processId === proc.id; });
      var color = proc.color;

      // この工程でデータがある月の範囲を求める
      var firstIdx = -1;
      var lastIdx = -1;
      months.forEach(function (m, i) {
        if (ps && (ps.byMonth[m] || 0) > 0) {
          if (firstIdx === -1) firstIdx = i;
          lastIdx = i;
        }
      });

      // タイムラインセル
      var timelineCells = months.map(function (m, i) {
        var hours = (ps && ps.byMonth[m]) ? ps.byMonth[m] : 0;
        var inRange = firstIdx !== -1 && i >= firstIdx && i <= lastIdx;
        var barHeight = hours > 0 ? Math.max(Math.round((hours / maxHours) * 36), 6) : 0;

        var cellContent;
        if (hours > 0) {
          // データがある月: 塗りつぶしバー + ラベル
          cellContent = el('div', { class: 'gantt-bar-cell gantt-bar-active' },
            el('div', { class: 'gantt-bar-fill', style: { height: barHeight + 'px', background: color } }),
            el('span', { class: 'gantt-hours-label' }, hours + 'h')
          );
        } else if (inRange) {
          // データがないが範囲内: 橋渡し表示
          cellContent = el('div', { class: 'gantt-bar-cell gantt-bar-bridge' },
            el('div', { class: 'gantt-bridge-line', style: { borderColor: color } })
          );
        } else {
          // 範囲外: 空セル
          cellContent = el('div', { class: 'gantt-bar-cell gantt-bar-empty' });
        }

        return cellContent;
      });

      var total = ps ? ps.total : 0;
      var labelText = proc.name + (total > 0 ? ' (' + total + 'h)' : '');

      return el('div', { class: 'gantt-row gantt-data-row' },
        el('div', { class: 'gantt-label-col', style: { borderLeft: '4px solid ' + color } },
          el('span', { class: 'gantt-process-name' }, labelText)
        ),
        el.apply(null, ['div', { class: 'gantt-timeline' }].concat(timelineCells))
      );
    });

    // 空データメッセージ
    var hasData = processSummary.some(function (ps) { return ps.total > 0; });

    var wrapper = el('div', { class: 'view-container' },
      el('div', { class: 'view-header' }, el('h2', {}, 'ガントチャート')),
      hasData
        ? el('p', { class: 'hint' }, 'バーの高さは最大工数を基準に表示。破線は工程の継続期間を示します。')
        : el('p', { class: 'hint' }, 'データがありません。メイン入力タブからデータを追加してください。'),
      el.apply(null, ['div', { class: 'gantt-chart' }, header].concat(rows))
    );

    clearAndAppend(container, wrapper);
  }

  root.YM.views = root.YM.views || {};
  root.YM.views.gantt = { render: render };
}(typeof globalThis !== 'undefined' ? globalThis : this));
