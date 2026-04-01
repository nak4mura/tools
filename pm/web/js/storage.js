/* globals YM */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    var constants = require('./constants.js');
    module.exports = factory(constants);
  } else {
    root.YM = root.YM || {};
    root.YM.storage = factory(root.YM.constants);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function (constants) {
  'use strict';

  var STORAGE_KEY = constants.STORAGE_KEY;
  var SCHEMA_VERSION = constants.SCHEMA_VERSION;
  var DEFAULT_PROCESSES = constants.DEFAULT_PROCESSES;
  var DEFAULT_CONFIG = constants.DEFAULT_CONFIG;
  var DEFAULT_HOLIDAYS = constants.DEFAULT_HOLIDAYS;

  function createDefaultState() {
    return {
      version: SCHEMA_VERSION,
      config: Object.assign({}, DEFAULT_CONFIG, { fiscalYear: new Date().getFullYear() }),
      processes: DEFAULT_PROCESSES.map(function (p) { return Object.assign({}, p); }),
      members: [],
      holidays: DEFAULT_HOLIDAYS.map(function (h) { return Object.assign({}, h); }),
      workload: [],
    };
  }

  function serializeState(state) {
    return JSON.stringify(state);
  }

  function deserializeState(json) {
    try {
      var parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !('version' in parsed)) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultState();
      var state = deserializeState(raw);
      return state || createDefaultState();
    } catch (e) {
      return createDefaultState();
    }
  }

  function save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, serializeState(state));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }

  function exportJSON(state, filename) {
    filename = filename || 'yamazumi_data.json';
    var json = serializeState(state);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return blob;
  }

  function importJSON(file) {
    return new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onload = function (e) { resolve(deserializeState(e.target.result)); };
      reader.onerror = function () { resolve(null); };
      reader.readAsText(file, 'utf-8');
    });
  }

  return {
    createDefaultState: createDefaultState,
    serializeState: serializeState,
    deserializeState: deserializeState,
    load: load,
    save: save,
    exportJSON: exportJSON,
    importJSON: importJSON,
  };
}));
