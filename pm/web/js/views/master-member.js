/* globals YM */
(function (root) {
  'use strict';
  var el = root.YM.render.el;
  var clearAndAppend = root.YM.render.clearAndAppend;
  var store = root.YM.store;

  function render(container, state) {
    var members = state.members.slice().sort(function (a, b) { return a.order - b.order; });

    var addBtn = el('button', { class: 'btn btn-primary' }, '+ 担当者追加');
    addBtn.addEventListener('click', function () {
      var name = prompt('担当者名');
      if (!name || !name.trim()) return;
      var newId = 'M' + String(state.members.length + 1).padStart(3, '0');
      store.addMember({ id: newId, name: name.trim(), department: '', role: '', order: state.members.length + 1 });
    });

    var thead = el('thead', {}, el('tr', {},
      el('th', {}, 'ID'), el('th', {}, '氏名'), el('th', {}, '所属'), el('th', {}, '役割'), el('th', {}, '表示順'), el('th', {}, '')
    ));

    var tbody = el('tbody', {});
    members.forEach(function (member) {
      function makeInput(field, type, extra) {
        var attrs = Object.assign({ type: type || 'text', value: member[field], class: 'cell-input' }, extra || {});
        var input = el('input', attrs);
        input.addEventListener('change', function () {
          var val = (type === 'number') ? parseInt(input.value) : input.value;
          var upd = {};
          upd[field] = val;
          store.updateMember(member.id, upd);
        });
        return input;
      }

      var deleteBtn = el('button', { class: 'btn btn-danger btn-sm' }, '削除');
      deleteBtn.addEventListener('click', function () {
        if (!confirm('担当者「' + member.name + '」を削除しますか？')) return;
        store.deleteMember(member.id);
      });

      tbody.appendChild(el('tr', {},
        el('td', {}, member.id),
        el('td', {}, makeInput('name')),
        el('td', {}, makeInput('department')),
        el('td', {}, makeInput('role')),
        el('td', {}, makeInput('order', 'number', { min: 1 })),
        el('td', {}, deleteBtn)
      ));
    });

    clearAndAppend(container, el('div', { class: 'view-container' },
      el('div', { class: 'view-header' }, el('h2', {}, 'マスタ：担当者'), addBtn),
      el('div', { class: 'table-wrapper' }, el('table', { class: 'data-table' }, thead, tbody))
    ));
  }

  root.YM.views = root.YM.views || {};
  root.YM.views.masterMember = { render: render };
}(typeof globalThis !== 'undefined' ? globalThis : this));
