// ==UserScript==
// @author         jaiperdu
// @name           IITC plugin: Highlight Kureze
// @category       Highlighter
// @version        1.0.0
// @description    Highlight Kureze and keep track between reloads
// @id             highlight-kureze
// @namespace      https://github.com/IITC-CE/ingress-intel-total-conversion
// @updateURL      https://le-jeu.github.io/iitc-plugins/highlight-kureze.user.js
// @downloadURL    https://le-jeu.github.io/iitc-plugins/highlight-kureze.user.js
// @match          https://intel.ingress.com/*
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'lejeu';
plugin_info.dateTimeVersion = '2022-06-30-074250';
plugin_info.pluginId = 'highlight-kureze';
//END PLUGIN AUTHORS NOTE

const portals = {};
const STORAGE_KEY = "plugin-highlight-kureze";

const setup =  function() {
  try {
    const stored = localStorage[STORAGE_KEY];
    if (stored) {
      const parsed = JSON.parse(stored);
      for (const k in parsed)
        portals[k] = parsed[k];
    }
  } catch (e) {
    console.log(e);
  }
  
  window.addPortalHighlighter('Kureze', function (data) {
    const portal = data.portal;
    if ((portal.options.data.ornaments || []).includes("ap2") || portal.options.guid in portals) {
      portal.setStyle({
        weight: 2,
        radius: portal.options.radius * 1.1,
        opacity: 1,
        fillColor: 'red',
        color: 'black',
      });
      portals[portal.options.guid] = {
        timestamp: portal.options.timestamp,
        team: portal.options.data.team,
        latE6: portal.options.data.latE6,
        lngE6: portal.options.data.lngE6,
      };
    }
  });
  
  window.addHook("mapDataEntityInject", function (data) {
    const { callback } = data;
    const ents = [];
    for (const guid in portals) {
      if (guid in window.portals) continue;
      const portal = portals[guid];
      ents.push([
        guid,
        portal.timestamp,
        [
          "p", portal.team, portal.latE6, portal.lngE6,
        ],
      ]);
    }
    callback(ents);
  });
  
  window.addHook("mapDataRefreshEnd", function (cb) {
    localStorage[STORAGE_KEY] = JSON.stringify(portals);
  });
  
  
  const a = L.DomUtil.create('a', null, document.querySelector('#toolbox'));
  a.textContent = 'Clear Kureze Cache';
  L.DomEvent.on(a, 'click', () => {
    for (const guid in portals)
      delete portals[guid];
    delete localStorage[STORAGE_KEY];
  });
}
setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);

