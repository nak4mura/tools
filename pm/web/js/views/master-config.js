import { el, clearAndAppend } from '../render.js';
import * as store from '../store.js';

export function render(container, state) {
  const cfg = state.config;

  const makeField = (label, inputEl) =>
    el('div', { class: 'form-field' },
      el('label', { class: 'form-label' }, label),
      inputEl,
    );

  const fiscalYearInput = el('input', { type: 'number', value: cfg.fiscalYear, min: 2020, max: 2099, class: 'form-input narrow' });
  const fiscalStartInput = el('input', { type: 'number', value: cfg.fiscalStartMonth, min: 1, max: 12, class: 'form-input narrow' });
  const hoursInput = el('input', { type: 'number', value: cfg.hoursPerDay, min: 1, max: 24, step: 0.5, class: 'form-input narrow' });
  const thresholdInput = el('input', {
    type: 'number',
    value: Math.round(cfg.overloadThreshold * 100),
    min: 100,
    max: 300,
    step: 5,
    class: 'form-input narrow',
  });

  const saveBtn = el('button', { type: 'submit', class: 'btn btn-primary' }, '設定を保存');

  const form = el('form', { class: 'config-form' },
    makeField('対象年度', fiscalYearInput),
    makeField('年度開始月（1〜12）', fiscalStartInput),
    makeField('標準稼働時間/日（時間）', hoursInput),
    makeField('過積載閾値（%）', thresholdInput),
    el('div', { class: 'form-actions' }, saveBtn),
  );

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fy = parseInt(fiscalYearInput.value);
    const fsm = parseInt(fiscalStartInput.value);
    const hpd = parseFloat(hoursInput.value);
    const threshold = parseInt(thresholdInput.value) / 100;

    if (isNaN(fy) || isNaN(fsm) || isNaN(hpd) || isNaN(threshold)) {
      alert('全フィールドを正しく入力してください');
      return;
    }
    store.setConfig({ fiscalYear: fy, fiscalStartMonth: fsm, hoursPerDay: hpd, overloadThreshold: threshold });
    alert('設定を保存しました');
  });

  const wrapper = el('div', { class: 'view-container' },
    el('div', { class: 'view-header' }, el('h2', {}, 'マスタ：設定')),
    form,
  );

  clearAndAppend(container, wrapper);
}
