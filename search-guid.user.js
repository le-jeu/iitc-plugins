
// ==UserScript==
// @author        jaiperdu
// @name          IITC plugin: Search portal by GUID
// @category      Portal Info
// @version       0.1.0
// @description   Handle guid in IITC search
// @id            search-guid
// @namespace     https://github.com/IITC-CE/ingress-intel-total-conversion
// @updateURL     https://le-jeu.github.io/iitc-plugins/search-guid.user.js
// @downloadURL   https://le-jeu.github.io/iitc-plugins/search-guid.user.js
// @match         https://intel.ingress.com/*
// @grant         none
// ==/UserScript==
function wrapper(plugin_info) {

// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

const W = window;

const guid_re = /[0-9a-f]{32}\.[0-9a-f]{2}/;

function addResult(query, data) {
  const guid = data.guid;
  const teams = ["NEU", "RES", "ENL"];
  const team = W.teamStringToId(data.team);
  query.addResult({
    title: data.title,
    description:
      teams[team] +
      ", L" +
      data.level +
      ", " +
      data.health +
      "%, " +
      data.resCount +
      " Resonators",
    position: L.latLng(data.latE6 * 1e-6, data.lngE6 * 1e-6),
    onSelected: function (result, event) {
      if (event.type == "dblclick") {
        W.zoomToAndShowPortal(guid, result.position);
      } else if (window.portals[guid]) {
        if (!W.map.getBounds().contains(result.position))
          W.map.setView(result.position);
        W.renderPortalDetails(guid);
      } else {
        W.selectPortalByLatLng(result.position);
      }
      return true; // prevent default behavior
    },
  });
}

function search(query) {
  const res = query.term.match(guid_re);
  if (res) {
    const guid = res[0];
    const data = W.portalDetail.get(guid);
    if (data) addResult(query, data);
    else {
      W.portalDetail.request(guid).then(function (data) {
        addResult(query, data);
      });
    }
  }
}

function setup () {
  W.addHook("search", search);
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
  script.appendChild(document.createTextNode('//# sourceURL=iitc:///plugins/search-guid.js'));
  (document.body || document.head || document.documentElement).appendChild(script);
} else {
  // mobile string
  wrapper(info);
}
