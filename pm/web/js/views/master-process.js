/* globals YM */
(function (root) {
  'use strict';
  var el = root.YM.render.el;
  var clearAndAppend = root.YM.render.clearAndAppend;
  var store = root.YM.store;

  function render(container, state) {
    var processes = state.processes.slice().sort(function (a, b) { return a.order - b.order; });

    var addBtn = el('button', { class: 'btn btn-primary' }, '+ 工程追加');
    addBtn.addEventListener('click', function () {
      var newId = prompt('工程ID（例: TST2）');
      if (!newId || !newId.trim()) return;
      if (state.processes.find(function (p) { return p.id === newId.trim(); })) {
        alert('同じIDの工程が既に存在します');
        return;
      }
      store.addProcess({ id: newId.trim().toUpperCase(), name: newId.trim(), color: '#cccccc', order: state.processes.length + 1 });
    });

    var thead = el('thead', {}, el('tr', {},
      el('th', {}, 'ID'), el('th', {}, '工程名'), el('th', {}, '色'), el('th', {}, '表示順'), el('th', {}, '')
    ));

    var tbody = el('tbody', {});
    processes.forEach(function (proc) {
      var nameInput = el('input', { type: 'text', value: proc.name, class: 'cell-input' });
      nameInput.addEventListener('change', function () { store.updateProcess(proc.id, { name: nameInput.value }); });

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
        el('td', {}, proc.id),
        el('td', {}, nameInput),
        el('td', {}, colorInput),
        el('td', {}, orderInput),
        el('td', {}, deleteBtn)
      ));
    });

    clearAndAppend(container, el('div', { class: 'view-container' },
      el('div', { class: 'view-header' }, el('h2', {}, 'マスタ：工程'), addBtn),
      el('div', { class: 'table-wrapper' }, el('table', { class: 'data-table' }, thead, tbody))
    ));
  }

  root.YM.views = root.YM.views || {};
  root.YM.views.masterProcess = { render: render };
}(typeof globalThis !== 'undefined' ? globalThis : this));
