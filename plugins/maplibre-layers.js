// @author         jaiperdu
// @name           MapLibre GL Layers
// @category       Map Tiles
// @version        0.1.0
// @description    GL layers

function addExternalScript(url) {
  var script = document.createElement("script");
  script.src = url;
  document.head.appendChild(script);
}
function addExternalCSS(url) {
  var script = document.createElement("link");
  script.href = url;
  script.rel = "stylesheet";
  document.head.appendChild(script);
}
addExternalScript("https://unpkg.com/maplibre-gl@1.14.0-rc.1/dist/maplibre-gl.js");
addExternalCSS("https://unpkg.com/maplibre-gl@1.14.0-rc.1/dist/maplibre-gl.css");

function setup() {
  try {
    '@include_raw:external/leaflet-maplibre-gl.js@';
  } catch (e) {
    console.error(e);
    return;
  }

  $('<style>').prop('type', 'text/css').html('.leaflet-overlay-pane .leaflet-gl-layer { z-index: 101; }').appendTo('head');

  var sources = {
    fields: new Map(),
    links: new Map(),
    portals: new Map(),
  };

  var layer = L.maplibreGL({
    pane: 'overlayPane',
    interactive: true,
    style: {
      version: 8,
      name: "GL layers",
      sources: {
        "fields": {
          type: "geojson",
          data: { "type": "FeatureCollection", "features": [] },
        },
        "links": {
          type: "geojson",
          data: { "type": "FeatureCollection", "features": [] },
        },
        "portals": {
          type: "geojson",
          data: { "type": "FeatureCollection", "features": [] },
        },
      },
      layers: [
        {
          id: "fields",
          source: "fields",
          type: "fill",
          paint: {
            "fill-color": [
              'match',
              ['get', 'team'],
              'R', '#0088FF',
              'E', '#03DC03',
              '#FF6600'
            ],
            "fill-opacity": .4,
            "fill-antialias": false,
          }
        },
        {
          id: "links",
          source: "links",
          type: "line",
          paint: {
            "line-width": 2,
            "line-color": [
              'match',
              ['get', 'team'],
              'R', '#0088FF',
              'E', '#03DC03',
              '#FF6600'
            ],
          }
        },
        {
          id: "portals",
          source: "portals",
          type: "circle",
          paint: {
            "circle-color": [
              'match',
              ['get', 'team'],
              'R', '#0088FF',
              'E', '#03DC03',
              '#FF6600'
            ],
            "circle-stroke-color": [
              'match',
              ['get', 'team'],
              'R', '#0088FF',
              'E', '#03DC03',
              '#FF6600'
            ],
            'circle-stroke-width': [
              'interpolate' , ["linear"], ["get", "level"],
              0, 2,
              8, 4,
            ],
            "circle-opacity": .5,
            'circle-radius': [
              'interpolate' , ["linear"], ["zoom"],
              7, [
                '*', .5, [
                    'interpolate' , ["linear"], ["get", "level"],
                    0, 7,
                    8, 11,
                  ]
                ],
              16, [
                '*', 1.2, [
                  'interpolate' , ["linear"], ["get", "level"],
                  0, 7,
                  8, 11,
                ]
              ],
            ],
          }
        },
      ]
    }
  });

  function onMapDataRefreshEnd() {
    for (var name of ['fields', 'links', 'portals']) {
      sources[name] = new Map();
      for (var guid in window[name]) {
        var entity = window[name][guid];
        var geojson = entity.toGeoJSON();
        geojson.properties.type = name;
        geojson.properties.guid = guid;
        geojson.properties.team = entity.options.data.team;
        geojson.properties.level = entity.options.data.level;
        sources[name].set(guid, geojson);
      }
      if (!layer.getMaplibreMap()) continue;
      var source = layer.getMaplibreMap().getSource(name);
      source.setData({ "type": "FeatureCollection", "features": Array.from(sources[name].values()) });
    }
  }

  function onPortalClick (e) {
    console.log('click');
    var portal = e.features[0];
    window.renderPortalDetails(portal.properties.guid);
  }

  function onLayerInit(e) {
    if (e.layer === layer) {
      window.map.off('layeradd', onLayerInit);
      console.log('on portal click');
      layer.getMaplibreMap().on('click', 'portals', onPortalClick)

      var animationStep = 50;
      var step = 0;
      let dashArraySeq = [
          [0, 4, 3],
          [1, 4, 2],
          [2, 4, 1],
          [3, 4, 0],
          [0, 1, 3, 3],
          [0, 2, 3, 2],
          [0, 3, 3, 1]
      ];
      setInterval(() => {
        step = (step + 1) % dashArraySeq.length;
        if (!layer.getMaplibreMap()) return;
        layer.getMaplibreMap().setPaintProperty("links", 'line-dasharray', dashArraySeq[step]);
      }, animationStep);
    }
  }

  var oldprocessGameEntities = window.Render.prototype.processGameEntities;
  window.Render.prototype.processGameEntities = function(entities, details) {
    oldprocessGameEntities.call(this, entities, details);
    for (var name of ['fields', 'links', 'portals']) {
      var data = [];
      for (var ent of entities) {
        var guid = ent[0];
        if (!(guid in window[name])) continue;
        var entity = window[name][guid];
        var geojson = entity.toGeoJSON();
        geojson.properties.type = name;
        geojson.properties.guid = guid;
        geojson.properties.team = entity.options.data.team;
        geojson.properties.level = entity.options.data.level;
        sources[name].set(guid, geojson);
      }
      if (!layer.getMaplibreMap()) continue;
      var source = layer.getMaplibreMap().getSource(name);
      source.setData({ "type": "FeatureCollection", "features": Array.from(sources[name].values()) });
    }
  }
  window.map.on('layeradd', onLayerInit);

  //window.overlayStatus['GL Layers'] = false;
  window.addLayerGroup('GL Layers', layer, false);
  window.addHook('mapDataRefreshEnd', onMapDataRefreshEnd);
}
