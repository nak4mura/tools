import { el, clearAndAppend, formatHours, getProcessColor } from '../render.js';
import * as store from '../store.js';
import { getFiscalMonths, isDuplicateRow, getMemberMonthlyHours, calculateOverloadRate, isOverloaded } from '../calc.js';
import { getMonthlyWorkingHours, buildHolidaySet } from '../holiday.js';

export function render(container, state) {
  const months = getFiscalMonths(state.config.fiscalYear, state.config.fiscalStartMonth);
  const holidaySet = buildHolidaySet(state.holidays);
  const members = [...state.members].sort((a, b) => a.order - b.order);
  const processes = [...state.processes].sort((a, b) => a.order - b.order);

  // ツールバー
  const addBtn = el('button', { class: 'btn btn-primary' }, '+ 行追加');
  addBtn.addEventListener('click', () => {
    if (members.length === 0) { alert('先に担当者マスタを登録してください'); return; }
    if (processes.length === 0) { alert('先に工程マスタを登録してください'); return; }
    store.addWorkloadRow(members[0].id, processes[0].id);
  });

  const sampleBtn = el('button', { class: 'btn btn-secondary' }, 'サンプルデータ挿入');
  sampleBtn.addEventListener('click', () => {
    if (!confirm('サンプルデータを挿入しますか？')) return;
    store.insertSampleData();
  });

  const clearBtn = el('button', { class: 'btn btn-danger' }, '全データ削除');
  clearBtn.addEventListener('click', () => {
    if (!confirm('全工数データを削除しますか？')) return;
    store.clearAllWorkload();
  });

  // ヘッダー行
  const headerCells = [
    el('th', { class: 'col-member' }, '担当者'),
    el('th', { class: 'col-process' }, '工程'),
    ...months.map((m) => el('th', { class: 'col-month' }, formatMonthLabel(m))),
    el('th', { class: 'col-total' }, '合計'),
    el('th', { class: 'col-actions' }, ''),
  ];

  // 標準工数行（参考用）
  const stdCells = [
    el('td', { colspan: 2, class: 'std-label' }, '標準稼働時間'),
    ...months.map((m) => {
      const std = getMonthlyWorkingHours(m, state.config, holidaySet);
      return el('td', { class: 'col-month std-cell' }, String(std));
    }),
    el('td', {}),
    el('td', {}),
  ];

  const tbody = el('tbody', {});

  state.workload.forEach((row) => {
    tbody.appendChild(buildRow(row, state, months, holidaySet, members, processes));
  });

  const table = el('table', { class: 'data-table main-input-table' },
    el('thead', {}, el('tr', {}, ...headerCells)),
    el('tbody', { class: 'std-row' }, el('tr', { class: 'std-row' }, ...stdCells)),
    tbody,
  );

  const wrapper = el('div', { class: 'view-container' },
    el('div', { class: 'view-header' },
      el('h2', {}, 'メイン入力'),
      el('div', { class: 'btn-group' }, addBtn, sampleBtn, clearBtn),
    ),
    el('div', { class: 'table-wrapper' }, table),
  );

  clearAndAppend(container, wrapper);
}

function buildRow(row, state, months, holidaySet, members, processes) {
  const memberSelect = el('select', { class: 'cell-select' });
  members.forEach((m) => {
    const opt = el('option', { value: m.id }, m.name);
    if (m.id === row.memberId) opt.selected = true;
    memberSelect.appendChild(opt);
  });

  const processSelect = el('select', { class: 'cell-select' });
  processes.forEach((p) => {
    const opt = el('option', { value: p.id }, p.name);
    if (p.id === row.processId) opt.selected = true;
    processSelect.appendChild(opt);
  });

  const totalCell = el('td', { class: 'col-total total-cell' });

  const hourInputs = [];
  const monthCells = months.map((m) => {
    const std = getMonthlyWorkingHours(m, state.config, holidaySet);
    const threshold = state.config.overloadThreshold;
    const currentHours = row.hours[m] ?? '';
    const input = el('input', {
      type: 'number',
      value: currentHours,
      min: 0,
      step: 1,
      class: 'hour-input',
    });
    hourInputs.push({ input, month: m });

    const td = el('td', { class: 'col-month' }, input);

    // 過積載チェック（メンバー全体）
    const updateOverload = () => {
      const total = getMemberMonthlyHours(state, row.memberId, m);
      const rate = calculateOverloadRate(total, std);
      td.classList.toggle('overloaded', std > 0 && isOverloaded(rate, state.config.overloadThreshold));
    };

    input.addEventListener('change', () => {
      const val = input.value.trim();
      store.updateWorkloadHours(row.id, m, val === '' ? null : Number(val));
    });

    return { td, updateOverload };
  });

  const updateTotal = () => {
    const total = Object.values(row.hours).reduce((s, h) => s + (h ?? 0), 0);
    totalCell.textContent = total > 0 ? String(total) : '';
  };
  updateTotal();

  // セレクト変更時の検証
  const validateAndUpdate = () => {
    const newMemberId = memberSelect.value;
    const newProcessId = processSelect.value;
    if (isDuplicateRow(state, newMemberId, newProcessId, row.id)) {
      alert('同じ担当者・工程の組み合わせが既に存在します');
      memberSelect.value = row.memberId;
      processSelect.value = row.processId;
      return;
    }
    store.updateWorkloadRow(row.id, { memberId: newMemberId, processId: newProcessId });
  };
  memberSelect.addEventListener('change', validateAndUpdate);
  processSelect.addEventListener('change', validateAndUpdate);

  const deleteBtn = el('button', { class: 'btn btn-danger btn-sm' }, '削除');
  deleteBtn.addEventListener('click', () => store.deleteWorkloadRow(row.id));

  const dupBtn = el('button', { class: 'btn btn-secondary btn-sm' }, '複製');
  dupBtn.addEventListener('click', () => store.duplicateWorkloadRow(row.id));

  const processColor = getProcessColor(row.processId, state);
  const tr = el('tr', { style: { borderLeft: `4px solid ${processColor}` } },
    el('td', { class: 'col-member' }, memberSelect),
    el('td', { class: 'col-process' }, processSelect),
    ...monthCells.map((c) => c.td),
    totalCell,
    el('td', { class: 'col-actions' }, dupBtn, deleteBtn),
  );

  return tr;
}

function formatMonthLabel(yearMonth) {
  const parts = yearMonth.split('/');
  return `${parts[1]}月`;
}
