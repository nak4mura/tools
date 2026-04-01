/**
 * ステート管理モジュール
 * 単一のミュータブルオブジェクトを保持し、変更時にlocalStorageへ自動保存
 * および 'statechange' カスタムイベントを発火する。
 */
import { load, save } from './storage.js';
import { SAMPLE_MEMBERS, SAMPLE_WORKLOAD } from './constants.js';

let _state = null;

function getState() {
  if (!_state) _state = load();
  return _state;
}

function notify() {
  save(_state);
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('statechange'));
  }
}

/** ステート全体を返す（読み取り専用として扱うこと） */
export function getSnapshot() {
  return getState();
}

/** ステート全体を置き換える（インポート時） */
export function replaceState(newState) {
  _state = newState;
  notify();
}

// ---- Config ----

export function setConfig(updates) {
  getState().config = { ...getState().config, ...updates };
  notify();
}

// ---- Processes ----

export function setProcesses(processes) {
  getState().processes = processes;
  notify();
}

export function addProcess(process) {
  getState().processes.push(process);
  notify();
}

export function updateProcess(id, updates) {
  const idx = getState().processes.findIndex((p) => p.id === id);
  if (idx !== -1) {
    getState().processes[idx] = { ...getState().processes[idx], ...updates };
    notify();
  }
}

export function deleteProcess(id) {
  _state.processes = _state.processes.filter((p) => p.id !== id);
  notify();
}

// ---- Members ----

export function setMembers(members) {
  getState().members = members;
  notify();
}

export function addMember(member) {
  getState().members.push(member);
  notify();
}

export function updateMember(id, updates) {
  const idx = getState().members.findIndex((m) => m.id === id);
  if (idx !== -1) {
    getState().members[idx] = { ...getState().members[idx], ...updates };
    notify();
  }
}

export function deleteMember(id) {
  _state.members = _state.members.filter((m) => m.id !== id);
  notify();
}

// ---- Holidays ----

export function setHolidays(holidays) {
  getState().holidays = holidays;
  notify();
}

export function addHoliday(holiday) {
  getState().holidays.push(holiday);
  notify();
}

export function deleteHoliday(date) {
  _state.holidays = _state.holidays.filter((h) => h.date !== date);
  notify();
}

// ---- Workload ----

let _rowCounter = 0;

function nextRowId() {
  _rowCounter++;
  return `row_${Date.now()}_${_rowCounter}`;
}

export function addWorkloadRow(memberId, processId) {
  const row = { id: nextRowId(), memberId, processId, hours: {} };
  getState().workload.push(row);
  notify();
  return row.id;
}

export function updateWorkloadHours(rowId, yearMonth, hours) {
  const row = getState().workload.find((r) => r.id === rowId);
  if (row) {
    if (hours === null || hours === undefined || hours === '') {
      delete row.hours[yearMonth];
    } else {
      row.hours[yearMonth] = Number(hours);
    }
    notify();
  }
}

export function updateWorkloadRow(rowId, updates) {
  const idx = getState().workload.findIndex((r) => r.id === rowId);
  if (idx !== -1) {
    getState().workload[idx] = { ...getState().workload[idx], ...updates };
    notify();
  }
}

export function deleteWorkloadRow(rowId) {
  _state.workload = _state.workload.filter((r) => r.id !== rowId);
  notify();
}

export function duplicateWorkloadRow(rowId) {
  const original = getState().workload.find((r) => r.id === rowId);
  if (original) {
    const copy = { ...original, id: nextRowId(), hours: { ...original.hours } };
    const idx = getState().workload.indexOf(original);
    getState().workload.splice(idx + 1, 0, copy);
    notify();
    return copy.id;
  }
  return null;
}

export function clearAllWorkload() {
  _state.workload = [];
  notify();
}

export function insertSampleData() {
  const state = getState();

  // サンプルメンバー追加（既存でなければ）
  SAMPLE_MEMBERS.forEach((m) => {
    if (!state.members.find((x) => x.id === m.id)) {
      state.members.push({ ...m });
    }
  });

  // サンプル工数追加
  const year = state.config.fiscalYear;
  const startMonth = state.config.fiscalStartMonth;
  SAMPLE_WORKLOAD.forEach((entry) => {
    const hours = {};
    Object.entries(entry.hours).forEach(([monthOffset, h]) => {
      const m = ((startMonth - 1 + parseInt(monthOffset) - 1) % 12) + 1;
      const y = year + Math.floor((startMonth - 1 + parseInt(monthOffset) - 1) / 12);
      hours[`${y}/${m}`] = h;
    });
    state.workload.push({
      id: nextRowId(),
      memberId: entry.memberId,
      processId: entry.processId,
      hours,
    });
  });

  notify();
}
