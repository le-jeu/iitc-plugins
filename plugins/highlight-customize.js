// @author         jaiperdu
// @name           Customized highlighter
// @category       Highlighter
// @version        0.2.1
// @description    Configure you own highlighter

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

function literalExpr(expr) {
  return expr[1];
}

function zoomExpr() {
  return window.map.getZoom();
}

const customHighlight = {};

customHighlight.operators = {
  // value
  get: getExpr,
  literal: literalExpr,
  now: Date.now,
  zoom: zoomExpr,
  // math
  '+': mathExpr,
  '*': mathExpr,
  '-': mathExpr,
  '/': mathExpr,
  '%': mathExpr,
  '^': mathExpr,
  // comparison
  '==': compareExpr,
  '!=': compareExpr,
  '<': compareExpr,
  '<=': compareExpr,
  '>': compareExpr,
  '>=': compareExpr,
  // boolean
  or: booleanExpr,
  and: booleanExpr,
  any: booleanExpr,
  all: booleanExpr,
  not: booleanExpr,
  '!': booleanExpr,
  in: booleanExpr,
  // switch-like
  match: matchExpr,
  // if/elif/else
  case: caseExpr,
  interpolate: interpolateExpr,
  // color
  rgb: rgbExpr,
  // array
  slice: sliceExpr,
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

const exampleStyles = {
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
  custom: {},
};

function showDialog() {
  const div = document.createElement('div');

  const styles = customHighlight.settings.styles;
  const selected = customHighlight.settings.selected;

  const selectStyle = document.createElement('select');
  for (const name in styles) {
    const option = document.createElement('option');
    option.textContent = name;
    option.value = name;
    selectStyle.appendChild(option);
  }
  if (selected.length) selectStyle.value = selected[0];
  div.appendChild(selectStyle);

  const styleInput = document.createElement('textarea');
  if (selected.length) styleInput.value = JSON.stringify(styles[selected[0]], null, 2);
  div.appendChild(styleInput);

  const desc = document.createElement('div');
  desc.innerHTML =
    "Style description is derived from <a 'href=https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/'>Expression for MapBox Style</a>. Give a look to the examples for inspiration.";
  div.appendChild(desc);

  selectStyle.addEventListener('change', function () {
    const value = selectStyle.value;
    if (value in styles) {
      styleInput.value = JSON.stringify(styles[value], null, 2);
      // one element for now
      selected.splice(0, selected.length, value);
    }
  });

  const buttons = {
    Apply: function () {
      try {
        // need some validation
        const style = JSON.parse(styleInput.value);
        for (const name of selected) {
          styles[name] = style;
          styleInput.value = JSON.stringify(styles[name], null, 2);
          window.resetHighlightedPortals();
        }
        localStorage[STORAGE_KEY] = JSON.stringify(customHighlight.settings);
      } catch (e) {
        console.error(e);
        alert("Couldn't parse the style");
      }
    },
    Reset: function () {
      for (const name of selected) {
        styles[name] = exampleStyles[name];
        styleInput.value = JSON.stringify(styles[name], null, 2);
      }
    },
    Close: function () {
      $(this).dialog('close');
    },
  };

  window.dialog({
    id: 'plugin-custom-highlight',
    html: div,
    title: 'Change Custom highlighter style',
    width: 'auto',
    buttons: buttons,
  });
}

const STORAGE_KEY = 'plugin-highlight-customized';

/* exported setup */
function setup() {
  $('<style>')
    .prop('type', 'text/css')
    .html(
      '#dialog-plugin-custom-highlight select { display: block }\
           #dialog-plugin-custom-highlight textarea { width: 100%; min-height:250px; font-family: monospace }'
    )
    .appendTo('head');

  customHighlight.settings = {
    selected: ['older'],
    styles: Object.assign({}, exampleStyles),
  };
  try {
    const localSettings = JSON.parse(localStorage[STORAGE_KEY]);
    customHighlight.settings.selected = localSettings.selected;
    customHighlight.settings.styles = Object.assign(customHighlight.settings.styles, localSettings.styles);
  } catch (_) {
    // pass
  }

  const toolButton = document.getElementById('toolbox').appendChild(document.createElement('a'));
  toolButton.textContent = 'Custom HL';
  toolButton.addEventListener('click', showDialog);

  window.addPortalHighlighter('Custom Highlighter', function (data) {
    const portal = data.portal;
    for (const name of customHighlight.settings.selected) {
      if (name in customHighlight.settings.styles) {
        const style = customHighlight.settings.styles[name];
        portal.setStyle(computeStyle(style, portal));
      }
    }
  });
}
