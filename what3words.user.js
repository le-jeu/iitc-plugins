
// ==UserScript==
// @author        jaiperdu
// @name          IITC plugin: what3words search
// @category      Misc
// @version       0.1.0
// @description   Location search on what3words
// @id            what3words
// @namespace     https://github.com/IITC-CE/ingress-intel-total-conversion
// @updateURL     https://le-jeu.github.io/iitc-plugins/what3words.user.js
// @downloadURL   https://le-jeu.github.io/iitc-plugins/what3words.user.js
// @match         https://intel.ingress.com/*
// @grant         none
// ==/UserScript==
function wrapper(plugin_info) {

// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

const URI =
  "https://mapapi.what3words.com/api/convert-to-coordinates?format=json&words=";
const queryRegex = /[a-z]+\.[a-z]+\.[a-z]+/;

function setup () {
  window.addHook("search", function (query) {
    if (!query.confirmed) return;
    const text = query.term.toLowerCase().replace(/ /g, "");
    if (text.match(queryRegex)) {
      fetch(URI + text)
        .then((r) => r.json())
        .then((json) =>
          query.addResult({
            title: json.nearestPlace,
            position: json.coordinates,
            description: text,
          })
        );
    }
  });
}

if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();

setup.info = plugin_info; //add the script info data to the function as a property
}

// inject code into site context
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };

var script = document.createElement('script');
// if on last IITC mobile, will be replaced by wrapper(info)
var mobile = `script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);`;
// detect if mobile
if (mobile.startsWith('script')) {
  script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
  script.appendChild(document.createTextNode('//# sourceURL=iitc:///plugins/what3words.js'));
  (document.body || document.head || document.documentElement).appendChild(script);
} else {
  // mobile string
  wrapper(info);
}
