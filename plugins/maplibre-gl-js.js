// @author         jaiperdu
// @name           MapLibre GL JS
// @category       Misc
// @version        0.1.0
// @description    Maplibre GL JS dependency

window.plugin.mapLibreGL = {};

function addExternalScript(url) {
  var script = document.createElement("script");
  script.src = url;
  script.async = false;
  return document.head.appendChild(script);
}
function addExternalCSS(url) {
  var script = document.createElement("link");
  script.href = url;
  script.rel = "stylesheet";
  return document.head.appendChild(script);
}

window.plugin.mapLibreGL.load = function () {
  if (!window.plugin.mapLibreGL.promise) {
    window.plugin.mapLibreGL.promise = new Promise((resolve, reject) => {
      addExternalCSS("https://unpkg.com/maplibre-gl@1.14.0-rc.1/dist/maplibre-gl.css");
      var js = addExternalScript("https://unpkg.com/maplibre-gl@1.14.0-rc.1/dist/maplibre-gl.js");
      js.onload = () => {
        try {
          '@include_raw:external/leaflet-maplibre-gl.js@';
        } catch (e) {
          return reject(e);
        }

        $('<style>').prop('type', 'text/css').html('.leaflet-gl-layer.mapboxgl-map { position: absolute }').appendTo('head');
        resolve();
      };
      js.onerror = reject;
    });
  }
  return window.plugin.mapLibreGL.promise;
}

function setup() {}
