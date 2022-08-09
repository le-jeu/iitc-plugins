// @author         jaiperdu
// @name           Customized highlighter
// @category       Highlighter
// @version        0.1.0
// @description    Configure you own highlighter

const customHighlight = {};
// const STORAGE_KEY = 'plugin-highlight-customized';

function clamp(a, min, max) {
  if (a < min) return min;
  if (a > max) return max;
  return a;
}

class Color {
  constructor(rgb) {
    this.array = rgb;
  }
  toString() {
    return (
      '#' +
      this.array
        .map((v) => clamp(v, 0, 255))
        .map((v) => Math.round(v).toString(16))
        .map((s) => s.slice(-2).padStart(2, '0'))
        .join('')
    );
  }
}

/** Retrieve the value of the property `prop` of the portal */
function getExpr(expr, portal) {
  const prop = expr[1];
  if (prop in portal.options) {
    return portal.options[prop];
  }
  if (prop in portal.options.data) {
    return portal.options.data[prop];
  }
  if (portal.options.data.history && prop in portal.options.data.history) {
    return portal.options.data.history[prop];
  }
  return null;
}

function compareExpr(expr, portal) {
  const [op, e1, e2] = expr;
  const v1 = evaluateExpr(e1, portal);
  const v2 = evaluateExpr(e2, portal);
  switch (op) {
    case '==':
      return v1 === v2;
    case '!=':
      return v1 !== v2;
    case '<':
      return v1 < v2;
    case '<=':
      return v1 <= v2;
    case '>':
      return v1 > v2;
    case '>=':
      return v1 >= v2;
  }
  return false;
}

function booleanExpr(expr, portal) {
  const op = expr[0];
  switch (op) {
    case 'any':
    case 'or':
      for (let i = 1; i < expr.length; i++) {
        if (evaluateExpr(expr[i], portal)) {
          return true;
        }
      }
      return false;
    case 'all':
    case 'and':
      for (let i = 1; i < expr.length; i++) {
        if (!evaluateExpr(expr[i], portal)) {
          return false;
        }
      }
      return true;
    case 'not':
    case '!':
      return !evaluateExpr(expr[1], portal);
    case 'in': {
      const v = evaluateExpr(expr[1], portal);
      const a = evaluateExpr(expr[2], portal);
      return a && !!a.find((a) => a === v);
    }
    default:
    // unknown op
  }
  return false;
}

function caseExpr(expr, portal) {
  for (let i = 1; i < expr.length - 1; i += 2) {
    if (evaluateExpr(expr[i], portal)) return evaluateExpr(expr[i + 1], portal);
  }
  return evaluateExpr(expr[expr.length - 1], portal);
}

function matchExpr(expr, portal) {
  const v = evaluateExpr(expr[1], portal);
  for (let i = 2; i < expr.length - 1; i += 2) {
    if (evaluateExpr(expr[i], portal) === v) return evaluateExpr(expr[i + 1], portal);
  }
  return evaluateExpr(expr[expr.length - 1], portal);
}

function interpolateExpr(expr, portal) {
  // assume expr[1] == ['linear']
  const v = evaluateExpr(expr[2], portal);
  if (v <= expr[3]) return evaluateExpr(expr[4], portal);
  if (expr[expr.length - 2] < v) return evaluateExpr(expr[expr.length - 1], portal);
  let index = 5;
  while (index < expr.length && expr[index] < v) index += 2;
  // last item
  const subValue = evaluateExpr(expr[index - 1], portal);
  const supValue = evaluateExpr(expr[index + 1], portal);
  return interpolate(v, expr[index - 2], expr[index], subValue, supValue);
}

function interpolate(v, inMin, inMax, outMin, outMax) {
  if (typeof outMin === 'number') {
    return outMin + ((outMax - outMin) * (v - inMin)) / (inMax - inMin);
  }
  if (outMin instanceof Array) {
    const ret = [];
    for (let i = 0; i < outMin.length; i++) {
      ret.push(interpolate(v, inMin, inMax, outMin[i], outMax[i]));
    }
    return ret;
  }
  if (outMin instanceof Color) {
    return new Color(interpolate(v, inMin, inMax, outMin.array, outMax.array));
  }
  // error?
  return 0;
}

function rgbExpr(expr, portal) {
  return new Color([evaluateExpr(expr[1], portal), evaluateExpr(expr[2], portal), evaluateExpr(expr[3], portal)]);
}

function sliceExpr(expr, portal) {
  const a = evaluateExpr(expr[1], portal);
  const s = evaluateExpr(expr[2], portal);
  return a.slice(s);
}

