/**
 * DOM生成ヘルパー
 */

/**
 * HTML要素を生成するヘルパー。
 * @param {string} tag
 * @param {object} attrs - 属性オブジェクト（class, id, style等）
 * @param {...(Node|string)} children
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, ...children) {
  const elem = document.createElement(tag);
  Object.entries(attrs).forEach(([key, val]) => {
    if (key === 'class') {
      elem.className = val;
    } else if (key === 'style' && typeof val === 'object') {
      Object.assign(elem.style, val);
    } else if (key.startsWith('on') && typeof val === 'function') {
      elem.addEventListener(key.slice(2).toLowerCase(), val);
    } else if (val !== null && val !== undefined && val !== false) {
      elem.setAttribute(key, val);
    }
  });
  children.forEach((child) => {
    if (child === null || child === undefined) return;
    elem.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  });
  return elem;
}

/**
 * コンテナの中身を消してノードを追加する。
 * @param {HTMLElement} container
 * @param {Node} node
 */
export function clearAndAppend(container, node) {
  container.innerHTML = '';
  container.appendChild(node);
}

/**
 * 工数を表示用にフォーマットする。
 * @param {number} hours
 * @returns {string}
 */
export function formatHours(hours) {
  if (!hours && hours !== 0) return '';
  return String(hours);
}

/**
 * ユニークIDを生成する。
 * @param {string} prefix
 * @returns {string}
 */
export function uid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * 工程IDから工程色を取得する。
 * @param {string} processId
 * @param {object} state
 * @returns {string} CSSカラー文字列
 */
export function getProcessColor(processId, state) {
  const process = state.processes.find((p) => p.id === processId);
  return process ? process.color : '#cccccc';
}

/**
 * SVGの弧パスを生成する（円グラフ用）。
 * @param {number} cx - 中心X
 * @param {number} cy - 中心Y
 * @param {number} r - 半径
 * @param {number} startAngle - 開始角度（ラジアン）
 * @param {number} endAngle - 終了角度（ラジアン）
 * @returns {string} SVGパスd属性
 */
export function arcPath(cx, cy, r, startAngle, endAngle) {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}
