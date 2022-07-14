// ==UserScript==
// @author         jaiperdu
// @name           IITC plugin: Wasabee: Offle tweak
// @category       Misc
// @version        0.1.0
// @description    Interface with offle to propagate click to portal entity
// @id             wasabee-offle
// @namespace      https://github.com/IITC-CE/ingress-intel-total-conversion
// @updateURL      https://le-jeu.github.io/iitc-plugins/wasabee-offle.user.js
// @downloadURL    https://le-jeu.github.io/iitc-plugins/wasabee-offle.user.js
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
plugin_info.pluginId = 'wasabee-offle';
//END PLUGIN AUTHORS NOTE

var hookOn;
function onPortalSelected(data) {
  var guid = data.selectedPortalGuid;
  if (guid && guid === hookOn) {
    hookOn = null;
    window.portals[guid].fire('click');
  }
}

function onOfflePortalClick() {
	var guid = this.options.guid;
	if (guid in window.portals) window.portals[guid].fire('click');
	else hookOn = guid;
}

function setup() {
	if (!window.plugin.offle) return;
	var offle = window.plugin.offle;
	var origRenderPortal = offle.renderPortal;
	offle.renderPortal = function(guid) {
		var ret = origRenderPortal(guid);
		var marker = offle.currentPortalMarkers[guid];
		marker.options.guid = guid;
		marker.on('click', onOfflePortalClick);
		return ret;
	};
  window.addHook("portalSelected", onPortalSelected);
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

