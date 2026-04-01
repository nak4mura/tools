/* globals YM */
(function (root) {
  'use strict';

  var TABS = [
    { id: 'main-input',      label: 'メイン入力',        view: function () { return root.YM.views.mainInput; } },
    { id: 'summary-member',  label: 'サマリー：担当者別', view: function () { return root.YM.views.summaryMember; } },
    { id: 'summary-process', label: 'サマリー：工程別',   view: function () { return root.YM.views.summaryProcess; } },
    { id: 'gantt',           label: 'ガントチャート',     view: function () { return root.YM.views.gantt; } },
    { id: 'dashboard',       label: 'ダッシュボード',     view: function () { return root.YM.views.dashboard; } },
    { id: 'master-process',  label: 'マスタ：工程',       view: function () { return root.YM.views.masterProcess; } },
    { id: 'master-member',   label: 'マスタ：担当者',     view: function () { return root.YM.views.masterMember; } },
    { id: 'master-holiday',  label: 'マスタ：祝日',       view: function () { return root.YM.views.masterHoliday; } },
    { id: 'master-config',   label: 'マスタ：設定',       view: function () { return root.YM.views.masterConfig; } },
  ];

  var _activeTabId = 'main-input';
  var _container = null;
  var _tabButtons = {};

  function renderActiveTab() {
    var tab = TABS.find(function (t) { return t.id === _activeTabId; });
    if (tab && _container) tab.view().render(_container, root.YM.store.getSnapshot());
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
        root.YM.storage.exportJSON(root.YM.store.getSnapshot());
      });
    }
    if (importFile) {
      importFile.addEventListener('change', function () {
        var file = importFile.files[0];
        if (!file) return;
        root.YM.storage.importJSON(file).then(function (newState) {
          if (!newState) { alert('JSONファイルの読み込みに失敗しました'); return; }
          root.YM.store.replaceState(newState);
          importFile.value = '';
        });
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
