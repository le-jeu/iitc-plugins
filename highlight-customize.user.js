
// ==UserScript==
// @author        jaiperdu
// @name          IITC plugin: Customized highlighter
// @category      Highlighter
// @version       0.2.3
// @description   Configure you own highlighter
// @id            highlight-customize
// @namespace     https://github.com/IITC-CE/ingress-intel-total-conversion
// @updateURL     https://le-jeu.github.io/iitc-plugins/highlight-customize.user.js
// @downloadURL   https://le-jeu.github.io/iitc-plugins/highlight-customize.user.js
// @match         https://intel.ingress.com/*
// @grant         none
// ==/UserScript==
function wrapper(plugin_info) {

// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

function clamp(a, min, max) {
  if (a < min) return min;
  if (a > max) return max;
  return a;
}

class Color {
  constructor(rgb) {
    if (rgb instanceof Array && rgb.length === 3) this.array = rgb.map((v) => +v | 0);
    else this.array = [0, 0, 0];
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
  if (expr.length !== 3) return false;
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
      return a instanceof Array && !!a.find((a) => a === v);
    }
  }

  return false;
}

function caseExpr(expr, portal) {
  if (expr.length < 2) return null;
  for (let i = 1; i < expr.length - 1; i += 2) {
    if (evaluateExpr(expr[i], portal)) return evaluateExpr(expr[i + 1], portal);
  }
  return evaluateExpr(expr[expr.length - 1], portal);
}

function matchExpr(expr, portal) {
  if (expr.length < 2) return null;
  const v = evaluateExpr(expr[1], portal);

  for (let i = 2; i < expr.length - 1; i += 2) {
    if (evaluateExpr(expr[i], portal) === v) return evaluateExpr(expr[i + 1], portal);
  }

  return evaluateExpr(expr[expr.length - 1], portal);
}

function interpolateExpr(expr, portal) {
  if (expr.length < 5) return 0;
  // length should be odd, ignore last element otherwise
  const length = expr.length & 1 ? expr.length : expr.length - 1;
  // interpolation steps should be literal numbers
  for (let i = 3; i < length; i += 2) if (typeof expr[i] !== 'number') return null;
  // assume expr[1] == ['linear']
  const v = evaluateExpr(expr[2], portal);
  if (typeof v !== 'number') return null;
  if (v <= expr[3]) return evaluateExpr(expr[4], portal);
  if (expr[length - 2] < v) return evaluateExpr(expr[length - 1], portal);
  let index = 5;

  while (index < length && expr[index] < v) index += 2; // last item

  const subValue = evaluateExpr(expr[index - 1], portal);
  const supValue = evaluateExpr(expr[index + 1], portal);
  return interpolate(v, expr[index - 2], expr[index], subValue, supValue);
}

function interpolate(v, inMin, inMax, outMin, outMax) {
  if (typeof outMin === 'number' && typeof outMax === 'number') {
    return outMin + ((outMax - outMin) * (v - inMin)) / (inMax - inMin);
  }

  if (outMin instanceof Array && outMax instanceof Array) {
    const ret = [];

    for (let i = 0; i < outMin.length; i++) {
      ret.push(interpolate(v, inMin, inMax, outMin[i], outMax[i]));
    }

    return ret;
  }

  if (outMin instanceof Color && outMax instanceof Color) {
    return new Color(interpolate(v, inMin, inMax, outMin.array, outMax.array));
  } // error?

  return 0;
}

function rgbExpr(expr, portal) {
  return new Color([evaluateExpr(expr[1], portal), evaluateExpr(expr[2], portal), evaluateExpr(expr[3], portal)]);
}

function sliceExpr(expr, portal) {
  const a = evaluateExpr(expr[1], portal);
  const s = evaluateExpr(expr[2], portal);
  const e = evaluateExpr(expr[3], portal);
  if (a instanceof Array) return a.slice(s, e);
  else return null;
}

