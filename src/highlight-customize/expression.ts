import { clamp } from './util';

export class Color {
  array: [number, number, number];

  constructor(rgb: [number, number, number]) {
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
};

export function evaluateExpr(expr, portal) {
  if (expr instanceof Array) {
    const operator = expr[0];
    if (operator in operators) {
      return operators[operator](expr, portal);
    }
    return null;
  }
  return expr;
}
