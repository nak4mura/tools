/* globals FC */
(function (root) {
  'use strict';
  var el = root.FC.render.el;
  var clearAndAppend = root.FC.render.clearAndAppend;
  var store = root.FC.store;

  function render(container, state) {
    var members = state.members.slice().sort(function (a, b) { return a.order - b.order; });

    var addBtn = el('button', { class: 'btn btn-primary' }, '+ メンバー追加');
    addBtn.addEventListener('click', function () {
      var name = prompt('メンバー名');
      if (!name || !name.trim()) return;
      store.addMember({ name: name.trim(), order: state.members.length + 1 });
    });

    var thead = el('thead', {}, el('tr', {},
      el('th', {}, '氏名'),
      el('th', {}, '表示順'),
      el('th', {}, '')
    ));

    var tbody = el('tbody', {});
    members.forEach(function (member) {
      var nameInput = el('input', { type: 'text', value: member.name, class: 'cell-input' });
      nameInput.addEventListener('change', function () { store.updateMember(member.id, { name: nameInput.value }); });

      var orderInput = el('input', { type: 'number', value: member.order, min: 1, class: 'cell-input narrow' });
      orderInput.addEventListener('change', function () { store.updateMember(member.id, { order: parseInt(orderInput.value) }); });

      var deleteBtn = el('button', { class: 'btn btn-danger btn-sm' }, '削除');
      deleteBtn.addEventListener('click', function () {
        if (!confirm('メンバー「' + member.name + '」を削除しますか？')) return;
        store.deleteMember(member.id);
      });

      tbody.appendChild(el('tr', {},
        el('td', {}, nameInput),
        el('td', {}, orderInput),
        el('td', {}, deleteBtn)
      ));
    });

    if (!members.length) {
      tbody.appendChild(el('tr', {}, el('td', { colspan: '3', class: 'empty-msg' }, 'メンバーがいません。「+ メンバー追加」から始めてください。')));
    }

    clearAndAppend(container, el('div', { class: 'view-container' },
      el('div', { class: 'view-header' }, el('h2', {}, 'メンバーマスタ'), addBtn),
      el('div', { class: 'table-wrapper' }, el('table', { class: 'data-table' }, thead, tbody))
    ));
  }

  root.FC.views = root.FC.views || {};
  root.FC.views.inputMember = { render: render };
}(typeof globalThis !== 'undefined' ? globalThis : this));
