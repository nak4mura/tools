/* globals FC */
(function (root) {
  'use strict';
  var el = root.FC.render.el;
  var clearAndAppend = root.FC.render.clearAndAppend;
  var store = root.FC.store;
  var constants = root.FC.constants;

  function render(container, state) {
    var processes = state.processes.slice().sort(function (a, b) { return a.order - b.order; });

    var addBtn = el('button', { class: 'btn btn-primary' }, '+ 工程追加');
    addBtn.addEventListener('click', function () {
      var name = prompt('工程名');
      if (!name || !name.trim()) return;
      var colors = constants.DEFAULT_COLORS;
      var color = colors[state.processes.length % colors.length];
      store.addProcess({ name: name.trim(), totalEffort: 0, order: state.processes.length + 1, color: color });
    });

    var thead = el('thead', {}, el('tr', {},
      el('th', {}, '工程名'),
      el('th', {}, '総工数 (h)'),
      el('th', {}, '色'),
      el('th', {}, '表示順'),
      el('th', {}, '')
    ));

    var tbody = el('tbody', {});
    processes.forEach(function (proc) {
      var nameInput = el('input', { type: 'text', value: proc.name, class: 'cell-input' });
      nameInput.addEventListener('change', function () { store.updateProcess(proc.id, { name: nameInput.value }); });

      var effortInput = el('input', { type: 'number', value: proc.totalEffort, min: 0, step: 1, class: 'cell-input narrow' });
      effortInput.addEventListener('change', function () { store.updateProcess(proc.id, { totalEffort: Number(effortInput.value) }); });

      var colorInput = el('input', { type: 'color', value: proc.color });
      colorInput.addEventListener('change', function () { store.updateProcess(proc.id, { color: colorInput.value }); });

      var orderInput = el('input', { type: 'number', value: proc.order, min: 1, class: 'cell-input narrow' });
      orderInput.addEventListener('change', function () { store.updateProcess(proc.id, { order: parseInt(orderInput.value) }); });

      var deleteBtn = el('button', { class: 'btn btn-danger btn-sm' }, '削除');
      deleteBtn.addEventListener('click', function () {
        if (!confirm('工程「' + proc.name + '」を削除しますか？')) return;
        store.deleteProcess(proc.id);
      });

      tbody.appendChild(el('tr', { style: { borderLeft: '4px solid ' + proc.color } },
        el('td', {}, nameInput),
        el('td', {}, effortInput),
        el('td', {}, colorInput),
        el('td', {}, orderInput),
        el('td', {}, deleteBtn)
      ));
    });

    if (!processes.length) {
      tbody.appendChild(el('tr', {}, el('td', { colspan: '5', class: 'empty-msg' }, '工程がありません。「+ 工程追加」から始めてください。')));
    }

    clearAndAppend(container, el('div', { class: 'view-container' },
      el('div', { class: 'view-header' }, el('h2', {}, '工程マスタ'), addBtn),
      el('p', { class: 'hint' }, '各工程の名前と完了に必要な総工数（時間）を設定します。'),
      el('div', { class: 'table-wrapper' }, el('table', { class: 'data-table' }, thead, tbody))
    ));
  }

  root.FC.views = root.FC.views || {};
  root.FC.views.inputProcess = { render: render };
}(typeof globalThis !== 'undefined' ? globalThis : this));
