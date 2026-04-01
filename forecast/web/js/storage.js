/* globals FC */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    var constants = require('./constants.js');
    module.exports = factory(constants);
  } else {
    root.FC = root.FC || {};
    root.FC.storage = factory(root.FC.constants);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function (constants) {
  'use strict';

  var STORAGE_KEY = constants.STORAGE_KEY;
  var SCHEMA_VERSION = constants.SCHEMA_VERSION;
  var DEFAULT_CONFIG = constants.DEFAULT_CONFIG;

  function createDefaultState() {
    return {
      version: SCHEMA_VERSION,
      config: Object.assign({}, DEFAULT_CONFIG, { fiscalYear: new Date().getFullYear() }),
      processes: [],
      members: [],
      assignments: [],
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
    filename = filename || 'forecast_data.json';
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
