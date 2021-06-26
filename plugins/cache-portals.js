// @author         jaiperdu
// @name           Cache visible portals
// @category       Cache
// @version        0.4.0
// @description    Cache the data of visible portals and use this to populate the map when possible

// use own namespace for plugin
var cachePortals = {};

var MAX_ZOOM = 22;

cachePortals.MIN_ZOOM = 15; // zoom min to show data
cachePortals.MAX_AGE = 12 * 60 * 60; // 12 hours max age for cached data

cachePortals.MAX_LOCATION_AGE = 30 * 24 * 60 * 60; // 1 month for location history

function openDB() {
  var rq = window.indexedDB.open("cache-portals", 6);
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
    if (event.oldVersion < 4) {
      // allow co-located portals
      var store = rq.transaction.objectStore('portals');
      store.deleteIndex("latLngE6");
      store.createIndex("latLngE6", ["latE6", "lngE6"], { unique: false });
    }
    if (event.oldVersion < 5) {
      var store = rq.transaction.objectStore('portals_history');
      store.openCursor().onsuccess = function (e) {
        var cursor = e.target.result;
        if (cursor) {
          var portal = cursor.value;
          if (!portal.date) portal.date = portal.lastSeen;
          if (!portal.timestamp) portal.timestamp = portal.date;
          store.put(portal);
          cursor.continue();
        }
      };

      store.createIndex("lastSeen", "lastSeen", { unique: false });
    }
  };
  rq.onsuccess = function (event) {
    var db = event.target.result;
    cachePortals.db = db;
    cleanup();
  };
  rq.onerror = function (event) {
    console.error("cache-portals: something went wrong", event);
  };
  return rq;
}

function cleanup() {
  if (!cachePortals.db) return;
  console.time("cache-portals: cleanup");
  var maxAge = Date.now() - cachePortals.MAX_AGE * 1000;
  var tx = cachePortals.db.transaction(["portals", "portals_history"], "readwrite");
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
  maxAge = Date.now() - cachePortals.MAX_LOCATION_AGE * 1000;
  tx
    .objectStore("portals_history")
    .index("lastSeen")
    .openKeyCursor(window.IDBKeyRange.upperBound(maxAge)).onsuccess = function (
    event
  ) {
    var cursor = event.target.result;
    if (cursor) {
      tx.objectStore("portals_history").delete(cursor.primaryKey);
      cursor.continue();
    }
  };

  tx.oncomplete = function () {
    console.timeEnd("cache-portals: cleanup");
  }
}

function updateLocationHistory(portals) {
  var tx = cachePortals.db.transaction("portals_history", "readwrite");
  var store = tx.objectStore("portals_history");
  var index = store.index("guid");

  var count = portals.length;

  console.time("cache-portals: updateLocationHistory");
  tx.oncomplete = () => {
    console.timeEnd("cache-portals: updateLocationHistory");
    console.log("cache-portals: updateLocationHistory:", count, "portals");
  }

  portals.forEach((portal) => {
    // ignore some forged data
    if (!portal.timestamp) return;
    index.getAll(portal.guid).onsuccess = function (event) {
      var portals = event.target.result;
      if (portals.length > 0) {
        var last = portals[portals.length-1];
        // ignore old data (whatever the source)
        if (last.timestamp > portal.timestamp) return
        // update last seen
        if (last.latE6 === portal.latE6 && last.lngE6 === portal.lngE6) {
          last.lastSeen = Date.now();
          last.timestamp = portal.timestamp;
          store.put(last)
          return;
        }
        window.map.fire('portalChange:location', { prev: last, cur: portal });
        var latLng = [
          (portal.latE6*1e-6).toFixed(6),
          (portal.lngE6*1e-6).toFixed(6)
        ];
        var link = window.makePermalink(latLng);
        var div = L.DomUtil.create('div');
        div.append("Portal ")
        var a = L.DomUtil.create('a', '', div);
        a.textContent = portal.guid;
        L.DomEvent.on(a, 'click', (ev) => {
          L.DomEvent.preventDefault();
          window.zoomToAndShowPortal(portal.guid, latLng);
        });
        div.append(` has moved from ${(last.latE6*1e-6).toFixed(6)},${(last.lngE6*1e-6).toFixed(6)} to ${latLng.join(',')}`);
        alert(div, true);
      }
      store.add({
        guid: portal.guid,
        latE6: portal.latE6,
        lngE6: portal.lngE6,
        date: portal.timestamp,
        timestamp: portal.timestamp,
        lastSeen: Date.now(),
      });
    };
  });
}

