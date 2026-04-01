/**
 * ストレージモジュール
 * localStorage読み書き + JSONエクスポート/インポート
 */
import { DEFAULT_PROCESSES, DEFAULT_CONFIG, DEFAULT_HOLIDAYS, STORAGE_KEY, SCHEMA_VERSION } from './constants.js';

/**
 * デフォルト状態を生成する。
 * @returns {object}
 */
export function createDefaultState() {
  return {
    version: SCHEMA_VERSION,
    config: { ...DEFAULT_CONFIG, fiscalYear: new Date().getFullYear() },
    processes: DEFAULT_PROCESSES.map((p) => ({ ...p })),
    members: [],
    holidays: DEFAULT_HOLIDAYS.map((h) => ({ ...h })),
    workload: [],
  };
}

/**
 * 状態をJSON文字列にシリアライズする。
 * @param {object} state
 * @returns {string}
 */
export function serializeState(state) {
  return JSON.stringify(state);
}

/**
 * JSON文字列をデシリアライズする。
 * 不正な場合はnullを返す。
 * @param {string} json
 * @returns {object|null}
 */
export function deserializeState(json) {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || !('version' in parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * localStorageからステートを読み込む。
 * 存在しない場合はデフォルト状態を返す。
 * @returns {object}
 */
export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const state = deserializeState(raw);
    return state ?? createDefaultState();
  } catch {
    return createDefaultState();
  }
}

/**
 * ステートをlocalStorageに保存する。
 * @param {object} state
 */
export function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, serializeState(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

/**
 * ステートをJSONファイルとしてダウンロードする（ブラウザ専用）。
 * @param {object} state
 * @param {string} filename
 */
export function exportJSON(state, filename = 'yamazumi_data.json') {
  const json = serializeState(state);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return blob;
}

/**
 * JSONファイルを読み込んでステートを返す。
 * @param {File} file
 * @returns {Promise<object|null>}
 */
export async function importJSON(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const state = deserializeState(e.target.result);
      resolve(state);
    };
    reader.onerror = () => resolve(null);
    reader.readAsText(file, 'utf-8');
  });
}
