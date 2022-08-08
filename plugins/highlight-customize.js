// @author         jaiperdu
// @name           Customized highlighter
// @category       Highlighter
// @version        0.1.0
// @description    Configure you own highlighter

const customHighlight = {};
// const STORAGE_KEY = 'plugin-highlight-customized';

function compareExpr(expr, portal) {
  const [op, e1, e2] = expr;
  const v1 = genericExpr(e1, portal);
  const v2 = genericExpr(e2, portal);
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

function genericBoolean(expr, portal) {
  if (typeof expr === 'boolean') return expr;
  if (expr instanceof Array) {
    const op = expr[0];
    switch (op) {
      case 'any':
      case 'or':
        for (let i = 1; i < expr.length; i++) {
          if (genericBoolean(expr[i], portal)) {
            return true;
          }
        }
        return false;
      case 'all':
      case 'and':
        for (let i = 1; i < expr.length; i++) {
          if (!genericBoolean(expr[i], portal)) {
            return false;
          }
        }
        return true;
      case 'not':
      case '!':
        return !genericBoolean(expr[1], portal);
      case '==':
      case '!=':
      case '<':
      case '<=':
      case '>':
      case '>=':
        return compareExpr(expr, portal);
      case 'in': {
        const v = genericExpr(expr[1], portal);
        const a = genericExpr(expr[2], portal);
        return a && !!a.find((a) => a === v);
      }
      case 'get':
        return getExpr(expr[1], portal);
      default:
      // unknown op
    }
    return false;
  }
  return false;
}

function getExpr(prop, portal) {
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

function clamp(a, min, max) {
  if (a < min) return min;
  if (a > max) return max;
  return a;
}

function caseExpr(expr, portal) {
  for (let i = 1; i < expr.length - 1; i += 2) {
    if (genericBoolean(expr[i], portal)) return genericExpr(expr[i + 1], portal);
  }
  return genericExpr(expr[expr.length - 1], portal);
}

function matchExpr(expr, portal) {
  const v = genericExpr(expr[1], portal);
  for (let i = 2; i < expr.length - 1; i += 2) {
    if (genericExpr(expr[i], portal) === v) return genericExpr(expr[i + 1], portal);
  }
  return genericExpr(expr[expr.length - 1], portal);
}

function interpolateExpr(expr, portal) {
  // assume expr[1] == 'linear'
  const v = genericExpr(expr[2], portal);
  if (v <= expr[3]) return genericExpr(expr[4], portal);
  if (expr[expr.length - 2] < v) return genericExpr(expr[expr.length - 1], portal);
  let index = 5;
  while (index < expr.length && expr[index] < v) index += 2;
  // last item
  const subValue = genericExpr(expr[index - 1], portal);
  const supValue = genericExpr(expr[index + 1], portal);
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
  // error?
  return 0;
}

function rgbExpr(expr, portal) {
  const components = genericExpr(expr[1], portal)
    .map((v) => clamp(v, 0, 255))
    .map((v) => Math.round(v).toString(16))
    .map((s) => s.slice(-2).padStart(2, '0'))
    .join('');
  return '#' + components;
}

customHighlight.operators = {
  get: (expr, portal) => getExpr(expr[1], portal),
  literal: (expr) => expr[1],
  '+': (expr, portal) => expr.slice(1).reduce((a, b) => a + +genericExpr(b, portal), 0),
  '*': (expr, portal) => expr.slice(1).reduce((a, b) => a * +genericExpr(b, portal), 1),
  '-': (expr, portal) => +genericExpr(expr[1], portal) - +genericExpr(expr[2], portal),
  '/': (expr, portal) => +genericExpr(expr[1], portal) / +genericExpr(expr[2], portal),
  '%': (expr, portal) => +genericExpr(expr[1], portal) % +genericExpr(expr[2], portal),
  match: matchExpr,
  case: caseExpr,
  interpolate: interpolateExpr,
  rgb: rgbExpr, // note: this is different from mapbox style,
  slice: (expr, portal) => genericExpr(expr[1], portal).slice(genericExpr(expr[2], portal)),
  now: () => Date.now(),
  zoom: () => window.map.getZoom(),
};

function genericExpr(expr, portal) {
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
    const v = genericExpr(style[key], portal);
    if (v !== null) res[key] = v;
  }
  return res;
}

customHighlight.styles = {
  // examples, this needs a UI to define user based.
  rainbow: {
    color: ['rgb', ['interpolate', 'linear', ['get', 'level'], 0, ['literal', [255, 0, 0]], 4, ['literal', [0, 255, 0]], 8, ['literal', [0, 0, 255]]]],
    fillColor: ['rgb', ['interpolate', 'linear', ['get', 'level'], 0, ['literal', [255, 0, 0]], 4, ['literal', [0, 255, 0]], 8, ['literal', [0, 0, 255]]]],
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
      ['interpolate', 'linear', ['get', 'resCount'], 0, 1, 8, 0.15],
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
};

/* exported setup */
function setup() {
  window.addPortalHighlighter('Custom Highlighter', function (data) {
    const portal = data.portal;
    const style = computeStyle(customHighlight.styles.missingResonators, portal);
    portal.setStyle(style);
  });
}
