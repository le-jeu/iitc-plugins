export function Fragment(attrs) {
  const fragment = document.createDocumentFragment();
  recursiveAppend(fragment, attrs.children);
  return fragment;
}

function recursiveAppend(element, children) {
  // cast to string to display "undefined" or "null"
  if (children === undefined || children === null) return;
  if (Array.isArray(children)) {
    for (const child of children) recursiveAppend(element, child);
  } else {
    element.append(children);
  }
}

export function jsx(tagName, attrs) {
  if (typeof tagName === 'function') return tagName(attrs);
  const children = attrs.children;
  delete attrs.children;
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
  recursiveAppend(elem, children);
  return elem;
}

export const jsxs = jsx;
