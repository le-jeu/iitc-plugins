// @author         jaiperdu
// @name           Glify layer
// @category       Map Tiles
// @version        0.1.0
// @description    GL layer

var glLayers = {};

var toClicks = {};
function onPortalSelected(data) {
  var guid = data.selectedPortalGuid;
  if (guid && toClicks[guid]) {
    delete toClicks[guid];
    window.portals[guid].fire('click');
  }
}

var colors = {
  E: {r: 0, g: 1, b: 0, a: .5},
  R: {r: 0, g: 0, b: 1, a: .5},
  N: {r: 1, g: .4, b: 0, a: .5},
};

glLayers.layer = null;
function showCache() {
  if (window.plugin.offle) {
    var portals = Object.values(window.plugin.offle.portalDb);
    var colors = {
      // not visited
      0: { r: 0, g: 0, b: 0, a: .2 },
      // visited not captured
      1: { r: 1, g: 0, b: 0, a: .5 },
      // not visited but captured (unlikely)
      2: { r: .8, g: .8, b: 0, a: .5 },
      // visited and captured
      3: { r: 0, g: .8, b: .8, a: .5 },
    };
    if (portals.length > 0) {
      glLayers.layer = L.glify.points({
        map: map,
        pane: "cache",
        data: portals.map((p) => [p.lat, p.lng, p.guid]),
        size: 10,
        color: (i) => colors[portals[i].flags & 3],
        click: (e, feature) => {
          var guid = feature[2];
          if (guid in window.portals) {
            window.portals[guid].fire('click');
            return;
          }
          toClicks[guid] = true;
          window.renderPortalDetails(guid);
        },
      });
    }
  } else if (window.plugin.cachePortals && window.plugin.cachePortals.db) {
    var tx = window.plugin.cachePortals.db.transaction("portals", "readonly");
    tx.objectStore("portals").getAll().onsuccess = function (event) {
      var portals = event.target.result;
      if (portals.length > 0) {
        glLayers.layer = L.glify.points({
          map: map,
          pane: "cache",
          data: portals.map((p) => [p.latE6/1e6, p.lngE6/1e6, p.guid]),
          size: 10,
          color: (i) => colors[portals[i].team || "N"],
          click: (e, feature) => {
            var guid = feature[2];
            if (guid in window.portals) {
              window.portals[guid].fire('click');
              return;
            }
            toClicks[guid] = true;
            window.renderPortalDetails(guid);
          },
        });
      }
    };
  } else {
    setTimeout(showCache, 2000);
  }
}

function setup() {
  try {
    '@include_raw:external/glify-browser.js@';
  } catch (e) {
    console.error(e);
    return;
  }

  $('<style>').prop('type', 'text/css').html('.leaflet-pane.leaflet-cache-pane { z-index: 300; }').appendTo('head');

  window.map.createPane('cache');
  window.addLayerGroup('GL Cache', new (L.Layer.extend({
    onAdd: function (map) {
      if (!glLayers.layer) showCache();
    },
    onRemove: function (map) {
      if (glLayers.layer) {
        glLayers.layer.remove();
        delete glLayers.layer;
      }
    },
  })), false);

  window.addHook("portalSelected", onPortalSelected);
}
