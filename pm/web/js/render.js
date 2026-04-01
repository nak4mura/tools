/* globals YM */
(function (root) {
  'use strict';

  function el(tag, attrs) {
    var children = Array.prototype.slice.call(arguments, 2);
    var elem = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var val = attrs[key];
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
    }
    children.forEach(function (child) {
      if (child === null || child === undefined) return;
      elem.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return elem;
  }

  function clearAndAppend(container, node) {
    container.innerHTML = '';
    container.appendChild(node);
  }

  function formatHours(hours) {
    if (!hours && hours !== 0) return '';
    return String(hours);
  }

  function getProcessColor(processId, state) {
    var process = state.processes.find(function (p) { return p.id === processId; });
    return process ? process.color : '#cccccc';
  }

  function arcPath(cx, cy, r, startAngle, endAngle) {
    var x1 = cx + r * Math.cos(startAngle);
    var y1 = cy + r * Math.sin(startAngle);
    var x2 = cx + r * Math.cos(endAngle);
    var y2 = cy + r * Math.sin(endAngle);
    var largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0;
    return 'M ' + cx + ' ' + cy + ' L ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + largeArc + ' 1 ' + x2 + ' ' + y2 + ' Z';
  }

  root.YM = root.YM || {};
  root.YM.render = { el: el, clearAndAppend: clearAndAppend, formatHours: formatHours, getProcessColor: getProcessColor, arcPath: arcPath };

}(typeof globalThis !== 'undefined' ? globalThis : this));
