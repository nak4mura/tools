/* globals FC */
(function (root) {
  'use strict';

  var storage = root.FC.storage;
  var constants = root.FC.constants;

  var _state = null;
  var _counter = 0;

  function getState() {
    if (!_state) _state = storage.load();
    return _state;
  }

  function notify() {
    storage.save(_state);
    document.dispatchEvent(new CustomEvent('statechange'));
  }

  function nextId(prefix) {
    _counter++;
    return prefix + '_' + Date.now() + '_' + _counter;
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
    addProcess: function (proc) {
      var p = Object.assign({ id: nextId('P') }, proc);
      getState().processes.push(p);
      notify();
      return p.id;
    },
    updateProcess: function (id, updates) {
      var idx = getState().processes.findIndex(function (p) { return p.id === id; });
      if (idx !== -1) { Object.assign(getState().processes[idx], updates); notify(); }
    },
    deleteProcess: function (id) {
      var s = getState();
      s.processes = s.processes.filter(function (p) { return p.id !== id; });
      s.assignments = s.assignments.filter(function (a) { return a.processId !== id; });
      notify();
    },

    // Members
    addMember: function (member) {
      var m = Object.assign({ id: nextId('M') }, member);
      getState().members.push(m);
      notify();
      return m.id;
    },
    updateMember: function (id, updates) {
      var idx = getState().members.findIndex(function (m) { return m.id === id; });
      if (idx !== -1) { Object.assign(getState().members[idx], updates); notify(); }
    },
    deleteMember: function (id) {
      var s = getState();
      s.members = s.members.filter(function (m) { return m.id !== id; });
      s.assignments = s.assignments.filter(function (a) { return a.memberId !== id; });
      notify();
    },

    // Assignments
    addAssignment: function (memberId, processId) {
      var a = { id: nextId('a'), memberId: memberId, processId: processId, hoursPerMonth: {} };
      getState().assignments.push(a);
      notify();
      return a.id;
    },
    updateAssignmentHours: function (assignmentId, yearMonth, hours) {
      var row = getState().assignments.find(function (a) { return a.id === assignmentId; });
      if (row) {
        if (hours === null || hours === undefined || hours === '') {
          delete row.hoursPerMonth[yearMonth];
        } else {
          row.hoursPerMonth[yearMonth] = Number(hours);
        }
        notify();
      }
    },
    updateAssignment: function (id, updates) {
      var idx = getState().assignments.findIndex(function (a) { return a.id === id; });
      if (idx !== -1) { Object.assign(getState().assignments[idx], updates); notify(); }
    },
    deleteAssignment: function (id) {
      var s = getState();
      s.assignments = s.assignments.filter(function (a) { return a.id !== id; });
      notify();
    },
    duplicateAssignment: function (id) {
      var original = getState().assignments.find(function (a) { return a.id === id; });
      if (original) {
        var copy = Object.assign({}, original, {
          id: nextId('a'),
          hoursPerMonth: Object.assign({}, original.hoursPerMonth),
        });
        var idx = getState().assignments.indexOf(original);
        getState().assignments.splice(idx + 1, 0, copy);
        notify();
        return copy.id;
      }
      return null;
    },
    clearAllAssignments: function () {
      getState().assignments = [];
      notify();
    },

    insertSampleData: function () {
      var state = getState();
      constants.SAMPLE_PROCESSES.forEach(function (p) {
        if (!state.processes.find(function (x) { return x.id === p.id; })) {
          state.processes.push(Object.assign({}, p));
        }
      });
      constants.SAMPLE_MEMBERS.forEach(function (m) {
        if (!state.members.find(function (x) { return x.id === m.id; })) {
          state.members.push(Object.assign({}, m));
        }
      });
      constants.SAMPLE_ASSIGNMENTS.forEach(function (a) {
        if (!state.assignments.find(function (x) { return x.id === a.id; })) {
          state.assignments.push(Object.assign({}, a, {
            hoursPerMonth: Object.assign({}, a.hoursPerMonth),
          }));
        }
      });
      notify();
    },
  };

  root.FC.store = store;

}(typeof globalThis !== 'undefined' ? globalThis : this));
