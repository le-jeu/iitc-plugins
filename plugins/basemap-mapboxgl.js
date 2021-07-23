// @author         jaiperdu
// @name           Mapbox Vector tiles
// @category       Map Tiles
// @version        0.1.1
// @description    Add the Mapbox GL vector tiles as base layers.

var mapTileMapbox = {};
window.plugin.mapTileMapbox = mapTileMapbox;

mapTileMapbox.token = 'your_token';

mapTileMapbox.styles = {
  'mapbox://styles/mapbox/streets-v11' : 'Street',
  'mapbox://styles/mapbox/outdoors-v11' : 'Outdoors',
  'mapbox://styles/mapbox/light-v10' : 'Light',
  'mapbox://styles/mapbox/dark-v10' : 'Dark',
  'mapbox://styles/mapbox/bright-v8' : 'Bright'
};

mapTileMapbox.layers = [];

function setup () {
  if (!window.plugin.mapLibreGL) {
    alert("Basemap MapBox needs Maplibre GL JS to run.");
    throw "Missing Maplibre GL JS";
  }
  window.plugin.mapLibreGL.load().then(() => {
    for(var style in mapTileMapbox.styles) {
      let name = mapTileMapbox.styles[style];
      let layer = L.maplibreGL({
        accessToken: mapTileMapbox.token,
        style: style
      });
      mapTileMapbox.layers.push(layer);
      layerChooser.addBaseLayer(layer, 'Mapbox ' + name);
    }
  });
};
