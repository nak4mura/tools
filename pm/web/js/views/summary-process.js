import { el, clearAndAppend } from '../render.js';
import { buildProcessSummary, getFiscalMonths, getMonthlyTotal } from '../calc.js';
import { getMonthlyWorkingHours, buildHolidaySet } from '../holiday.js';

export function render(container, state) {
  const summary = buildProcessSummary(state);
  const processes = [...state.processes].sort((a, b) => a.order - b.order);
  const months = getFiscalMonths(state.config.fiscalYear, state.config.fiscalStartMonth);
  const holidaySet = buildHolidaySet(state.holidays);

  const thead = el('thead', {},
    el('tr', {},
      el('th', {}, '工程'),
      ...months.map((m) => el('th', { class: 'col-month' }, formatMonth(m))),
      el('th', { class: 'total-col' }, '合計'),
    ),
  );

  const tbody = el('tbody', {});

  // 標準稼働時間行
  const stdCells = months.map((m) => {
    const std = getMonthlyWorkingHours(m, state.config, holidaySet);
    return el('td', { class: 'std-cell' }, String(std));
  });
  tbody.appendChild(el('tr', { class: 'std-row' },
    el('td', { class: 'std-label' }, '標準稼働時間'),
    ...stdCells,
    el('td', {}),
  ));

  summary.forEach((row) => {
    const proc = state.processes.find((p) => p.id === row.processId);
    const color = proc ? proc.color : '#ccc';
    const cells = months.map((m) => {
      const h = row.byMonth[m] || 0;
      return el('td', { class: 'col-month' + (h > 0 ? ' has-value' : '') }, h > 0 ? String(h) : '');
    });
    tbody.appendChild(el('tr', { style: { borderLeft: `4px solid ${color}` } },
      el('td', {}, row.processName),
      ...cells,
      el('td', { class: 'total-col bold' }, row.total > 0 ? String(row.total) : ''),
    ));
  });

  // 月別合計行
  const monthTotals = months.map((m) => {
    const t = getMonthlyTotal(state, m);
    return el('td', { class: 'footer-cell' }, t > 0 ? String(t) : '');
  });
  const grandTotal = summary.reduce((s, r) => s + r.total, 0);
  tbody.appendChild(el('tr', { class: 'footer-row' },
    el('td', { class: 'footer-label' }, '月別合計'),
    ...monthTotals,
    el('td', { class: 'footer-cell bold' }, grandTotal > 0 ? String(grandTotal) : ''),
  ));

  const wrapper = el('div', { class: 'view-container' },
    el('div', { class: 'view-header' }, el('h2', {}, 'サマリー：工程別')),
    el('div', { class: 'table-wrapper' },
      el('table', { class: 'data-table summary-table' }, thead, tbody),
    ),
  );

  clearAndAppend(container, wrapper);
}

function formatMonth(yearMonth) {
  const [y, m] = yearMonth.split('/');
  return `${y}/${m.padStart(2, '0')}`;
}
