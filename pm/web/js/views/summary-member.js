import { el, clearAndAppend } from '../render.js';
import { buildMemberSummary, getFiscalMonths, getMemberMonthlyHours, calculateOverloadRate, isOverloaded } from '../calc.js';
import { getMonthlyWorkingHours, buildHolidaySet } from '../holiday.js';

export function render(container, state) {
  const summary = buildMemberSummary(state);
  const processes = [...state.processes].sort((a, b) => a.order - b.order);
  const months = getFiscalMonths(state.config.fiscalYear, state.config.fiscalStartMonth);
  const holidaySet = buildHolidaySet(state.holidays);

  const thead = el('thead', {},
    el('tr', {},
      el('th', {}, '担当者'),
      ...processes.map((p) => el('th', { style: { borderTop: `3px solid ${p.color}` } }, p.name)),
      el('th', { class: 'total-col' }, '合計'),
    ),
  );

  const tbody = el('tbody', {});
  summary.forEach((row) => {
    const cells = processes.map((p) => {
      const hours = row.byProcess[p.id] || 0;
      return el('td', { class: hours > 0 ? 'has-value' : '' }, hours > 0 ? String(hours) : '');
    });
    tbody.appendChild(el('tr', {},
      el('td', { class: 'member-name' }, row.memberName),
      ...cells,
      el('td', { class: 'total-col bold' }, row.total > 0 ? String(row.total) : ''),
    ));
  });

  // 合計行
  const totalCells = processes.map((p) => {
    const t = summary.reduce((s, r) => s + (r.byProcess[p.id] || 0), 0);
    return el('td', { class: 'footer-cell' }, t > 0 ? String(t) : '');
  });
  const grandTotal = summary.reduce((s, r) => s + r.total, 0);
  tbody.appendChild(el('tr', { class: 'footer-row' },
    el('td', { class: 'footer-label' }, '合計'),
    ...totalCells,
    el('td', { class: 'footer-cell bold' }, grandTotal > 0 ? String(grandTotal) : ''),
  ));

  const wrapper = el('div', { class: 'view-container' },
    el('div', { class: 'view-header' }, el('h2', {}, 'サマリー：担当者別')),
    el('div', { class: 'table-wrapper' },
      el('table', { class: 'data-table summary-table' }, thead, tbody),
    ),
  );

  clearAndAppend(container, wrapper);
}
