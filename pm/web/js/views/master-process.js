import { el, clearAndAppend, uid } from '../render.js';
import * as store from '../store.js';

export function render(container, state) {
  const processes = [...state.processes].sort((a, b) => a.order - b.order);

  const addBtn = el('button', { class: 'btn btn-primary' }, '+ 工程追加');
  addBtn.addEventListener('click', () => {
    const newId = prompt('工程ID（例: TST2）');
    if (!newId || !newId.trim()) return;
    if (state.processes.find((p) => p.id === newId.trim())) {
      alert('同じIDの工程が既に存在します');
      return;
    }
    store.addProcess({
      id: newId.trim().toUpperCase(),
      name: newId.trim(),
      color: '#cccccc',
      order: state.processes.length + 1,
    });
  });

  const thead = el('thead', {},
    el('tr', {},
      el('th', {}, 'ID'),
      el('th', {}, '工程名'),
      el('th', {}, '色'),
      el('th', {}, '表示順'),
      el('th', {}, ''),
    ),
  );

  const tbody = el('tbody', {});
  processes.forEach((proc) => {
    const idCell = el('td', {}, proc.id);
    const nameInput = el('input', { type: 'text', value: proc.name, class: 'cell-input' });
    nameInput.addEventListener('change', () => store.updateProcess(proc.id, { name: nameInput.value }));

    const colorInput = el('input', { type: 'color', value: proc.color });
    colorInput.addEventListener('change', () => store.updateProcess(proc.id, { color: colorInput.value }));

    const orderInput = el('input', { type: 'number', value: proc.order, min: 1, class: 'cell-input narrow' });
    orderInput.addEventListener('change', () => store.updateProcess(proc.id, { order: parseInt(orderInput.value) }));

    const deleteBtn = el('button', { class: 'btn btn-danger btn-sm' }, '削除');
    deleteBtn.addEventListener('click', () => {
      if (!confirm(`工程「${proc.name}」を削除しますか？`)) return;
      store.deleteProcess(proc.id);
    });

    tbody.appendChild(el('tr', { style: { borderLeft: `4px solid ${proc.color}` } },
      idCell,
      el('td', {}, nameInput),
      el('td', {}, colorInput),
      el('td', {}, orderInput),
      el('td', {}, deleteBtn),
    ));
  });

  const wrapper = el('div', { class: 'view-container' },
    el('div', { class: 'view-header' },
      el('h2', {}, 'マスタ：工程'),
      addBtn,
    ),
    el('div', { class: 'table-wrapper' },
      el('table', { class: 'data-table' }, thead, tbody),
    ),
  );

  clearAndAppend(container, wrapper);
}