function mathExpr(expr, portal) {
  const op = expr[0];

  if (op === '+') {
    let ret = 0;

    for (let i = 1; i < expr.length; i++) {
      ret += +evaluateExpr(expr[i], portal);
    }

    return ret;
  }

  if (op === '*') {
    let ret = 1;

    for (let i = 1; i < expr.length; i++) {
      ret *= +evaluateExpr(expr[i], portal);
    }

    return ret;
  }

  if (expr.length < 3) return null;
  const v1 = +evaluateExpr(expr[1], portal);
  const v2 = +evaluateExpr(expr[2], portal);

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

function pathExpr(expr, portal) {
  const path = expr[0];
  const obj = evaluateExpr(expr[1], portal);

  if (typeof(obj) === 'object')
    return obj[path];

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
  // @ts-ignore
  return window.map.getZoom();
}

const operators = {
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
  // obj/array
  path: pathExpr,
};

function evaluateExpr(expr, portal) {
  if (expr instanceof Array) {
    const operator = expr[0];
    if (operator in operators) {
      return operators[operator](expr, portal);
    }
  }
  return expr;
}

const customHighlight = {};

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
    color: [
      'interpolate',
      ['linear'],
      ['get', 'level'],
      0,
      ['rgb', 255, 0, 0],
      4,
      ['rgb', 0, 255, 0],
      8,
      ['rgb', 0, 0, 255],
    ],
    fillColor: [
      'interpolate',
      ['linear'],
      ['get', 'level'],
      0,
      ['rgb', 255, 0, 0],
      4,
      ['rgb', 0, 255, 0],
      8,
      ['rgb', 0, 0, 255],
    ],
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

function highlight(data) {
  const highlighter = this;
  if (!highlighter || !highlighter.name) return;
  const style = customHighlight.settings.styles[highlighter.name];
  if (!style) return;
  const portal = data.portal;
  portal.setStyle(computeStyle(style, portal));
}

function showDialog() {
  const div = document.createElement('div');

  const styles = customHighlight.settings.styles;
  const selected = customHighlight.settings.selected;

  const menu = document.createElement('div');
  div.appendChild(menu);
  menu.classList.add('menu');

  const selectStyle = document.createElement('select');
  for (const name in styles) {
    const option = document.createElement('option');
    option.textContent = name;
    option.value = name;
    selectStyle.appendChild(option);
  }
  if (selected.length) selectStyle.value = selected[0];
  menu.appendChild(selectStyle);

  const newDiv = document.createElement('div');
  menu.appendChild(newDiv);

  const newInput = document.createElement('input');
  newInput.placeholder = 'custom name';
  newDiv.append(newInput);

  const newButton = document.createElement('button');
  newButton.textContent = 'New';
  newDiv.append(newButton);

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

  newButton.addEventListener('click', function () {
    const name = newInput.value;
    if (!name || styles[name]) {
      alert('Invalid or already used name: ' + name);
      return;
    }
    styles[name] = {};
    localStorage[STORAGE_KEY] = JSON.stringify(customHighlight.settings);
    styleInput.value = JSON.stringify(styles[name], null, 2);
    // one element for now
    selected.splice(0, selected.length, name);
    window.addPortalHighlighter('C.H.: ' + name, { name: name, highlight: highlight });
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

function setup () {
  $('<style>')
    .prop('type', 'text/css')
    .html(
      '#dialog-plugin-custom-highlight .menu { display: flex; justify-content: space-between;  }\
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

  for (const styleName in customHighlight.settings.styles) {
    window.addPortalHighlighter('C.H.: ' + styleName, { name: styleName, highlight: highlight });
  }
}

if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();

setup.info = plugin_info; //add the script info data to the function as a property
}

// inject code into site context
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };

var script = document.createElement('script');
// if on last IITC mobile, will be replaced by wrapper(info)
var mobile = `script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);`;
// detect if mobile
if (mobile.startsWith('script')) {
  script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
  script.appendChild(document.createTextNode('//# sourceURL=iitc:///plugins/highlight-customize.js'));
  (document.body || document.head || document.documentElement).appendChild(script);
} else {
  // mobile string
  wrapper(info);
}
