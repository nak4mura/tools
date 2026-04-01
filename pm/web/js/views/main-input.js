/* globals YM */
(function (root) {
  'use strict';
  var el = root.YM.render.el;
  var clearAndAppend = root.YM.render.clearAndAppend;
  var getProcessColor = root.YM.render.getProcessColor;
  var store = root.YM.store;
  var calc = root.YM.calc;
  var holiday = root.YM.holiday;

  function render(container, state) {
    var months = calc.getFiscalMonths(state.config.fiscalYear, state.config.fiscalStartMonth);
    var holidaySet = holiday.buildHolidaySet(state.holidays);
    var members = state.members.slice().sort(function (a, b) { return a.order - b.order; });
    var processes = state.processes.slice().sort(function (a, b) { return a.order - b.order; });

    var addBtn = el('button', { class: 'btn btn-primary' }, '+ 行追加');
    addBtn.addEventListener('click', function () {
      if (!members.length) { alert('先に担当者マスタを登録してください'); return; }
      if (!processes.length) { alert('先に工程マスタを登録してください'); return; }
      store.addWorkloadRow(members[0].id, processes[0].id);
    });

    var sampleBtn = el('button', { class: 'btn btn-secondary' }, 'サンプルデータ挿入');
    sampleBtn.addEventListener('click', function () {
      if (!confirm('サンプルデータを挿入しますか？')) return;
      store.insertSampleData();
    });

    var clearBtn = el('button', { class: 'btn btn-danger' }, '全データ削除');
    clearBtn.addEventListener('click', function () {
      if (!confirm('全工数データを削除しますか？')) return;
      store.clearAllWorkload();
    });

    var headerCells = [el('th', { class: 'col-member' }, '担当者'), el('th', { class: 'col-process' }, '工程')]
      .concat(months.map(function (m) { return el('th', { class: 'col-month' }, m.split('/')[1] + '月'); }))
      .concat([el('th', { class: 'col-total' }, '合計'), el('th', { class: 'col-actions' }, '')]);

    var stdCells = [el('td', { colspan: 2, class: 'std-label' }, '標準稼働時間')]
      .concat(months.map(function (m) {
        var std = holiday.getMonthlyWorkingHours(m, state.config, holidaySet);
        return el('td', { class: 'col-month std-cell' }, String(std));
      }))
      .concat([el('td', {}), el('td', {})]);

    var tbody = el('tbody', {});
    state.workload.forEach(function (row) {
      tbody.appendChild(buildRow(row, state, months, holidaySet, members, processes));
    });

    if (!state.workload.length) {
      tbody.appendChild(el('tr', {}, el('td', { colspan: String(months.length + 4), class: 'empty-msg' }, 'データがありません。「+ 行追加」か「サンプルデータ挿入」から始めてください。')));
    }

    clearAndAppend(container, el('div', { class: 'view-container' },
      el('div', { class: 'view-header' }, el('h2', {}, 'メイン入力'), el('div', { class: 'btn-group' }, addBtn, sampleBtn, clearBtn)),
      el('div', { class: 'table-wrapper' },
        el('table', { class: 'data-table main-input-table' },
          el('thead', {}, el('tr', {}, ...headerCells)),
          el('tbody', { class: 'std-row' }, el('tr', { class: 'std-row' }, ...stdCells)),
          tbody
        )
      )
    ));
  }

  function buildRow(row, state, months, holidaySet, members, processes) {
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

    var totalCell = el('td', { class: 'col-total total-cell' });
    var updateTotal = function () {
      var t = Object.values(row.hours).reduce(function (s, h) { return s + (h || 0); }, 0);
      totalCell.textContent = t > 0 ? String(t) : '';
    };
    updateTotal();

    var monthCells = months.map(function (m) {
      var std = holiday.getMonthlyWorkingHours(m, state.config, holidaySet);
      var input = el('input', { type: 'number', value: row.hours[m] != null ? row.hours[m] : '', min: 0, step: 1, class: 'hour-input' });
      var td = el('td', { class: 'col-month' }, input);

      var checkOverload = function () {
        var total = calc.getMemberMonthlyHours(state, row.memberId, m);
        var rate = calc.calculateOverloadRate(total, std);
        td.classList.toggle('overloaded', std > 0 && calc.isOverloaded(rate, state.config.overloadThreshold));
      };
      checkOverload();

      input.addEventListener('change', function () {
        var val = input.value.trim();
        store.updateWorkloadHours(row.id, m, val === '' ? null : Number(val));
      });

      return td;
    });

    var validateAndUpdate = function () {
      var newMemberId = memberSelect.value;
      var newProcessId = processSelect.value;
      if (calc.isDuplicateRow(state, newMemberId, newProcessId, row.id)) {
        alert('同じ担当者・工程の組み合わせが既に存在します');
        memberSelect.value = row.memberId;
        processSelect.value = row.processId;
        return;
      }
      store.updateWorkloadRow(row.id, { memberId: newMemberId, processId: newProcessId });
    };
    memberSelect.addEventListener('change', validateAndUpdate);
    processSelect.addEventListener('change', validateAndUpdate);

    var deleteBtn = el('button', { class: 'btn btn-danger btn-sm' }, '削除');
    deleteBtn.addEventListener('click', function () { store.deleteWorkloadRow(row.id); });

    var dupBtn = el('button', { class: 'btn btn-secondary btn-sm' }, '複製');
    dupBtn.addEventListener('click', function () { store.duplicateWorkloadRow(row.id); });

    var color = getProcessColor(row.processId, state);
    var args = [el('td', { class: 'col-member' }, memberSelect), el('td', { class: 'col-process' }, processSelect)]
      .concat(monthCells)
      .concat([totalCell, el('td', { class: 'col-actions' }, dupBtn, deleteBtn)]);

    return el.apply(null, ['tr', { style: { borderLeft: '4px solid ' + color } }].concat(args));
  }

  root.YM.views = root.YM.views || {};
  root.YM.views.mainInput = { render: render };
}(typeof globalThis !== 'undefined' ? globalThis : this));
