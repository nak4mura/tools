import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// constants を先に読み込む（storage が依存しているため）
require('../js/constants.js');
const storage = require('../js/storage.js');
const { createDefaultState, serializeState, deserializeState } = storage;

// localStorage モック
globalThis.localStorage = (() => {
  const store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
})();

describe('createDefaultState', () => {
  test('デフォルト状態はversionフィールドを含む', () => {
    const state = createDefaultState();
    assert.ok('version' in state);
    assert.equal(state.version, 1);
  });
  test('デフォルト状態はconfigフィールドを含む', () => {
    const state = createDefaultState();
    assert.ok('config' in state);
    assert.ok('fiscalYear' in state.config);
    assert.ok('fiscalStartMonth' in state.config);
    assert.ok('hoursPerDay' in state.config);
    assert.ok('overloadThreshold' in state.config);
  });
  test('デフォルト状態は5つの工程を含む', () => {
    const state = createDefaultState();
    assert.ok(Array.isArray(state.processes));
    assert.equal(state.processes.length, 5);
  });
  test('デフォルト状態のworkloadは空配列', () => {
    const state = createDefaultState();
    assert.ok(Array.isArray(state.workload));
    assert.equal(state.workload.length, 0);
  });
});

describe('serializeState / deserializeState', () => {
  test('シリアライズ→デシリアライズでデータが保たれる', () => {
    const state = createDefaultState();
    state.workload.push({ id: 'row_1', memberId: 'M001', processId: 'REQ', hours: { '2024/4': 40 } });
    const json = serializeState(state);
    const restored = deserializeState(json);
    assert.equal(restored.workload.length, 1);
    assert.equal(restored.workload[0].hours['2024/4'], 40);
  });
  test('不正なJSON文字列はnullを返す', () => {
    assert.equal(deserializeState('not valid json'), null);
  });
  test('versionフィールドがない場合はnullを返す', () => {
    assert.equal(deserializeState('{"config":{}}'), null);
  });
});
