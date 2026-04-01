import { el, clearAndAppend, getProcessColor } from '../render.js';
import { getFiscalMonths, getMemberMonthlyHours, calculateOverloadRate, isOverloaded } from '../calc.js';
import { getMonthlyWorkingHours, buildHolidaySet } from '../holiday.js';

export function render(container, state) {
  const months = getFiscalMonths(state.config.fiscalYear, state.config.fiscalStartMonth);
  const holidaySet = buildHolidaySet(state.holidays);
  const members = [...state.members].sort((a, b) => a.order - b.order);
  const processes = [...state.processes].sort((a, b) => a.order - b.order);

  // 全データから最大値を求める（バー幅の基準）
  const allHours = state.workload.flatMap((row) => Object.values(row.hours).filter(Boolean));
  const maxRowHours = allHours.length > 0 ? Math.max(...allHours) : 1;

  const thead = el('thead', {},
    el('tr', {},
      el('th', { class: 'col-member' }, '担当者'),
      el('th', { class: 'col-process' }, '工程'),
      ...months.map((m) => el('th', { class: 'col-month' }, formatMonth(m))),
    ),
  );

  const tbody = el('tbody', {});

  state.workload.forEach((row) => {
    const member = state.members.find((m) => m.id === row.memberId);
    const process = state.processes.find((p) => p.id === row.processId);
    const color = process ? process.color : '#ccc';

    const monthCells = months.map((m) => {
      const hours = row.hours[m] || 0;
      const std = getMonthlyWorkingHours(m, state.config, holidaySet);
      const rate = calculateOverloadRate(hours, std);
      const overloaded = std > 0 && isOverloaded(rate, state.config.overloadThreshold);

      const pct = maxRowHours > 0 ? Math.min((hours / maxRowHours) * 100, 100) : 0;
      const bar = el('div', {
        class: 'gantt-bar',
        style: {
          width: `${pct}%`,
          background: overloaded ? '#e74c3c' : color,
        },
      });
      const label = hours > 0 ? el('span', { class: 'gantt-label' }, String(hours)) : null;
      const td = el('td', { class: 'col-month gantt-cell' + (overloaded ? ' overloaded' : '') },
        bar,
        label,
      );
      return td;
    });

    tbody.appendChild(el('tr', { style: { borderLeft: `4px solid ${color}` } },
      el('td', { class: 'col-member' }, member ? member.name : row.memberId),
      el('td', { class: 'col-process' }, process ? process.name : row.processId),
      ...monthCells,
    ));
  });

  if (state.workload.length === 0) {
    tbody.appendChild(el('tr', {},
      el('td', { colspan: String(months.length + 2), class: 'empty-msg' }, 'データがありません'),
    ));
  }

  const wrapper = el('div', { class: 'view-container' },
    el('div', { class: 'view-header' }, el('h2', {}, 'ガントチャート')),
    el('p', { class: 'hint' }, 'バー幅は最大工数を基準に表示。赤は過積載を示します。'),
    el('div', { class: 'table-wrapper' },
      el('table', { class: 'data-table gantt-table' }, thead, tbody),
    ),
  );

  clearAndAppend(container, wrapper);
}

function formatMonth(yearMonth) {
  const [y, m] = yearMonth.split('/');
  return `${m}月`;
}
