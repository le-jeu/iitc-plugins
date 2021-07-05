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
    fields: { "type": "FeatureCollection", "features": [] },
    links: { "type": "FeatureCollection", "features": [] },
    portals: { "type": "FeatureCollection", "features": [] },
  };

  var layer = L.maplibreGL({
    pane: 'overlayPane',
    //interactive: true,
    style: {
      version: 8,
      name: "GL layers",
      sources: {
        "fields": {
          type: "geojson",
          data: sources.fields,
        },
        "links": {
          type: "geojson",
          data: sources.links,
        },
        "portals": {
          type: "geojson",
          data: sources.portals,
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
    if (!layer.getMaplibreMap()) return;
    for (var name of ['fields', 'links', 'portals']) {
      var source = layer.getMaplibreMap().getSource(name);
      var data = [];
      for (var guid in window[name]) {
        var entity = window[name][guid];
        var geojson = entity.toGeoJSON();
        geojson.properties.type = name;
        geojson.properties.guid = guid;
        geojson.properties.team = entity.options.data.team;
        geojson.properties.level = entity.options.data.level;
        data.push(geojson);
      }
      sources[name].features = data;
      source.setData(sources[name]);
    }
  }

  function onPortalClick (e) {
    console.log('click');
    var portal = e.features[0];
    window.renderPortalDetails(portal.properties.guid);
  }

  function registerPortalClick(e) {
    if (e.layer === layer) {
      console.log('on portal click');
      layer.getMaplibreMap().on('click', 'portals', onPortalClick)
      window.map.off('layeradd', registerPortalClick);

      // var animationStep = 50;
      // var step = 0;
      // let dashArraySeq = [
      //     [0, 4, 3],
      //     [1, 4, 2],
      //     [2, 4, 1],
      //     [3, 4, 0],
      //     [0, 1, 3, 3],
      //     [0, 2, 3, 2],
      //     [0, 3, 3, 1]
      // ];
      // setInterval(() => {
      //   step = (step + 1) % dashArraySeq.length;
      //   if (!layer.getMaplibreMap()) return;
      //   layer.getMaplibreMap().setPaintProperty("links", 'line-dasharray', dashArraySeq[step]);
      // }, animationStep);
    }
  }
  window.map.on('layeradd', registerPortalClick);

  //window.overlayStatus['GL Layers'] = false;
  window.addLayerGroup('GL Layers', layer, false);
  window.addHook('mapDataRefreshEnd', onMapDataRefreshEnd);
}
