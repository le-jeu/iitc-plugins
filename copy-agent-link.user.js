// ==UserScript==
// @author         jaiperdu
// @name           IITC plugin: Copy agent profile link
// @category       Misc
// @version        0.1.0
// @description    Copy to clipboard agent profile link on click
// @id             copy-agent-link
// @namespace      https://github.com/IITC-CE/ingress-intel-total-conversion
// @updateURL      https://le-jeu.github.io/iitc-plugins/copy-agent-link.user.js
// @downloadURL    https://le-jeu.github.io/iitc-plugins/copy-agent-link.user.js
// @match          https://intel.ingress.com/*
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'lejeu';
plugin_info.dateTimeVersion = '2022-08-27-114220';
plugin_info.pluginId = 'copy-agent-link';
//END PLUGIN AUTHORS NOTE

const baseUrl = "https://link.ingress.com/?link=https://intel.ingress.com/agent/";
function copyToClipboard(nick) {
  window.app.copy(baseUrl + nick);
}

function setup() {
  if (window.isApp && window.app.copy) {
    $(document).on('click', '.nickname', function(event) {
      return copyToClipboard($(this).text());
    });
  } else {
    alert("[Copy agent profile link] doesn't support desktop yet");
  }
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

