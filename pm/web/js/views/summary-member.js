/* globals YM */
(function (root) {
  'use strict';
  var el = root.YM.render.el;
  var clearAndAppend = root.YM.render.clearAndAppend;
  var calc = root.YM.calc;

  function render(container, state) {
    var summary = calc.buildMemberSummary(state);
    var processes = state.processes.slice().sort(function (a, b) { return a.order - b.order; });

    var thead = el('thead', {}, el.apply(null, ['tr', {}]
      .concat([el('th', {}, '担当者')])
      .concat(processes.map(function (p) { return el('th', { style: { borderTop: '3px solid ' + p.color } }, p.name); }))
      .concat([el('th', { class: 'total-col' }, '合計')])
    ));

    var tbody = el('tbody', {});
    summary.forEach(function (row) {
      var cells = processes.map(function (p) {
        var h = row.byProcess[p.id] || 0;
        return el('td', { class: h > 0 ? 'has-value' : '' }, h > 0 ? String(h) : '');
      });
      tbody.appendChild(el.apply(null, ['tr', {}]
        .concat([el('td', { class: 'member-name' }, row.memberName)])
        .concat(cells)
        .concat([el('td', { class: 'total-col bold' }, row.total > 0 ? String(row.total) : '')])
      ));
    });

    // 合計行
    var totalCells = processes.map(function (p) {
      var t = summary.reduce(function (s, r) { return s + (r.byProcess[p.id] || 0); }, 0);
      return el('td', { class: 'footer-cell' }, t > 0 ? String(t) : '');
    });
    var grand = summary.reduce(function (s, r) { return s + r.total; }, 0);
    tbody.appendChild(el.apply(null, ['tr', { class: 'footer-row' }]
      .concat([el('td', { class: 'footer-label' }, '合計')])
      .concat(totalCells)
      .concat([el('td', { class: 'footer-cell bold' }, grand > 0 ? String(grand) : '')])
    ));

    clearAndAppend(container, el('div', { class: 'view-container' },
      el('div', { class: 'view-header' }, el('h2', {}, 'サマリー：担当者別')),
      el('div', { class: 'table-wrapper' }, el('table', { class: 'data-table summary-table' }, thead, tbody))
    ));
  }

  root.YM.views = root.YM.views || {};
  root.YM.views.summaryMember = { render: render };
}(typeof globalThis !== 'undefined' ? globalThis : this));
