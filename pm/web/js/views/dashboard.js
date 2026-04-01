/* globals YM */
(function (root) {
  'use strict';
  var el = root.YM.render.el;
  var clearAndAppend = root.YM.render.clearAndAppend;
  var arcPath = root.YM.render.arcPath;
  var calc = root.YM.calc;
  var holiday = root.YM.holiday;

  function render(container, state) {
    var months = calc.getFiscalMonths(state.config.fiscalYear, state.config.fiscalStartMonth);
    var holidaySet = holiday.buildHolidaySet(state.holidays);
    var processSummary = calc.buildProcessSummary(state);
    var grandTotal = processSummary.reduce(function (s, r) { return s + r.total; }, 0);

    // プロジェクト概要
    var overviewCard = el('div', { class: 'card' },
      el('h3', { class: 'card-title' }, 'プロジェクト概要'),
      el('div', { class: 'overview-grid' },
        ov('担当者数', state.members.length + '名'),
        ov('総工数', grandTotal + 'h'),
        ov('工程数', state.processes.length + '件'),
        ov('対象年度', state.config.fiscalYear + '年度'),
        ov('年度開始月', state.config.fiscalStartMonth + '月'),
        ov('標準稼働時間/日', state.config.hoursPerDay + 'h')
      )
    );

    // 過積載警告
    var warnings = [];
    state.members.forEach(function (member) {
      months.forEach(function (m) {
        var actual = calc.getMemberMonthlyHours(state, member.id, m);
        if (!actual) return;
        var std = holiday.getMonthlyWorkingHours(m, state.config, holidaySet);
        var rate = calc.calculateOverloadRate(actual, std);
        if (std > 0 && calc.isOverloaded(rate, state.config.overloadThreshold)) {
          warnings.push({ member: member, month: m, actual: actual, std: std, rate: rate });
        }
      });
    });

    var warningItems = warnings.map(function (w) {
      return el('div', { class: 'warning-chip' },
        '⚠ ' + w.member.name + ' ' + fmtMonth(w.month) + ': ' + w.actual + 'h / ' + w.std + 'h (' + Math.round(w.rate * 100) + '%)'
      );
    });

    var warningCard = el('div', { class: 'card' },
      el('h3', { class: 'card-title' }, '過積載警告 (' + warnings.length + '件)'),
      warnings.length ? el.apply(null, ['div', { class: 'warning-list' }].concat(warningItems)) : el('p', { class: 'hint' }, '過積載なし')
    );

    // 工程別円グラフ
    var pieCard = el('div', { class: 'card' },
      el('h3', { class: 'card-title' }, '工程別工数比率'),
      grandTotal > 0 ? buildPieChart(processSummary, state.processes, grandTotal) : el('p', { class: 'hint' }, 'データがありません')
    );

    // 担当者別バーチャート
    var memberTotals = state.members.map(function (m) {
      return {
        name: m.name,
        total: state.workload.filter(function (r) { return r.memberId === m.id; })
          .reduce(function (s, r) { return s + Object.values(r.hours).reduce(function (a, h) { return a + (h || 0); }, 0); }, 0),
      };
    }).filter(function (m) { return m.total > 0; });

    var barCard = el('div', { class: 'card' },
      el('h3', { class: 'card-title' }, '担当者別総工数'),
      memberTotals.length ? buildBarChart(memberTotals) : el('p', { class: 'hint' }, 'データがありません')
    );

    clearAndAppend(container, el('div', { class: 'view-container' },
      el('div', { class: 'view-header' }, el('h2', {}, 'ダッシュボード')),
      el('div', { class: 'dashboard-grid' }, overviewCard, warningCard, pieCard, barCard)
    ));
  }

  function ov(label, value) {
    return el('div', { class: 'overview-item' },
      el('span', { class: 'overview-label' }, label),
      el('span', { class: 'overview-value' }, value)
    );
  }

  function buildPieChart(summary, processes, total) {
    var cx = 100, cy = 100, r = 80;
    var current = -Math.PI / 2;
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 200 200');
    svg.setAttribute('width', '180');
    svg.setAttribute('height', '180');
    svg.setAttribute('class', 'pie-chart');

    var legendItems = [];
    summary.forEach(function (row) {
      if (!row.total) return;
      var proc = processes.find(function (p) { return p.id === row.processId; });
      var color = proc ? proc.color : '#ccc';
      var ratio = row.total / total;
      var end = current + ratio * 2 * Math.PI;
      var path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', arcPath(cx, cy, r, current, end));
      path.setAttribute('fill', color);
      path.setAttribute('stroke', '#fff');
      path.setAttribute('stroke-width', '2');
      svg.appendChild(path);
      current = end;
      legendItems.push(el('div', { class: 'legend-item' },
        el('span', { class: 'legend-dot', style: { background: color } }),
        row.processName + ': ' + row.total + 'h (' + Math.round(ratio * 100) + '%)'
      ));
    });

    return el.apply(null, ['div', { class: 'chart-container' }, svg].concat([el.apply(null, ['div', { class: 'legend' }].concat(legendItems))]));
  }

  function buildBarChart(memberTotals) {
    var max = Math.max.apply(null, memberTotals.map(function (m) { return m.total; }));
    var bars = memberTotals.map(function (m) {
      var pct = max > 0 ? (m.total / max) * 100 : 0;
      return el('div', { class: 'bar-row' },
        el('span', { class: 'bar-name' }, m.name),
        el('div', { class: 'bar-track' },
          el('div', { class: 'bar-fill', style: { width: pct + '%' } }),
          el('span', { class: 'bar-value' }, m.total + 'h')
        )
      );
    });
    return el.apply(null, ['div', { class: 'bar-chart' }].concat(bars));
  }

  function fmtMonth(yearMonth) {
    var parts = yearMonth.split('/');
    return parts[0] + '年' + parts[1] + '月';
  }

  root.YM.views = root.YM.views || {};
  root.YM.views.dashboard = { render: render };
}(typeof globalThis !== 'undefined' ? globalThis : this));
