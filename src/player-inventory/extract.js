let itemsMap = null;

function extractItemsMap() {
  const minified = new RegExp('^[a-zA-Z$][a-zA-Z$0-9]?$');
  for (var topLevel in window) {
    if (minified.test(topLevel)) {
      const topObject = window[topLevel];
      if (topObject && typeof topObject === 'object') {
        if ('EMITTER_A' in topObject) return topObject;
      }
    }
  }
}

export function getItemsMap() {
  if (!itemsMap) itemsMap = extractItemsMap();
  return itemsMap || {};
}

export function getItemName(t) {
  return getItemsMap()[t] || t;
}
