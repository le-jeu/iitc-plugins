// ==UserScript==
// @author         jaiperdu
// @name           IITC plugin: Mapbox Vector tiles
// @category       Map Tiles
// @version        0.1.1
// @description    Add the Mapbox GL vector tiles as base layers.
// @id             basemap-mapboxgl
// @namespace      https://github.com/IITC-CE/ingress-intel-total-conversion
// @updateURL      https://le-jeu.github.io/iitc-plugins/basemap-mapboxgl.user.js
// @downloadURL    https://le-jeu.github.io/iitc-plugins/basemap-mapboxgl.user.js
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
plugin_info.pluginId = 'basemap-mapboxgl';
//END PLUGIN AUTHORS NOTE

var mapTileMapbox = {};
window.plugin.mapTileMapbox = mapTileMapbox;

mapTileMapbox.token = 'your_token';

mapTileMapbox.styles = {
  'mapbox://styles/mapbox/streets-v11' : 'Street',
  'mapbox://styles/mapbox/outdoors-v11' : 'Outdoors',
  'mapbox://styles/mapbox/light-v10' : 'Light',
  'mapbox://styles/mapbox/dark-v10' : 'Dark',
  'mapbox://styles/mapbox/bright-v8' : 'Bright'
};

mapTileMapbox.layers = [];

function setup () {
  if (!window.plugin.mapLibreGL) {
    alert("Basemap MapBox needs Maplibre GL JS to run.");
    throw "Missing Maplibre GL JS";
  }
  window.plugin.mapLibreGL.load().then(() => {
    for(var style in mapTileMapbox.styles) {
      let name = mapTileMapbox.styles[style];
      let layer = L.maplibreGL({
        accessToken: mapTileMapbox.token,
        style: style
      });
      mapTileMapbox.layers.push(layer);
      layerChooser.addBaseLayer(layer, 'Mapbox ' + name);
    }
  });
};

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

