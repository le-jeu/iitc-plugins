// @author         jaiperdu
// @name           Highlighters selection
// @category       Highlighter
// @version        0.2.0
// @description    Allow multiple highlighter to work concurrently

/* global L */

// use own namespace for plugin
const highlighters = {};

highlighters.settings = {
  highlighters_enabled: [],
};
highlighters.SETTINGS_KEY = 'plugin-highlighters-settings';

function loadSettings() {
  try {
    const settings = JSON.parse(localStorage[highlighters.SETTINGS_KEY]);
    Object.assign(highlighters.settings, settings);
  } catch (e) {
    // nothing to do
  }
}

function storeSettings() {
  localStorage[highlighters.SETTINGS_KEY] = JSON.stringify(highlighters.settings);
}

function displayDialog() {
  const html = L.DomUtil.create('div', 'container');

  const enabledList = L.DomUtil.create('ol', 'enabled highlighters-list', html);
  for (const hl of highlighters.settings.highlighters_enabled) {
    if (!window._highlighters[hl]) continue;
    const li = L.DomUtil.create('li', null, enabledList);
    li.dataset['name'] = hl;
    li.textContent = hl;
  }

  const disabledList = L.DomUtil.create('ul', 'disabled highlighters-list', html);
  for (const hl in window._highlighters) {
    if (highlighters.settings.highlighters_enabled.includes(hl)) continue;
    const li = L.DomUtil.create('li', null, disabledList);
    li.dataset['name'] = hl;
    li.textContent = hl;
  }

  new Sortable(enabledList, {
    group: "shared",
    onSort: () => {
      const list = [];
      highlighters.settings.highlighters_enabled = [];
      for (const li of enabledList.children) {
        list.push(li.dataset['name']);
      }
      highlighters.settings.highlighters_enabled = list;
      storeSettings();
      window.resetHighlightedPortals();
    },
  });

  new Sortable(disabledList, {
    group: "shared",
  });

  window.dialog({
    html: html,
    id: 'plugin-highlighters',
    title: 'Highlighters',
  });
}

function highlightPortal(p) {
  const styler = new L.PortalStyler(p);
  for (const hl of highlighters.settings.highlighters_enabled) {
    const highlighter = window._highlighters[hl];
    if (highlighter !== undefined) {
      highlighter.highlight({portal: styler});
    }
  }
  const style = styler.getOptions();
  p.setStyle(style);
  if (style.radius === 0) p.setRadius(style.radius);
}

window.plugin.highlighters = highlighters;

/* eslint-disable-next-line no-unused-vars */
function setup () {
  try {
    '@include_raw:external/Sortable.min.js@';
  } catch (e) {
    console.error(e);
  }

  L.PortalStyler = L.Class.extend({
    initialize: function (portal) {
      L.setOptions(this, portal.options);
    },
    setStyle: function (style) {
      L.setOptions(this, style);
    },
    setRadius: function (radius) {
      L.setOptions(this, {radius: radius});
    },
    getRadius: function () {
      return this.options.radius;
    },
    getOptions: function () {
      return this.options;
    }
  });

  $('<style>').prop('type', 'text/css').html('@include_css:highlighters.css@').appendTo('head');

  window.highlightPortal = highlightPortal;
  if (window._highlighters === null) window._highlighters = {};

  const a = L.DomUtil.create('a', null, document.querySelector('#toolbox'));
  a.textContent = 'Highlighters';
  L.DomEvent.on(a, 'click', displayDialog);

  loadSettings();
};
