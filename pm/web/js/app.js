/**
 * アプリケーションエントリポイント
 * タブルーティングと初期化を担当。
 */
import { getSnapshot } from './store.js';
import { exportJSON, importJSON } from './storage.js';
import * as mainInput from './views/main-input.js';
import * as masterProcess from './views/master-process.js';
import * as masterMember from './views/master-member.js';
import * as masterHoliday from './views/master-holiday.js';
import * as masterConfig from './views/master-config.js';
import * as summaryMember from './views/summary-member.js';
import * as summaryProcess from './views/summary-process.js';
import * as gantt from './views/gantt.js';
import * as dashboard from './views/dashboard.js';

const TABS = [
  { id: 'main-input',     label: 'メイン入力',        view: mainInput },
  { id: 'summary-member', label: 'サマリー：担当者別', view: summaryMember },
  { id: 'summary-process',label: 'サマリー：工程別',   view: summaryProcess },
  { id: 'gantt',          label: 'ガントチャート',     view: gantt },
  { id: 'dashboard',      label: 'ダッシュボード',     view: dashboard },
  { id: 'master-process', label: 'マスタ：工程',       view: masterProcess },
  { id: 'master-member',  label: 'マスタ：担当者',     view: masterMember },
  { id: 'master-holiday', label: 'マスタ：祝日',       view: masterHoliday },
  { id: 'master-config',  label: 'マスタ：設定',       view: masterConfig },
];

let _activeTabId = 'main-input';
let _container = null;
let _tabButtons = {};

function renderActiveTab() {
  const tab = TABS.find((t) => t.id === _activeTabId);
  if (tab && _container) {
    tab.view.render(_container, getSnapshot());
  }
}

function activateTab(tabId) {
  _activeTabId = tabId;
  Object.entries(_tabButtons).forEach(([id, btn]) => {
    btn.classList.toggle('active', id === tabId);
    btn.setAttribute('aria-selected', id === tabId ? 'true' : 'false');
  });
  renderActiveTab();
}

function buildNav() {
  const nav = document.getElementById('tab-nav');
  if (!nav) return;
  TABS.forEach((tab) => {
    const btn = document.createElement('button');
    btn.textContent = tab.label;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', tab.id === _activeTabId ? 'true' : 'false');
    btn.className = tab.id === _activeTabId ? 'tab-btn active' : 'tab-btn';
    btn.addEventListener('click', () => activateTab(tab.id));
    nav.appendChild(btn);
    _tabButtons[tab.id] = btn;
  });
}

function buildToolbar() {
  const exportBtn = document.getElementById('btn-export');
  const importBtn = document.getElementById('btn-import');
  const importFile = document.getElementById('import-file');

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportJSON(getSnapshot());
    });
  }

  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', async () => {
      const file = importFile.files[0];
      if (!file) return;
      const { replaceState } = await import('./store.js');
      const newState = await importJSON(file);
      if (!newState) {
        alert('JSONファイルの読み込みに失敗しました');
        return;
      }
      replaceState(newState);
      importFile.value = '';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  _container = document.getElementById('app-content');
  buildNav();
  buildToolbar();
  renderActiveTab();

  // ステート変更時に現在タブを再レンダリング
  document.addEventListener('statechange', () => {
    renderActiveTab();
  });

  // URLハッシュによるタブ状態保持
  if (location.hash) {
    const tabId = location.hash.slice(1);
    if (TABS.find((t) => t.id === tabId)) {
      activateTab(tabId);
    }
  }
  Object.entries(_tabButtons).forEach(([id, btn]) => {
    btn.addEventListener('click', () => {
      history.replaceState(null, '', `#${id}`);
    });
  });
});
