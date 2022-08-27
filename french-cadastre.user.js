// ==UserScript==
// @author         jaiperdu
// @name           IITC plugin: Cadastre
// @category       Map Tiles
// @version        0.1.1
// @description    Overlay Cadastre
// @id             french-cadastre
// @namespace      https://github.com/IITC-CE/ingress-intel-total-conversion
// @updateURL      https://le-jeu.github.io/iitc-plugins/french-cadastre.user.js
// @downloadURL    https://le-jeu.github.io/iitc-plugins/french-cadastre.user.js
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
plugin_info.pluginId = 'french-cadastre';
//END PLUGIN AUTHORS NOTE

// Download and deploy tiles from
// https://cadastre.data.gouv.fr/data/etalab-cadastre/latest/mbtiles/france

const pbfTiles = "http://server/path/{z}/{x}/{y}.pbf"

function setup() {
  if (!window.plugin.mapLibreGL) {
    alert("Cadastre needs Maplibre GL JS to run.");
    throw "Missing Maplibre GL JS";
  }
  window.plugin.mapLibreGL.load().then(() => {
    var layer = L.maplibreGL({
      pane: 'overlayPane',
      style: {
        version: 8,
        name: "Cadastre",
        sources: {
          "cadastre": {
            type: "vector",
            tiles: [ pbfTiles ],
            minzoom: 11,
            maxzoom: 16,
          },
        },
        layers: [
          {
            id: "batiments",
            source: "cadastre",
            "source-layer": "batiments",
            type: "fill",
            minzoom: 17,
            paint: {
              "fill-color": "orange",
              "fill-opacity": .4,
            }
          },
          {
            id: "parcelles",
            source: "cadastre",
            "source-layer": "parcelles",
            type: "line",
            minzoom: 16,
            paint: {
              "line-color": "#555",
            }
          },
          {
            id: "sections",
            source: "cadastre",
            "source-layer": "sections",
            type: "line",
          },
        ]
      }
    });

    window.addLayerGroup('Cadastre', layer, false);
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

