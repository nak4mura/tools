/* globals FC */
(function (root) {
  'use strict';

  var TABS = [
    { id: 'input-process',     label: '工程マスタ',       view: function () { return root.FC.views.inputProcess; } },
    { id: 'input-member',      label: 'メンバーマスタ',    view: function () { return root.FC.views.inputMember; } },
    { id: 'input-assignment',  label: '工数入力',         view: function () { return root.FC.views.inputAssignment; } },
    { id: 'result-timeline',   label: '予測タイムライン',  view: function () { return root.FC.views.resultTimeline; } },
    { id: 'result-table',      label: '予測テーブル',      view: function () { return root.FC.views.resultTable; } },
  ];

  var _activeTabId = 'input-process';
  var _container = null;
  var _tabButtons = {};

  function renderActiveTab() {
    var tab = TABS.find(function (t) { return t.id === _activeTabId; });
    if (tab && _container) tab.view().render(_container, root.FC.store.getSnapshot());
  }

  function activateTab(tabId) {
    _activeTabId = tabId;
    Object.keys(_tabButtons).forEach(function (id) {
      var btn = _tabButtons[id];
      btn.classList.toggle('active', id === tabId);
      btn.setAttribute('aria-selected', id === tabId ? 'true' : 'false');
    });
    history.replaceState(null, '', '#' + tabId);
    renderActiveTab();
  }

  document.addEventListener('DOMContentLoaded', function () {
    _container = document.getElementById('app-content');

    // タブナビゲーション構築
    var nav = document.getElementById('tab-nav');
    TABS.forEach(function (tab) {
      var btn = document.createElement('button');
      btn.textContent = tab.label;
      btn.setAttribute('role', 'tab');
      btn.className = tab.id === _activeTabId ? 'tab-btn active' : 'tab-btn';
      btn.setAttribute('aria-selected', tab.id === _activeTabId ? 'true' : 'false');
      btn.addEventListener('click', function () { activateTab(tab.id); });
      nav.appendChild(btn);
      _tabButtons[tab.id] = btn;
    });

    // エクスポート/インポート
    var exportBtn = document.getElementById('btn-export');
    var importFile = document.getElementById('import-file');
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        root.FC.storage.exportJSON(root.FC.store.getSnapshot());
      });
    }
    if (importFile) {
      importFile.addEventListener('change', function () {
        var file = importFile.files[0];
        if (!file) return;
        root.FC.storage.importJSON(file).then(function (newState) {
          if (!newState) { alert('JSONファイルの読み込みに失敗しました'); return; }
          root.FC.store.replaceState(newState);
          importFile.value = '';
        });
      });
    }

    // 設定：開始年月
    var configBtn = document.getElementById('btn-config');
    if (configBtn) {
      configBtn.addEventListener('click', function () {
        var current = root.FC.store.getSnapshot().config.startYearMonth;
        var input = prompt('予測開始年月 (例: 2026/4)', current);
        if (!input) return;
        var parts = input.trim().split('/');
        if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
          alert('形式が正しくありません。例: 2026/4');
          return;
        }
        root.FC.store.setConfig({ startYearMonth: parseInt(parts[0]) + '/' + parseInt(parts[1]) });
      });
    }

    // ステート変更時再レンダリング
    document.addEventListener('statechange', renderActiveTab);

    // URLハッシュでタブ復元
    if (location.hash) {
      var hashId = location.hash.slice(1);
      if (TABS.find(function (t) { return t.id === hashId; })) {
        _activeTabId = hashId;
        Object.keys(_tabButtons).forEach(function (id) {
          _tabButtons[id].classList.toggle('active', id === hashId);
        });
      }
    }

    renderActiveTab();
  });

}(typeof globalThis !== 'undefined' ? globalThis : this));
