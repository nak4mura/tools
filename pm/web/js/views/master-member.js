import { el, clearAndAppend, uid } from '../render.js';
import * as store from '../store.js';

export function render(container, state) {
  const members = [...state.members].sort((a, b) => a.order - b.order);

  const addBtn = el('button', { class: 'btn btn-primary' }, '+ 担当者追加');
  addBtn.addEventListener('click', () => {
    const name = prompt('担当者名');
    if (!name || !name.trim()) return;
    const newId = `M${String(state.members.length + 1).padStart(3, '0')}`;
    store.addMember({
      id: newId,
      name: name.trim(),
      department: '',
      role: '',
      order: state.members.length + 1,
    });
  });

  const thead = el('thead', {},
    el('tr', {},
      el('th', {}, 'ID'),
      el('th', {}, '氏名'),
      el('th', {}, '所属'),
      el('th', {}, '役割'),
      el('th', {}, '表示順'),
      el('th', {}, ''),
    ),
  );

  const tbody = el('tbody', {});
  members.forEach((member) => {
    const makeInput = (field, type = 'text', extra = {}) => {
      const input = el('input', { type, value: member[field], class: 'cell-input', ...extra });
      input.addEventListener('change', () => {
        const val = type === 'number' ? parseInt(input.value) : input.value;
        store.updateMember(member.id, { [field]: val });
      });
      return input;
    };

    const deleteBtn = el('button', { class: 'btn btn-danger btn-sm' }, '削除');
    deleteBtn.addEventListener('click', () => {
      if (!confirm(`担当者「${member.name}」を削除しますか？`)) return;
      store.deleteMember(member.id);
    });

    tbody.appendChild(el('tr', {},
      el('td', {}, member.id),
      el('td', {}, makeInput('name')),
      el('td', {}, makeInput('department')),
      el('td', {}, makeInput('role')),
      el('td', {}, makeInput('order', 'number', { min: 1 })),
      el('td', {}, deleteBtn),
    ));
  });

  const wrapper = el('div', { class: 'view-container' },
    el('div', { class: 'view-header' },
      el('h2', {}, 'マスタ：担当者'),
      addBtn,
    ),
    el('div', { class: 'table-wrapper' },
      el('table', { class: 'data-table' }, thead, tbody),
    ),
  );

  clearAndAppend(container, wrapper);
}
