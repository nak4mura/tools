/* globals FC */
(function (root) {
  'use strict';
  var el = root.FC.render.el;
  var clearAndAppend = root.FC.render.clearAndAppend;
  var getProcessColor = root.FC.render.getProcessColor;
  var store = root.FC.store;
  var calc = root.FC.calc;

  function getDisplayMonths(state) {
    var results = calc.forecast(state);
    var minMonths = 12;
    var needed = 0;
    results.forEach(function (r) {
      if (r.monthlyProgress.length > needed) needed = r.monthlyProgress.length;
    });
    // Also check assignment data for months beyond forecast
    state.assignments.forEach(function (a) {
      var keys = Object.keys(a.hoursPerMonth);
      keys.forEach(function (ym) {
        var idx = monthDiff(state.config.startYearMonth, ym);
        if (idx + 1 > needed) needed = idx + 1;
      });
    });
    var count = Math.max(minMonths, needed + 3);
    return calc.getMonthRange(state.config.startYearMonth, count);
  }

  function monthDiff(fromYM, toYM) {
    var f = fromYM.split('/');
    var t = toYM.split('/');
    return (parseInt(t[0]) - parseInt(f[0])) * 12 + (parseInt(t[1]) - parseInt(f[1]));
  }

  function render(container, state) {
    var months = getDisplayMonths(state);
    var members = state.members.slice().sort(function (a, b) { return a.order - b.order; });
    var processes = state.processes.slice().sort(function (a, b) { return a.order - b.order; });

    var addBtn = el('button', { class: 'btn btn-primary' }, '+ 行追加');
    addBtn.addEventListener('click', function () {
      if (!members.length) { alert('先にメンバーマスタを登録してください'); return; }
      if (!processes.length) { alert('先に工程マスタを登録してください'); return; }
      store.addAssignment(members[0].id, processes[0].id);
    });

    var sampleBtn = el('button', { class: 'btn btn-secondary' }, 'サンプルデータ挿入');
    sampleBtn.addEventListener('click', function () {
      if (!confirm('サンプルデータを挿入しますか？')) return;
      store.insertSampleData();
    });

    var clearBtn = el('button', { class: 'btn btn-danger' }, '全データ削除');
    clearBtn.addEventListener('click', function () {
      if (!confirm('全アサインデータを削除しますか？')) return;
      store.clearAllAssignments();
    });

    var headerCells = [el('th', { class: 'col-member' }, 'メンバー'), el('th', { class: 'col-process' }, '工程')]
      .concat(months.map(function (m) {
        var parts = m.split('/');
        return el('th', { class: 'col-month' }, parts[0].slice(2) + '/' + parts[1] + '月');
      }))
      .concat([el('th', { class: 'col-total' }, '合計'), el('th', { class: 'col-actions' }, '')]);

    var tbody = el('tbody', {});
    state.assignments.forEach(function (row) {
      tbody.appendChild(buildRow(row, state, months, members, processes));
    });

    if (!state.assignments.length) {
      tbody.appendChild(el('tr', {}, el('td', { colspan: String(months.length + 4), class: 'empty-msg' }, 'データがありません。「+ 行追加」か「サンプルデータ挿入」から始めてください。')));
    }

    clearAndAppend(container, el('div', { class: 'view-container' },
      el('div', { class: 'view-header' }, el('h2', {}, '工数入力'), el('div', { class: 'btn-group' }, addBtn, sampleBtn, clearBtn)),
      el('p', { class: 'hint' }, '各メンバーが各工程に毎月割ける工数（時間）を入力します。'),
      el('div', { class: 'table-wrapper' },
        el('table', { class: 'data-table main-input-table' },
          el('thead', {}, el.apply(null, ['tr', {}].concat(headerCells))),
          tbody
        )
      )
    ));
  }

  function buildRow(row, state, months, members, processes) {
    var memberSelect = el('select', { class: 'cell-select' });
    members.forEach(function (m) {
      var opt = el('option', { value: m.id }, m.name);
      if (m.id === row.memberId) opt.selected = true;
      memberSelect.appendChild(opt);
    });

    var processSelect = el('select', { class: 'cell-select' });
    processes.forEach(function (p) {
      var opt = el('option', { value: p.id }, p.name);
      if (p.id === row.processId) opt.selected = true;
      processSelect.appendChild(opt);
    });

    memberSelect.addEventListener('change', function () {
      store.updateAssignment(row.id, { memberId: memberSelect.value });
    });
    processSelect.addEventListener('change', function () {
      store.updateAssignment(row.id, { processId: processSelect.value });
    });

    var totalCell = el('td', { class: 'col-total total-cell' });
    var updateTotal = function () {
      var t = Object.values(row.hoursPerMonth).reduce(function (s, h) { return s + (h || 0); }, 0);
      totalCell.textContent = t > 0 ? String(t) : '';
    };
    updateTotal();

    var monthCells = months.map(function (m) {
      var input = el('input', {
        type: 'number',
        value: row.hoursPerMonth[m] != null ? row.hoursPerMonth[m] : '',
        min: 0, step: 1,
        class: 'hour-input',
      });
      input.addEventListener('change', function () {
        var val = input.value.trim();
        store.updateAssignmentHours(row.id, m, val === '' ? null : Number(val));
      });
      return el('td', { class: 'col-month' }, input);
    });

    var deleteBtn = el('button', { class: 'btn btn-danger btn-sm' }, '削除');
    deleteBtn.addEventListener('click', function () { store.deleteAssignment(row.id); });

    var dupBtn = el('button', { class: 'btn btn-secondary btn-sm' }, '複製');
    dupBtn.addEventListener('click', function () { store.duplicateAssignment(row.id); });

    var color = getProcessColor(row.processId, state);
    var args = [el('td', { class: 'col-member' }, memberSelect), el('td', { class: 'col-process' }, processSelect)]
      .concat(monthCells)
      .concat([totalCell, el('td', { class: 'col-actions' }, dupBtn, deleteBtn)]);

    return el.apply(null, ['tr', { style: { borderLeft: '4px solid ' + color } }].concat(args));
  }

  root.FC.views = root.FC.views || {};
  root.FC.views.inputAssignment = { render: render };
}(typeof globalThis !== 'undefined' ? globalThis : this));
