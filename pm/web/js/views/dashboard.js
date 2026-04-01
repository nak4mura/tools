import { el, clearAndAppend, arcPath } from '../render.js';
import { buildProcessSummary, getMemberMonthlyHours, calculateOverloadRate, isOverloaded, getFiscalMonths } from '../calc.js';
import { getMonthlyWorkingHours, buildHolidaySet } from '../holiday.js';

export function render(container, state) {
  const months = getFiscalMonths(state.config.fiscalYear, state.config.fiscalStartMonth);
  const holidaySet = buildHolidaySet(state.holidays);
  const processSummary = buildProcessSummary(state);
  const grandTotal = processSummary.reduce((s, r) => s + r.total, 0);

  // プロジェクト概要カード
  const overviewCard = el('div', { class: 'card' },
    el('h3', { class: 'card-title' }, 'プロジェクト概要'),
    el('div', { class: 'overview-grid' },
      overviewItem('担当者数', `${state.members.length}名`),
      overviewItem('総工数', `${grandTotal}h`),
      overviewItem('工程数', `${state.processes.length}件`),
      overviewItem('対象年度', `${state.config.fiscalYear}年度`),
      overviewItem('年度開始月', `${state.config.fiscalStartMonth}月`),
      overviewItem('標準稼働時間/日', `${state.config.hoursPerDay}h`),
    ),
  );

  // 過積載警告
  const warnings = [];
  state.members.forEach((member) => {
    months.forEach((m) => {
      const actual = getMemberMonthlyHours(state, member.id, m);
      if (actual === 0) return;
      const std = getMonthlyWorkingHours(m, state.config, holidaySet);
      const rate = calculateOverloadRate(actual, std);
      if (std > 0 && isOverloaded(rate, state.config.overloadThreshold)) {
        warnings.push({ member, month: m, actual, std, rate });
      }
    });
  });

  const warningItems = warnings.map((w) =>
    el('div', { class: 'warning-chip' },
      `⚠ ${w.member.name} ${formatMonth(w.month)}: ${w.actual}h / ${w.std}h (${Math.round(w.rate * 100)}%)`,
    ),
  );

  const warningCard = el('div', { class: 'card' },
    el('h3', { class: 'card-title' }, `過積載警告 (${warnings.length}件)`),
    warnings.length === 0
      ? el('p', { class: 'hint' }, '過積載なし')
      : el('div', { class: 'warning-list' }, ...warningItems),
  );

  // 工程別円グラフ
  const pieCard = el('div', { class: 'card' },
    el('h3', { class: 'card-title' }, '工程別工数比率'),
    grandTotal > 0
      ? buildPieChart(processSummary, state.processes, grandTotal)
      : el('p', { class: 'hint' }, 'データがありません'),
  );

  // 担当者別バーチャート
  const memberTotals = state.members.map((m) => ({
    name: m.name,
    total: state.workload
      .filter((r) => r.memberId === m.id)
      .reduce((s, r) => s + Object.values(r.hours).reduce((a, h) => a + (h || 0), 0), 0),
  })).filter((m) => m.total > 0);

  const barCard = el('div', { class: 'card' },
    el('h3', { class: 'card-title' }, '担当者別総工数'),
    memberTotals.length > 0
      ? buildBarChart(memberTotals)
      : el('p', { class: 'hint' }, 'データがありません'),
  );

  const wrapper = el('div', { class: 'view-container' },
    el('div', { class: 'view-header' }, el('h2', {}, 'ダッシュボード')),
    el('div', { class: 'dashboard-grid' },
      overviewCard,
      warningCard,
      pieCard,
      barCard,
    ),
  );

  clearAndAppend(container, wrapper);
}

function overviewItem(label, value) {
  return el('div', { class: 'overview-item' },
    el('span', { class: 'overview-label' }, label),
    el('span', { class: 'overview-value' }, value),
  );
}

function buildPieChart(summary, processes, total) {
  const cx = 100, cy = 100, r = 80;
  let currentAngle = -Math.PI / 2; // 12時から開始

  const paths = [];
  const legendItems = [];

  summary.forEach((row) => {
    if (row.total === 0) return;
    const proc = processes.find((p) => p.id === row.processId);
    const color = proc ? proc.color : '#ccc';
    const ratio = row.total / total;
    const angle = ratio * 2 * Math.PI;
    const endAngle = currentAngle + angle;

    paths.push(el('path', { d: arcPath(cx, cy, r, currentAngle, endAngle), fill: color, stroke: '#fff', 'stroke-width': '2' }));
    currentAngle = endAngle;

    legendItems.push(el('div', { class: 'legend-item' },
      el('span', { class: 'legend-dot', style: { background: color } }),
      `${row.processName}: ${row.total}h (${Math.round(ratio * 100)}%)`,
    ));
  });

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.setAttribute('width', '200');
  svg.setAttribute('height', '200');
  svg.setAttribute('class', 'pie-chart');
  paths.forEach((p) => svg.appendChild(p));

  return el('div', { class: 'chart-container' },
    svg,
    el('div', { class: 'legend' }, ...legendItems),
  );
}

function buildBarChart(memberTotals) {
  const max = Math.max(...memberTotals.map((m) => m.total));
  const bars = memberTotals.map((m) => {
    const pct = max > 0 ? (m.total / max) * 100 : 0;
    return el('div', { class: 'bar-row' },
      el('span', { class: 'bar-name' }, m.name),
      el('div', { class: 'bar-track' },
        el('div', { class: 'bar-fill', style: { width: `${pct}%` } }),
        el('span', { class: 'bar-value' }, `${m.total}h`),
      ),
    );
  });
  return el('div', { class: 'bar-chart' }, ...bars);
}

function formatMonth(yearMonth) {
  const [y, m] = yearMonth.split('/');
  return `${y}年${m}月`;
}
