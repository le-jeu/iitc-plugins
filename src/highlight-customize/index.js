import { Color, evaluateExpr } from './expression';

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

export default function () {
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
