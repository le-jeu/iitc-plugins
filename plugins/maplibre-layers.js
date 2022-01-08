// @author         jaiperdu
// @name           MapLibre GL Layers
// @category       Map Tiles
// @version        0.2.1
// @description    GL layers

function guidToID(guid) {
  return parseInt(guid.slice(0, 8), 16);
}

function mapInit() {
  var sources = {
    fields: new Map(),
    links: new Map(),
    portals: new Map(),
  };

  var ingressStyle = {
    version: 8,
    name: "GL layers",
    sources: {
      fields: {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      },
      links: {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      },
      portals: {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      },
    },
    layers: [
      {
        id: "fields",
        source: "fields",
        type: "fill",
        paint: {
          "fill-color": [
            "match",
            ["get", "team"],
            "R",
            COLORS[1],
            "E",
            COLORS[2],
            COLORS[0],
          ],
          "fill-opacity": 0.4,
          "fill-antialias": false,
        },
      },
      {
        id: "links",
        source: "links",
        type: "line",
        paint: {
          "line-width": 2,
          "line-color": [
            "match",
            ["get", "team"],
            "R",
            COLORS[1],
            "E",
            COLORS[2],
            COLORS[0],
          ],
        },
      },
      {
        id: "portals",
        source: "portals",
        type: "circle",
        paint: {
          "circle-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            COLOR_SELECTED_PORTAL,
            [
              "match",
              ["get", "team"],
              "R",
              COLORS[1],
              "E",
              COLORS[2],
              COLORS[0],
            ],
          ],
          "circle-stroke-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            COLOR_SELECTED_PORTAL,
            [
              "match",
              ["get", "team"],
              "R",
              COLORS[1],
              "E",
              COLORS[2],
              COLORS[0],
            ],
          ],
          "circle-stroke-width": [
            "interpolate",
            ["linear"],
            ["get", "level"],
            0,
            2,
            8,
            3,
          ],
          "circle-opacity": 0.5,
          "circle-radius": [
            "let",
            "radius",
            ["interpolate", ["linear"], ["get", "level"], 0, 5, 8, 8],
            [
              "interpolate",
              ["linear"],
              ["zoom"],
              7,
              ["*", 0.5, ["var", "radius"]],
              16,
              ["*", 1, ["var", "radius"]],
            ],
          ],
        },
      },
    ],
  };

  var layer = L.maplibreGL({
    pane: "overlayPane",
    interactive: true,
    style: ingressStyle,
  });

  function onMapDataRefreshEnd() {
    for (var name of ["fields", "links", "portals"]) {
      refreshSource(name);
    }
  }

  function refreshSource(name) {
    if (!layer.getMaplibreMap()) return;
    var source = layer.getMaplibreMap().getSource(name);
    if (!source) return;
    sources[name] = new Map();
    for (var guid in window[name]) {
      var entity = window[name][guid];
      var geojson = entity.toGeoJSON();
      geojson.id = guidToID(guid);
      geojson.properties.type = name;
      geojson.properties.guid = guid;
      geojson.properties.team = entity.options.data.team;
      geojson.properties.level = entity.options.data.level;
      sources[name].set(guid, geojson);
    }
    source.setData({
      type: "FeatureCollection",
      features: Array.from(sources[name].values()),
    });
  }

  function onPortalSelected(d) {
    var prev = d.unselectedPortalGuid;
    var next = d.selectedPortalGuid;
    var map = layer.getMaplibreMap();
    if (!map) return;
    if (prev)
      map.setFeatureState(
        { id: guidToID(prev), source: "portals" },
        { selected: false }
      );
    if (next)
      map.setFeatureState(
        { id: guidToID(next), source: "portals" },
        { selected: true }
      );
  }

  function onPortalClick(e) {
    var portal = e.features[0];
    var guid = portal.properties.guid;
    window.renderPortalDetails(guid);
    // propagate click event
    if (guid in window.portals) {
      window.portals[guid].fire("click");
    }
  }

  var step = 0;
  let dashArraySeq = [
    [0, 4, 3],
    [1, 4, 2],
    [2, 4, 1],
    [3, 4, 0],
    [0, 1, 3, 3],
    [0, 2, 3, 2],
    [0, 3, 3, 1],
  ];
  var animation;
  function lineAnimate() {
    step = (step + 1) % dashArraySeq.length;
    if (!layer.getMaplibreMap()) return;
    layer
      .getMaplibreMap()
      .setPaintProperty("links", "line-dasharray", dashArraySeq[step]);
    setTimeout(() => {
      animation = requestAnimationFrame(lineAnimate);
    }, 50);
  }

  function onLayerInit(e) {
    if (e.layer === layer) {
      window.map.off("layeradd", onLayerInit);
      var map = layer.getMaplibreMap();
      map.scrollZoom.disable();
      layer.getContainer().style.zIndex = 101;
    }
  }

  function onLayerAdd(e) {
    if (e.layer !== layer) return;
    var map = layer.getMaplibreMap();
    map.off("click mouseenter mouseleave");
    map.on("click", "portals", onPortalClick);
    layer.getCanvas().style.cursor = "default";
    map.on("mouseenter", "portals", () => {
      layer.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "portals", () => {
      layer.getCanvas().style.cursor = "default";
    });
    onMapDataRefreshEnd();
    requestAnimationFrame(lineAnimate);
  }
  function onLayerRemove(e) {
    if (e.layer !== layer) return;
    cancelAnimationFrame(animation);
  }

  var oldprocessGameEntities = window.Render.prototype.processGameEntities;
  window.Render.prototype.processGameEntities = function (entities, details) {
    oldprocessGameEntities.call(this, entities, details);
    for (var name of ["fields", "links", "portals"]) {
      var data = [];
      for (var ent of entities) {
        var guid = ent[0];
        if (!(guid in window[name])) continue;
        var entity = window[name][guid];
        var geojson = entity.toGeoJSON();
        geojson.id = guidToID(guid);
        geojson.properties.type = name;
        geojson.properties.guid = guid;
        geojson.properties.team = entity.options.data.team;
        geojson.properties.level = entity.options.data.level;
        sources[name].set(guid, geojson);
      }
      if (!layer.getMaplibreMap()) continue;
      var source = layer.getMaplibreMap().getSource(name);
      source.setData({
        type: "FeatureCollection",
        features: Array.from(sources[name].values()),
      });
    }
  };
  window.map.on("layeradd", onLayerInit);
  window.map.on("layeradd", onLayerAdd);
  window.map.on("layerremove", onLayerRemove);

  //window.overlayStatus['GL Layers'] = false;
  window.addLayerGroup("GL Layers", layer, false);
  window.addHook("mapDataRefreshEnd", onMapDataRefreshEnd);
  window.addHook("portalDetailsUpdated", () => refreshSource("portals"));
  window.addHook("portalSelected", onPortalSelected);

  window.plugin.mapLibreLayers.layer = layer;
}

function setup() {
  if (!window.plugin.mapLibreGL) {
    alert("Maplibre Layers needs Maplibre GL JS to run.");
    throw "Missing Maplibre GL JS";
  }
  window.plugin.mapLibreLayers = {};
  window.plugin.mapLibreGL.load().then(mapInit);
}
