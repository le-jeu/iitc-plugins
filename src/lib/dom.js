export function createElement(tagName, attrs = {}, ...children) {
  if (tagName === 'fragment') return children;
  attrs = attrs || {};
  const rawHtml = attrs.rawHtml;
  delete attrs.rawHtml;
  const elem = document.createElement(tagName);
  // dataset
  if (attrs.dataset) {
    for (const key in attrs.dataset) elem.dataset[key] = attrs.dataset[key];
    delete attrs.dataset;
  }
  // events
  for (const key in attrs) {
    if (key.startsWith('on')) {
      elem.addEventListener(key.slice(2), attrs[key]);
      delete attrs[key];
    }
  }
  Object.assign(elem, attrs);
  if (rawHtml) {
    elem.innerHTML = rawHtml;
    return elem;
  }
  for (const child of children.flat()) {
    // cast to string to display "undefined" or "null"
    if (child !== undefined && child !== null) elem.append(child);
  }
  return elem;
}
