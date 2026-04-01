import { el, clearAndAppend } from '../render.js';
import * as store from '../store.js';
import { DEFAULT_HOLIDAYS } from '../constants.js';

export function render(container, state) {
  const holidays = [...state.holidays].sort((a, b) => a.date.localeCompare(b.date));

  const addBtn = el('button', { class: 'btn btn-primary' }, '+ 祝日追加');
  addBtn.addEventListener('click', () => {
    const date = prompt('日付（YYYY-MM-DD形式）');
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      alert('日付の形式が正しくありません（例: 2024-01-01）');
      return;
    }
    if (state.holidays.find((h) => h.date === date)) {
      alert('同じ日付が既に登録されています');
      return;
    }
    const name = prompt('祝日名');
    if (!name) return;
    store.addHoliday({ date, name: name.trim() });
  });

  const defaultBtn = el('button', { class: 'btn btn-secondary' }, 'デフォルト祝日を適用');
  defaultBtn.addEventListener('click', () => {
    if (!confirm('2024〜2026年の日本祝日を追加します（重複は無視）。よろしいですか？')) return;
    const existing = new Set(state.holidays.map((h) => h.date));
    const toAdd = DEFAULT_HOLIDAYS.filter((h) => !existing.has(h.date));
    store.setHolidays([...state.holidays, ...toAdd]);
  });

  const clearBtn = el('button', { class: 'btn btn-danger' }, '全削除');
  clearBtn.addEventListener('click', () => {
    if (!confirm('全祝日データを削除しますか？')) return;
    store.setHolidays([]);
  });

  const thead = el('thead', {},
    el('tr', {},
      el('th', {}, '日付'),
      el('th', {}, '祝日名'),
      el('th', {}, ''),
    ),
  );

  const tbody = el('tbody', {});
  holidays.forEach((holiday) => {
    const dateInput = el('input', { type: 'date', value: holiday.date, class: 'cell-input' });
    dateInput.addEventListener('change', () => {
      if (!dateInput.value) return;
      const updated = state.holidays.map((h) =>
        h.date === holiday.date ? { ...h, date: dateInput.value } : h,
      );
      store.setHolidays(updated);
    });

    const nameInput = el('input', { type: 'text', value: holiday.name, class: 'cell-input' });
    nameInput.addEventListener('change', () => {
      const updated = state.holidays.map((h) =>
        h.date === holiday.date ? { ...h, name: nameInput.value } : h,
      );
      store.setHolidays(updated);
    });

    const deleteBtn = el('button', { class: 'btn btn-danger btn-sm' }, '削除');
    deleteBtn.addEventListener('click', () => store.deleteHoliday(holiday.date));

    tbody.appendChild(el('tr', {}, el('td', {}, dateInput), el('td', {}, nameInput), el('td', {}, deleteBtn)));
  });

  const wrapper = el('div', { class: 'view-container' },
    el('div', { class: 'view-header' },
      el('h2', {}, 'マスタ：祝日'),
      el('div', { class: 'btn-group' }, addBtn, defaultBtn, clearBtn),
    ),
    el('p', { class: 'hint' }, `登録済み: ${holidays.length}件`),
    el('div', { class: 'table-wrapper' },
      el('table', { class: 'data-table' }, thead, tbody),
    ),
  );

  clearAndAppend(container, wrapper);
}
