// @author         jaiperdu
// @name           Cadastre
// @category       Map Tiles
// @version        0.1.1
// @description    Overlay Cadastre

// Download and deploy tiles from
// https://cadastre.data.gouv.fr/data/etalab-cadastre/latest/mbtiles/france

const pbfTiles = "http://server/path/{z}/{x}/{y}.pbf"

function setup() {
  if (!window.plugin.mapLibreGL) {
    alert("Cadastre needs Maplibre GL JS to run.");
    throw "Missing Maplibre GL JS";
  }
  window.plugin.mapLibreGL.load().then(() => {
    var layer = L.maplibreGL({
      pane: 'overlayPane',
      style: {
        version: 8,
        name: "Cadastre",
        sources: {
          "cadastre": {
            type: "vector",
            tiles: [ pbfTiles ],
            minzoom: 11,
            maxzoom: 16,
          },
        },
        layers: [
          {
            id: "batiments",
            source: "cadastre",
            "source-layer": "batiments",
            type: "fill",
            minzoom: 17,
            paint: {
              "fill-color": "orange",
              "fill-opacity": .4,
            }
          },
          {
            id: "parcelles",
            source: "cadastre",
            "source-layer": "parcelles",
            type: "line",
            minzoom: 16,
            paint: {
              "line-color": "#555",
            }
          },
          {
            id: "sections",
            source: "cadastre",
            "source-layer": "sections",
            type: "line",
          },
        ]
      }
    });

    window.addLayerGroup('Cadastre', layer, false);
  });
}
