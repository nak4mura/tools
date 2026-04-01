/* globals YM */
(function (root) {
  'use strict';
  var el = root.YM.render.el;
  var clearAndAppend = root.YM.render.clearAndAppend;
  var store = root.YM.store;

  function render(container, state) {
    var holidays = state.holidays.slice().sort(function (a, b) { return a.date.localeCompare(b.date); });

    var addBtn = el('button', { class: 'btn btn-primary' }, '+ 祝日追加');
    addBtn.addEventListener('click', function () {
      var date = prompt('日付（YYYY-MM-DD形式）');
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { alert('日付の形式が正しくありません（例: 2024-01-01）'); return; }
      if (state.holidays.find(function (h) { return h.date === date; })) { alert('同じ日付が既に登録されています'); return; }
      var name = prompt('祝日名');
      if (!name) return;
      store.addHoliday({ date: date, name: name.trim() });
    });

    var defaultBtn = el('button', { class: 'btn btn-secondary' }, 'デフォルト祝日を適用');
    defaultBtn.addEventListener('click', function () {
      if (!confirm('2024〜2026年の日本祝日を追加します（重複は無視）。よろしいですか？')) return;
      var existing = new Set(state.holidays.map(function (h) { return h.date; }));
      var toAdd = root.YM.constants.DEFAULT_HOLIDAYS.filter(function (h) { return !existing.has(h.date); });
      store.setHolidays(state.holidays.concat(toAdd));
    });

    var clearBtn = el('button', { class: 'btn btn-danger' }, '全削除');
    clearBtn.addEventListener('click', function () {
      if (!confirm('全祝日データを削除しますか？')) return;
      store.setHolidays([]);
    });

    var thead = el('thead', {}, el('tr', {}, el('th', {}, '日付'), el('th', {}, '祝日名'), el('th', {}, '')));
    var tbody = el('tbody', {});

    holidays.forEach(function (holiday) {
      var dateInput = el('input', { type: 'date', value: holiday.date, class: 'cell-input' });
      dateInput.addEventListener('change', function () {
        if (!dateInput.value) return;
        store.setHolidays(state.holidays.map(function (h) { return h.date === holiday.date ? Object.assign({}, h, { date: dateInput.value }) : h; }));
      });

      var nameInput = el('input', { type: 'text', value: holiday.name, class: 'cell-input' });
      nameInput.addEventListener('change', function () {
        store.setHolidays(state.holidays.map(function (h) { return h.date === holiday.date ? Object.assign({}, h, { name: nameInput.value }) : h; }));
      });

      var deleteBtn = el('button', { class: 'btn btn-danger btn-sm' }, '削除');
      deleteBtn.addEventListener('click', function () { store.deleteHoliday(holiday.date); });

      tbody.appendChild(el('tr', {}, el('td', {}, dateInput), el('td', {}, nameInput), el('td', {}, deleteBtn)));
    });

    clearAndAppend(container, el('div', { class: 'view-container' },
      el('div', { class: 'view-header' }, el('h2', {}, 'マスタ：祝日'), el('div', { class: 'btn-group' }, addBtn, defaultBtn, clearBtn)),
      el('p', { class: 'hint' }, '登録済み: ' + holidays.length + '件'),
      el('div', { class: 'table-wrapper' }, el('table', { class: 'data-table' }, thead, tbody))
    ));
  }

  root.YM.views = root.YM.views || {};
  root.YM.views.masterHoliday = { render: render };
}(typeof globalThis !== 'undefined' ? globalThis : this));
