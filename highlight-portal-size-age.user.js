// ==UserScript==
// @author         jaiperdu
// @name           IITC plugin: ISmaller/Bigger/Older Portals
// @category       Highlighter
// @version        1.0.0
// @description    Resize portal and age highlighers
// @id             highlight-portal-size-age
// @namespace      https://github.com/IITC-CE/ingress-intel-total-conversion
// @updateURL      https://le-jeu.github.io/iitc-plugins/highlight-portal-size-age.user.js
// @downloadURL    https://le-jeu.github.io/iitc-plugins/highlight-portal-size-age.user.js
// @match          https://intel.ingress.com/*
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'lejeu';
plugin_info.dateTimeVersion = '2022-08-09-093133';
plugin_info.pluginId = 'highlight-portal-size-age';
//END PLUGIN AUTHORS NOTE

/* exported setup */
function setup() {
  window.addPortalHighlighter('Smaller Portals', function (data) {
    const portal = data.portal;
    portal.setStyle({
      weight: portal.options.weight * 0.7,
      radius: portal.options.radius * 0.8,
    });
  });
  window.addPortalHighlighter('Bigger Portals', function (data) {
    const portal = data.portal;
    portal.setStyle({
      weight: portal.options.weight * 1.2,
      radius: portal.options.radius * 1.5,
    });
  });
  window.addPortalHighlighter('Old Portals', function (data) {
    const portal = data.portal;
    const delta = (Date.now() - portal.options.timestamp) / 86400000;
    const color = delta > 1 ? 'grey' : 'hsl(' + Math.round(delta * 300) + ',100%,50%)';
    portal.setStyle({
      color: color,
      fillColor: color,
    });
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

