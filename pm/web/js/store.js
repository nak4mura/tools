/* globals YM */
(function (root) {
  'use strict';

  var storage = root.YM.storage;
  var constants = root.YM.constants;

  var _state = null;
  var _rowCounter = 0;

  function getState() {
    if (!_state) _state = storage.load();
    return _state;
  }

  function notify() {
    storage.save(_state);
    document.dispatchEvent(new CustomEvent('statechange'));
  }

  function nextRowId() {
    _rowCounter++;
    return 'row_' + Date.now() + '_' + _rowCounter;
  }

  var store = {
    getSnapshot: function () { return getState(); },

    replaceState: function (newState) {
      _state = newState;
      notify();
    },

    // Config
    setConfig: function (updates) {
      Object.assign(getState().config, updates);
      notify();
    },

    // Processes
    setProcesses: function (processes) { getState().processes = processes; notify(); },
    addProcess: function (proc) { getState().processes.push(proc); notify(); },
    updateProcess: function (id, updates) {
      var idx = getState().processes.findIndex(function (p) { return p.id === id; });
      if (idx !== -1) { Object.assign(getState().processes[idx], updates); notify(); }
    },
    deleteProcess: function (id) {
      _state.processes = _state.processes.filter(function (p) { return p.id !== id; });
      notify();
    },

    // Members
    setMembers: function (members) { getState().members = members; notify(); },
    addMember: function (member) { getState().members.push(member); notify(); },
    updateMember: function (id, updates) {
      var idx = getState().members.findIndex(function (m) { return m.id === id; });
      if (idx !== -1) { Object.assign(getState().members[idx], updates); notify(); }
    },
    deleteMember: function (id) {
      _state.members = _state.members.filter(function (m) { return m.id !== id; });
      notify();
    },

    // Holidays
    setHolidays: function (holidays) { getState().holidays = holidays; notify(); },
    addHoliday: function (holiday) { getState().holidays.push(holiday); notify(); },
    deleteHoliday: function (date) {
      _state.holidays = _state.holidays.filter(function (h) { return h.date !== date; });
      notify();
    },

    // Workload
    addWorkloadRow: function (memberId, processId) {
      var row = { id: nextRowId(), memberId: memberId, processId: processId, hours: {} };
      getState().workload.push(row);
      notify();
      return row.id;
    },

    updateWorkloadHours: function (rowId, yearMonth, hours) {
      var row = getState().workload.find(function (r) { return r.id === rowId; });
      if (row) {
        if (hours === null || hours === undefined || hours === '') {
          delete row.hours[yearMonth];
        } else {
          row.hours[yearMonth] = Number(hours);
        }
        notify();
      }
    },

    updateWorkloadRow: function (rowId, updates) {
      var idx = getState().workload.findIndex(function (r) { return r.id === rowId; });
      if (idx !== -1) { Object.assign(getState().workload[idx], updates); notify(); }
    },

    deleteWorkloadRow: function (rowId) {
      _state.workload = _state.workload.filter(function (r) { return r.id !== rowId; });
      notify();
    },

    duplicateWorkloadRow: function (rowId) {
      var original = getState().workload.find(function (r) { return r.id === rowId; });
      if (original) {
        var copy = Object.assign({}, original, { id: nextRowId(), hours: Object.assign({}, original.hours) });
        var idx = getState().workload.indexOf(original);
        getState().workload.splice(idx + 1, 0, copy);
        notify();
        return copy.id;
      }
      return null;
    },

    clearAllWorkload: function () {
      _state.workload = [];
      notify();
    },

    insertSampleData: function () {
      var state = getState();
      constants.SAMPLE_MEMBERS.forEach(function (m) {
        if (!state.members.find(function (x) { return x.id === m.id; })) {
          state.members.push(Object.assign({}, m));
        }
      });
      var year = state.config.fiscalYear;
      var startMonth = state.config.fiscalStartMonth;
      constants.SAMPLE_WORKLOAD.forEach(function (entry) {
        var hours = {};
        Object.entries(entry.hours).forEach(function (pair) {
          var monthOffset = parseInt(pair[0], 10);
          var h = pair[1];
          var m = ((startMonth - 1 + monthOffset - 1) % 12) + 1;
          var y = year + Math.floor((startMonth - 1 + monthOffset - 1) / 12);
          hours[y + '/' + m] = h;
        });
        state.workload.push({ id: nextRowId(), memberId: entry.memberId, processId: entry.processId, hours: hours });
      });
      notify();
    },
  };

  root.YM.store = store;

}(typeof globalThis !== 'undefined' ? globalThis : this));
