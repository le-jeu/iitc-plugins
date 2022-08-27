// ==UserScript==
// @author         jaiperdu
// @name           IITC plugin: d3js shpere
// @category       Misc
// @version        0.1.1
// @description    Add sphere preview
// @id             d3-sphere
// @namespace      https://github.com/IITC-CE/ingress-intel-total-conversion
// @updateURL      https://le-jeu.github.io/iitc-plugins/d3-sphere.user.js
// @downloadURL    https://le-jeu.github.io/iitc-plugins/d3-sphere.user.js
// @match          https://intel.ingress.com/*
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'lejeu';
plugin_info.dateTimeVersion = '2022-06-30-074250';
plugin_info.pluginId = 'd3-sphere';
//END PLUGIN AUTHORS NOTE

function addExternalScript(url) {
  var script = document.createElement("script");
  script.src = url;
  return document.head.appendChild(script);
}

function onloadPromise(script) {
  return new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = reject;
  });
}

var scriptsPromise = Promise.all(
  [
    "https://cdn.jsdelivr.net/npm/d3-array@3",
    "https://cdn.jsdelivr.net/npm/d3-geo@3",
    "https://cdn.jsdelivr.net/npm/d3-interpolate@3",
    "https://cdn.jsdelivr.net/npm/d3-ease@3",
    "https://cdn.jsdelivr.net/npm/d3-dispatch@3",
    "https://cdn.jsdelivr.net/npm/d3-timer@3",
    "https://cdn.jsdelivr.net/npm/d3-selection@3",
    "https://cdn.jsdelivr.net/npm/d3-transition@3",
  ].map((url) => onloadPromise(addExternalScript(url)))
);

function loop(as) {
  as.push(as[0]);
  return as;
}

let countries;
const countriesPromise = fetch('https://raw.githubusercontent.com/AshKyd/geojson-regions/master/countries/110m/all.geojson')
  .then(r => r.json())
  .then(j => (countries = j));

function latlng2array(c) {
  return [c.lat, c.lng];
}

function setup() {
  // wait for d3 loading
  scriptsPromise.then(delayedSetup).catch(() => {
    window.alert("d3-sphere: fail to load d3js dependencies");
  });
}

function delayedSetup(e) {
  console.log(e);
  const projection = d3.geoOrthographic();
  
  const outline = ({type: "Sphere"});
  const graticule = d3.geoGraticule10();

  L.Control.MiniGlobe = L.Control.extend({
    options: {
      size: 250,
    },

    onAdd: function(map) {
      const width = this.options.size;
      const [[x0, y0], [x1, y1]] = d3.geoPath(projection.fitWidth(width, outline)).bounds(outline);
      const dy = Math.ceil(y1 - y0), l = Math.min(Math.ceil(x1 - x0), dy);
      this._baseZoom = projection.scale() * (l - 1) / l;
      projection.scale(this._baseZoom).precision(0.2);
      const height = dy;

      const canvas = L.DomUtil.create('canvas');
      const context = canvas.getContext('2d');
      canvas.width = width;
      canvas.height = height;

      this._ctx = context;
      this._path = d3.geoPath(projection, context);

      window.map.on('move', this._refresh, this);
      window.map.on('zoomanim', this._onZoomAnim, this);

      window.addHook('mapDataRefreshEnd', () => this._refresh());
      window.addHook('linkAdded', (e) => this._renderLink(e.link));
      window.addHook('fieldAdded', (e) => this._renderField(e.field));

      countriesPromise.then(() => this._refresh());

      return canvas;
    },

    _clear() {
      this._ctx.clearRect(0, 0, this.options.size, this.options.size);
    },

    _refresh() {
      this._render(latlng2array(window.map.getCenter()), window.map.getZoom());
    },

    _onZoomAnim(e) {
      const originZoom = window.map.getZoom();
      const targetZoom = e.zoom;
      const originCenter = latlng2array(window.map.getCenter());
      const targetCenter = latlng2array(e.center);
      const iz = d3.interpolateNumber(originZoom, targetZoom);
      const ic = d3.interpolateArray(originCenter, targetCenter);

      d3.transition()
        .duration(1000)
        .ease(d3.easeLinear)
        .tween("render", () => t => {
          this._render(ic(t), iz(t));
        });
    },

    _render(center, zoom) {
      const context = this._ctx;
      const path = this._path;
      const rotate = [-center[1], -center[0]];

      context.globalAlpha = 1;
      this._clear();
      
      projection.rotate(rotate).scale(this._baseZoom * 2**(zoom-3));

      context.save();
      context.globalAlpha = 0.8;
      context.beginPath(), path(outline), context.clip(), context.fillStyle = "#000", context.fillRect(0, 0, this.options.size, this.options.size);

      context.beginPath(), path(graticule), context.strokeStyle = "#222", context.stroke();

      if (countries) {
        context.beginPath(), path(countries), context.fillStyle = "#444", context.fill();
      }
      /* Links */
      context.beginPath();
      path({ 
        type: "GeometryCollection", 
        geometries: Object.values(window.links)
          .filter((l) => l.options.team == 1)
          .map((l) => ({
            type: "LineString", 
            coordinates: [
              [l.options.data.oLngE6/1E6,l.options.data.oLatE6/1E6],
              [l.options.data.dLngE6/1E6,l.options.data.dLatE6/1E6]
            ]
          }))
      });
      context.strokeStyle = window.COLORS[1], context.stroke();
      context.beginPath();
      path({ 
        type: "GeometryCollection", 
        geometries: Object.values(window.links)
          .filter((l) => l.options.team == 2)
          .map((l) => ({
            type: "LineString", 
            coordinates: [
              [l.options.data.oLngE6/1E6,l.options.data.oLatE6/1E6],
              [l.options.data.dLngE6/1E6,l.options.data.dLatE6/1E6]
            ]
          }))
      });
      context.strokeStyle = window.COLORS[2], context.stroke();
      /* Fields */
      for (const guid in window.fields) {
        this._renderField(window.fields[guid]);
      }
      context.restore();
      context.beginPath(), path(outline), context.strokeStyle = "#111", context.stroke();
    },

    _renderLink(l) {
      const context = this._ctx;
      const path = this._path;
      context.globalAlpha = 0.8;
      context.beginPath();
      path({
        type: "LineString", 
        coordinates: [
          [l.options.data.oLngE6/1E6,l.options.data.oLatE6/1E6],
          [l.options.data.dLngE6/1E6,l.options.data.dLatE6/1E6]
        ]
      });
      context.strokeStyle = window.COLORS[l.options.team], context.stroke();
    },

    _renderField(f) {
      const context = this._ctx;
      const path = this._path;
      context.globalAlpha = 0.5;
      context.beginPath();
      path({
        type: "LineString", 
        coordinates: loop(f.options.data.points.map((p) => [
          p.lngE6/1E6, p.latE6/1E6
        ]))
      });
      context.fillStyle = window.COLORS[f.options.team], context.fill();
    },
  });

  L.control.miniGlobe = function(opts) {
      return new L.Control.MiniGlobe(opts);
  }

  L.control.miniGlobe({ position: 'bottomleft' }).addTo(map);
}
setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);

