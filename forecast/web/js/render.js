/* globals FC */
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

  function getProcessColor(processId, state) {
    var process = state.processes.find(function (p) { return p.id === processId; });
    return process ? process.color : '#cccccc';
  }

  root.FC = root.FC || {};
  root.FC.render = { el: el, clearAndAppend: clearAndAppend, getProcessColor: getProcessColor };

}(typeof globalThis !== 'undefined' ? globalThis : this));