function putPortals(portals) {
  if (!cachePortals.db) return;

  var tx = cachePortals.db.transaction("portals", "readwrite");
  var store = tx.objectStore("portals");
  var count = portals.length;
  console.time("cache-portals: putPortals");
  tx.oncomplete = () => {
    console.timeEnd("cache-portals: putPortals");
    console.log("cache-portals: putPortals:", count, "portals");
  }
  portals.forEach((portal) => store.put(portal));
  updateLocationHistory(portals);
}

function putPortal(portal) {
  putPortals([portal]);
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

function mapDataRefreshEnd() {
  var portals = [];
  for (var guid in window.portals) {
    var options = window.portals[guid].options;
    if (options.level === undefined) continue;
    var portal = {
      guid: options.guid,
      team: options.data.team,
      latE6: options.data.latE6,
      lngE6: options.data.lngE6,
      timestamp: options.timestamp,
      loadtime: +Date.now(),
    };
    L.Util.extend(portal, coordsToTiles(portal.latE6, portal.lngE6));
    portals.push(portal);
  }
  putPortals(portals);
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

function displayHistory() {
  if (!cachePortals.db) return;
  var div = L.DomUtil.create('div');

  var guidSelect = L.DomUtil.create('select', '', div);
  guidSelect.innerHTML = "<option selected disabled>Select a guid</option>"
  var historySelect = L.DomUtil.create('select', '', div);
  var pre = L.DomUtil.create('pre', '', div);
  var curHist = {};

  L.DomEvent.on(historySelect, 'change', () => {
    var p = curHist[historySelect.value];
    if (!p) return;
    pre.textContent = `Portal ${p.guid}
First seen: ${new Date(p.date).toLocaleString()}
Last seen: ${new Date(p.lastSeen).toLocaleString()}
Lat: ${p.latE6/1e6}
Lng: ${p.lngE6/1e6}`;
  });

  L.DomEvent.on(guidSelect, 'change', function (ev) {
    var guid = guidSelect.value;
    historySelect.innerHTML = "<option selected disabled>Select a date</option>";
    curHist = {};
    var tx = cachePortals.db.transaction("portals_history", "readonly");
    var portalsStore = tx.objectStore("portals_history");
    var guidIndex = portalsStore.index("guid");
    guidIndex.getAll(guid).onsuccess = function (e) {
      var portals = e.target.result;
      portals.forEach((p) => {
        curHist[p.date] = p;
        var option = L.DomUtil.create('option', '', historySelect);
        option.value = p.date;
        option.textContent = new Date(p.date).toLocaleString();
      })
    }
  });

  var tx = cachePortals.db.transaction("portals_history", "readonly");
  var portalsStore = tx.objectStore("portals_history");
  var guidIndex = portalsStore.index("guid");

  var lastGuid = null;
  guidIndex.openKeyCursor().onsuccess = function (e) {
    var cursor = e.target.result;
    if (cursor) {
      var guid = cursor.key;
      if (lastGuid === guid) {
        var opt = L.DomUtil.create('option', '', guidSelect)
        opt.textContent = guid;
        cursor.continue(guid + 'x');
      } else {
        lastGuid = guid;
        cursor.continue();
      }
    }
  };

  tx.oncomplete = function (e) {

  };

  window.dialog({
    title: "Portal Location History",
    html: div,
    width: 'auto',
  });
}

function setup() {
  if (!window.indexedDB) return;
  window.plugin.cachePortals = cachePortals;

  openDB();

  window.addHook("mapDataRefreshEnd", mapDataRefreshEnd);
  window.addHook("portalDetailLoaded", portalDetailLoaded);
  window.addHook("mapDataEntityInject", entityInject);

  $('<a>')
    .html('Portal Cache')
    .click(displayHistory)
    .appendTo('#toolbox');
}
