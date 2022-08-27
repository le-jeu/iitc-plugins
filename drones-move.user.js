// ==UserScript==
// @author         jaiperdu
// @name           IITC plugin: Look for drone moves
// @category       Info
// @version        0.1.0
// @description    Find paires of portals in the view that may have been used recently by a drone move.
// @id             drones-move
// @namespace      https://github.com/IITC-CE/ingress-intel-total-conversion
// @updateURL      https://le-jeu.github.io/iitc-plugins/drones-move.user.js
// @downloadURL    https://le-jeu.github.io/iitc-plugins/drones-move.user.js
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
plugin_info.pluginId = 'drones-move';
//END PLUGIN AUTHORS NOTE

const dronesMove = {};
window.plugin.dronesMove = dronesMove;

dronesMove.portalStyle = {
  color: 'red',
  radius: 10,
  interactive: false,
};
dronesMove.moveStyle = {
  color: 'red',
  weight: 6,
  interactive: false,
};

function update() {
  const timeMap = {};
  for (const guid in window.portals) {
    const t = window.portals[guid].options.timestamp;
    if (t <= 0) continue;
    if (!(t in timeMap)) timeMap[t] = [];
    timeMap[t].push(guid);
  }

  // remove timestamp from links
  for (const guid in window.links) {
    const t = window.links[guid].options.timestamp;
    if (timeMap[t] && timeMap[t].includes(window.links[guid].options.data.oGuid))
      delete timeMap[t];
  }

  const paires = Object.values(timeMap).filter((l) => l.length == 2);
  dronesMove.layer.clearLayers();
  for (const [ga,gb] of paires) {
    const pa = window.portals[ga];
    const pb = window.portals[gb];
    L.polyline([pa.getLatLng(), pb.getLatLng()], dronesMove.moveStyle).addTo(dronesMove.layer);
    L.circleMarker(pa.getLatLng(), dronesMove.portalStyle).addTo(dronesMove.layer);
    L.circleMarker(pb.getLatLng(), dronesMove.portalStyle).addTo(dronesMove.layer);
  }
  console.info("found", paires.length, 'drone moves');
}

function setup () {
  dronesMove.layer = L.layerGroup();
  window.addLayerGroup('Drones last move', dronesMove.layer, false);

  window.addHook('mapDataRefreshEnd', update);
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

