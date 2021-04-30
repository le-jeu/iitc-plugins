// @author         jaiperdu
// @name           Default base maps with labels above fields
// @category       Map Tiles
// @version        0.2.3
// @description    Print labels as an overlay of intel layer


// use own namespace for plugin
window.plugin.labelsLayer = function() {};

window.plugin.labelsLayer.setup = function() {
  $('<style>').html('\
    .leaflet-pane.leaflet-labels-pane { z-index: 500; pointer-events: none }\
  ').appendTo('head');

  const baseLayers = {};

  // create panes for labels
  window.map.createPane('labels');

  const cartoAttr = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>';
  const cartoUrl = 'https://{s}.basemaps.cartocdn.com/{theme}/{z}/{x}/{y}.png';
  baseLayers['CartoDB Dark Matter'] = L.layerGroup([
    L.tileLayer(cartoUrl,{attribution:cartoAttr,theme:'dark_nolabels'}),
    L.tileLayer(cartoUrl,{attribution:cartoAttr,theme:'dark_only_labels', pane: 'labels'})
  ]);
  baseLayers['CartoDB Positron'] = L.layerGroup([
    L.tileLayer(cartoUrl,{attribution:cartoAttr,theme:'light_nolabels'}),
    L.tileLayer(cartoUrl,{attribution:cartoAttr,theme:'light_only_labels', pane: 'labels'})
  ]);

  // Google Maps - including ingress default (using the stock-intel API-key)
  baseLayers['Google Default Ingress Map'] = L.layerGroup([
    L.gridLayer.googleMutant(
      { type:'roadmap',
        maxZoom: 21,
        backgroundColor: '#0e3d4e',
        styles: [
            { featureType:"all", elementType:"all",
              stylers: [{visibility:"on"}, {hue:"#131c1c"}, {saturation:"-50"}, {invert_lightness:true}] },
            { featureType:"all", elementType:"labels", stylers: [{visibility:"off"}] },
            { featureType:"water", elementType:"all",
              stylers: [{visibility:"on"}, {hue:"#005eff"}, {invert_lightness:true}] },
            { featureType:"transit", elementType:"all", stylers:[{visibility:"off"}] }
          ],
      }),
    L.gridLayer.googleMutant(
      { type:'roadmap',
        maxZoom: 21,
        styles: [
            { featureType:"all", elementType:"all",
              stylers: [{visibility:"on"}, {hue:"#131c1c"}, {saturation:"-50"}, {invert_lightness:true}] },
            { featureType:"all", elementType:"geometry", stylers: [{visibility:"off"}] },
            { featureType:"poi", stylers:[{visibility:"off"}]},
            { featureType:"transit", elementType:"all", stylers:[{visibility:"off"}] }
          ],
        pane: 'labels'
      })
  ]);

  // replace stock basemaps
  for (const obj of window.layerChooser._layers)
    if (baseLayers[obj.name])
      obj.layer = baseLayers[obj.name];

  for (const name in baseLayers)
    baseLayers[name].on('add remove', window.layerChooser._onLayerChange, window.layerChooser);

  window.layerChooser._update();
};

var setup =  window.plugin.labelsLayer.setup;
