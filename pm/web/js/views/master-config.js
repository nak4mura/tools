/* globals YM */
(function (root) {
  'use strict';
  var el = root.YM.render.el;
  var clearAndAppend = root.YM.render.clearAndAppend;
  var store = root.YM.store;

  function render(container, state) {
    var cfg = state.config;

    function makeField(label, inputEl) {
      return el('div', { class: 'form-field' }, el('label', { class: 'form-label' }, label), inputEl);
    }

    var fyInput  = el('input', { type: 'number', value: cfg.fiscalYear, min: 2020, max: 2099, class: 'form-input narrow' });
    var fsmInput = el('input', { type: 'number', value: cfg.fiscalStartMonth, min: 1, max: 12, class: 'form-input narrow' });
    var hpdInput = el('input', { type: 'number', value: cfg.hoursPerDay, min: 1, max: 24, step: 0.5, class: 'form-input narrow' });
    var thrInput = el('input', { type: 'number', value: Math.round(cfg.overloadThreshold * 100), min: 100, max: 300, step: 5, class: 'form-input narrow' });

    var form = el('form', { class: 'config-form' },
      makeField('対象年度', fyInput),
      makeField('年度開始月（1〜12）', fsmInput),
      makeField('標準稼働時間/日（時間）', hpdInput),
      makeField('過積載閾値（%）', thrInput),
      el('div', { class: 'form-actions' }, el('button', { type: 'submit', class: 'btn btn-primary' }, '設定を保存'))
    );

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fy = parseInt(fyInput.value);
      var fsm = parseInt(fsmInput.value);
      var hpd = parseFloat(hpdInput.value);
      var thr = parseInt(thrInput.value) / 100;
      if (isNaN(fy) || isNaN(fsm) || isNaN(hpd) || isNaN(thr)) { alert('全フィールドを正しく入力してください'); return; }
      store.setConfig({ fiscalYear: fy, fiscalStartMonth: fsm, hoursPerDay: hpd, overloadThreshold: thr });
      alert('設定を保存しました');
    });

    clearAndAppend(container, el('div', { class: 'view-container' },
      el('div', { class: 'view-header' }, el('h2', {}, 'マスタ：設定')),
      form
    ));
  }

  root.YM.views = root.YM.views || {};
  root.YM.views.masterConfig = { render: render };
}(typeof globalThis !== 'undefined' ? globalThis : this));
