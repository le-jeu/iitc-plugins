// @author         jaiperdu
// @name           Cache visible portals
// @category       Cache
// @version        0.3.0
// @description    Cache the data of visible portals and use this to populate the map when possible

// use own namespace for plugin
var cachePortals = {};

var MAX_ZOOM = 22;

cachePortals.MIN_ZOOM = 15; // zoom min to show data
cachePortals.MAX_AGE = 12 * 60 * 60; // 12 hours max age for cached data

function openDB() {
  var rq = window.indexedDB.open("cache-portals", 3);
  rq.onupgradeneeded = function (event) {
    var db = event.target.result;
    if (event.oldVersion < 1) {
      var store = db.createObjectStore("portals", { keyPath: "guid" });
      store.createIndex("latLngE6", ["latE6", "lngE6"], { unique: true });
      store.createIndex("loadtime", "loadtime", { unique: false });
    }
    if (event.oldVersion < 2) {
      var store = rq.transaction.objectStore("portals");
      store.openCursor().onsuccess = function (e) {
        var cursor = e.target.result;
        if (cursor) {
          var portal = cursor.value;
          L.Util.extend(portal, coordsToTiles(portal.latE6, portal.lngE6));
          store.put(portal);
          cursor.continue();
        }
      };
      // MAX_ZOOM=22
      for (var i = 1; i <= 22; i++) {
        var key = "z" + i;
        store.createIndex(key, key, { unique: false });
      }
    }
    if (event.oldVersion < 3) {
      var store = db.createObjectStore("portals_history", { keyPath: "id", autoIncrement: true });
      store.createIndex("guid", "guid", { unique: false });
    }
  };
  rq.onsuccess = function (event) {
    var db = event.target.result;
    cachePortals.db = db;
    cleanup();
  };
  return rq;
}

function cleanup() {
  if (!cachePortals.db) return;
  var maxAge = Date.now() - cachePortals.MAX_AGE * 1000;
  var tx = cachePortals.db.transaction("portals", "readwrite");
  tx
    .objectStore("portals")
    .index("loadtime")
    .openKeyCursor(window.IDBKeyRange.upperBound(maxAge)).onsuccess = function (
    event
  ) {
    var cursor = event.target.result;
    if (cursor) {
      tx.objectStore("portals").delete(cursor.primaryKey);
      cursor.continue();
    }
  };
}

function updateLocationHistory(portal) {
  var tx = cachePortals.db.transaction("portals_history", "readwrite");
  var store = tx.objectStore("portals_history");
  var index = store.index("guid");
  index.getAll(portal.guid).onsuccess = function (event) {
    var portals = event.target.result;
    if (portals.length > 0) {
      var last = portals[portals.length-1];
      if (last.latE6 === portal.latE6 && last.lngE6 === portal.lngE6) {
        last.lastSeen = Date.now();
        store.put(last)
        return;
      }
      window.map.fire('portalChange:location', { prev: last, cur: portal });
      var link = window.makePermalink([
        (portal.latE6*1e-6).toFixed(6),
        (portal.lngE6*1e-6).toFixed(6)
      ]);
      alert(`Portal <a href="${link}">${portal.guid}</a> has moved from ${(last.latE6*1e-6).toFixed(6)},${(last.lngE6*1e-6).toFixed(6)} to ${(portal.latE6*1e-6).toFixed(6)},${(portal.lngE6*1e-6).toFixed(6)}`);
    }
    store.add({
      guid: portal.guid,
      latE6: portal.latE6,
      lngE6: portal.lngE6,
      date: portal.timestamp,
      lastSeen: Date.now(),
    });
  };
}

function putPortal(portal) {
  if (!cachePortals.db) return;
  var tx = cachePortals.db.transaction("portals", "readwrite");
  tx.objectStore("portals").put(portal);
  updateLocationHistory(portal);
}

function portalDetailLoaded(data) {
  if (data.success) {
    var portal = {
      guid: data.guid,
      team: data.details.team,
      latE6: data.details.latE6,
      lngE6: data.details.lngE6,
      timestamp: data.details.timestamp,
      loadtime: Date.now(),
    };
    L.Util.extend(portal, coordsToTiles(portal.latE6, portal.lngE6));
    putPortal(portal);
  }
}

function portalAdded(data) {
  var portal = {
    guid: data.portal.options.guid,
    team: data.portal.options.data.team,
    latE6: data.portal.options.data.latE6,
    lngE6: data.portal.options.data.lngE6,
    timestamp: data.portal.options.timestamp,
    loadtime: +Date.now(),
  };
  L.Util.extend(portal, coordsToTiles(portal.latE6, portal.lngE6));
  putPortal(portal);
}

function coordsToTile(latE6, lngE6, zoom) {
  latE6 = latE6 + 90000000;
  lngE6 = lngE6 + 180000000;
  var size = 360000000;
  for (var i = 0; i < zoom; i++) size = size / 2;
  return [Math.floor(latE6 / size), Math.floor(lngE6 / size)];
}

function coordsToTiles(latE6, lngE6) {
  latE6 = latE6 + 90000000;
  lngE6 = lngE6 + 180000000;
  var size = 360000000;
  var tiles = {};
  for (var i = 0; i <= MAX_ZOOM; i++) {
    tiles["z" + i] = Math.floor(latE6 / size) + "_" + Math.floor(lngE6 / size);
    size = size / 2;
  }
  return tiles;
}

function entityInject(data) {
  if (!cachePortals.db) return;

  var mapZoom = map.getZoom();
  if (mapZoom < cachePortals.MIN_ZOOM) return;

  if (mapZoom > MAX_ZOOM) mapZoom = MAX_ZOOM;

  var bounds = window.clampLatLngBounds(map.getBounds());

  var tx = cachePortals.db.transaction("portals", "readonly");
  var index = tx.objectStore("portals").index("z" + mapZoom);

  var lowerBound = [bounds.getSouth(), bounds.getWest()].map((v) =>
    Math.round(v * 1e6)
  );
  var upperBound = [bounds.getNorth(), bounds.getEast()].map((v) =>
    Math.round(v * 1e6)
  );

  var lowerTile = coordsToTile(lowerBound[0], lowerBound[1], mapZoom);
  var upperTile = coordsToTile(upperBound[0], upperBound[1], mapZoom);

  var maxAge = Date.now() - cachePortals.MAX_AGE * 1000;
  for (var x = lowerTile[0]; x <= upperTile[0]; x++) {
    for (var y = lowerTile[1]; y <= upperTile[1]; y++) {
      var ents = [];
      index.getAll(x + "_" + y).onsuccess = function (event) {
        var portals = event.target.result;
        if (portals.length > 0) {
          data.callback(
            portals.map((portal) => [
              portal.guid,
              portal.timestamp,
              ["p", portal.team, portal.latE6, portal.lngE6],
            ]),
            "core"
          );
        }
      };
    }
  }
}

function setup() {
  if (!window.indexedDB) return;
  window.plugin.cachePortals = cachePortals;

  openDB();

  window.addHook("portalAdded", portalAdded);
  window.addHook("portalDetailLoaded", portalDetailLoaded);
  window.addHook("mapDataEntityInject", entityInject);
}