function mathExpr(expr, portal) {
  const op = expr[0];
  if (op === '+') {
    let ret = 0;
    for (let i = 1; i < expr.length; i++) {
      ret += evaluateExpr(expr[i], portal);
    }
    return ret;
  }
  if (op === '*') {
    let ret = 1;
    for (let i = 1; i < expr.length; i++) {
      ret *= evaluateExpr(expr[i], portal);
    }
    return ret;
  }
  const v1 = evaluateExpr(expr[1], portal);
  const v2 = evaluateExpr(expr[2], portal);
  switch (op) {
    case '-':
      return v1 - v2;
    case '/':
      return v1 / v2;
    case '%':
      return v1 % v2;
    case '^':
      return v1 ^ v2;
  }
  return null;
}

function literalExpr(expr) {
  return expr[1];
}

function zoomExpr() {
  return window.map.getZoom();
}

customHighlight.operators = {
  get: getExpr,
  literal: literalExpr,
  '+': mathExpr,
  '*': mathExpr,
  '-': mathExpr,
  '/': mathExpr,
  '%': mathExpr,
  '^': mathExpr,
  '==': compareExpr,
  '!=': compareExpr,
  '<': compareExpr,
  '<=': compareExpr,
  '>': compareExpr,
  '>=': compareExpr,
  or: booleanExpr,
  and: booleanExpr,
  any: booleanExpr,
  all: booleanExpr,
  not: booleanExpr,
  '!': booleanExpr,
  in: booleanExpr,
  match: matchExpr,
  case: caseExpr,
  interpolate: interpolateExpr,
  rgb: rgbExpr,
  slice: sliceExpr,
  now: Date.now,
  zoom: zoomExpr,
};

function evaluateExpr(expr, portal) {
  if (expr instanceof Array) {
    const operator = expr[0];
    if (operator in customHighlight.operators) {
      return customHighlight.operators[operator](expr, portal);
    }
    return null;
  }
  return expr;
}

function computeStyle(style, portal) {
  const res = {};
  for (const key in style) {
    const v = evaluateExpr(style[key], portal);
    if (v !== null) {
      if (v instanceof Color) res[key] = v.toString();
      else res[key] = v;
    }
  }
  return res;
}

customHighlight.styles = {
  // examples, this needs a UI to define user based.
  rainbow: {
    color: ['interpolate', ['linear'], ['get', 'level'], 0, ['rgb', 255, 0, 0], 4, ['rgb', 0, 255, 0], 8, ['rgb', 0, 0, 255]],
    fillColor: ['interpolate', ['linear'], ['get', 'level'], 0, ['rgb', 255, 0, 0], 4, ['rgb', 0, 255, 0], 8, ['rgb', 0, 0, 255]],
  },
  transparentCaptured: {
    fillOpacity: ['case', ['get', 'captured'], 0, 0.6],
  },
  scoutVolatile: {
    fillColor: ['case', ['in', 'sc5_p', ['get', 'ornaments']], 'yellow', null],
  },
  missingResonators: {
    fillOpacity: [
      'case',
      ['and', ['!=', ['get', 'team'], 0], ['<', ['get', 'resCount'], 8]],
      ['interpolate', ['linear'], ['get', 'resCount'], 0, 1, 8, 0.15],
      null,
    ],
    dashArray: [
      'case',
      ['and', ['!=', ['get', 'team'], 0], ['<', ['get', 'resCount'], 8]],
      ['slice', ['literal', [1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 100, 0]], ['*', ['get', 'resCount'], 2]],
      null,
    ],
    fillColor: ['case', ['and', ['!=', ['get', 'team'], 0], ['<', ['get', 'resCount'], 8]], 'red', null],
  },
  older: {
    color: [
      'interpolate',
      ['linear'],
      ['-', ['now'], ['get', 'timestamp']],
      0,
      ['rgb', 255, 0, 0],
      17280000,
      ['rgb', 255, 255, 0],
      34560000,
      ['rgb', 0, 255, 0],
      51840000,
      ['rgb', 0, 255, 255],
      69120000,
      ['rgb', 0, 0, 255],
      86400000,
      ['rgb', 255, 0, 255],
      86400001,
      ['rgb', 128, 128, 128],
    ],
    fillColor: [
      'interpolate',
      ['linear'],
      ['-', ['now'], ['get', 'timestamp']],
      0,
      ['rgb', 255, 0, 0],
      17280000,
      ['rgb', 255, 255, 0],
      34560000,
      ['rgb', 0, 255, 0],
      51840000,
      ['rgb', 0, 255, 255],
      69120000,
      ['rgb', 0, 0, 255],
      86400000,
      ['rgb', 255, 0, 255],
      86400001,
      ['rgb', 128, 128, 128],
    ],
  },
};

/* exported setup */
function setup() {
  window.addPortalHighlighter('Custom Highlighter', function (data) {
    const portal = data.portal;
    const style = computeStyle(customHighlight.styles.older, portal);
    portal.setStyle(style);
  });
}
