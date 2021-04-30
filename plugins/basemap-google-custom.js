// @author         jaiperdu
// @name           Custom Google map
// @category       Map Tiles
// @version        0.1.2
// @description    Add a customizable Version of Google map tiles as a base layer.


// use own namespace for plugin
const customGMaps = function() {};
window.plugin.customGMaps = customGMaps;

customGMaps.styles = [];
customGMaps.STYLES_KEY = "plugin-custom-gmaps-styles";

customGMaps.addLayer = function() {
  const options = {
    maxZoom: 21,
    styles: customGMaps.styles
  };

  customGMaps.baseLayer = L.gridLayer.googleMutant(options);

  layerChooser.addBaseLayer(customGMaps.baseLayer, "Google Custom");
};

customGMaps.changeStyle = function(styles) {
  customGMaps.baseLayer.addTo(map);
  customGMaps.baseLayer._mutant.setOptions({ styles: styles });
  customGMaps.styles = styles;
  localStorage[customGMaps.STYLES_KEY] = JSON.stringify(styles);
};

customGMaps.getAllCurrentStyles = function () {
  const styles = new Map();
  for (const l of layerChooser._layers) {
    const name = l.name;
    const layer = l.layer;
    if (layer instanceof L.GridLayer.GoogleMutant) {
      if (layer.options.styles !== undefined)
        styles.set(name, layer.options.styles);
    } else if (layer._layers) {
      const layers = layer._layers;
      for (const i in layers) {
        const layer = layers[i];
        if (layer instanceof L.GridLayer.GoogleMutant) {
          if (layer.options.styles !== undefined)
            styles.set(name + '#' + i, layer.options.styles);
        }
      }
    }
  }
  return styles;
};

customGMaps.showDialog = function() {
  const div = document.createElement('div');

  const selectStyle = document.createElement('select');
  const styles = customGMaps.getAllCurrentStyles();
  for (const [name, styles] of customGMaps.getAllCurrentStyles()) {
    const option = document.createElement('option');
    option.textContent = name;
    option.value = name;
    selectStyle.appendChild(option);
  }
  selectStyle.value = "Google Custom";
  div.appendChild(selectStyle);

  const styleInput = document.createElement('textarea');
  styleInput.value = JSON.stringify(customGMaps.styles, null, 2);
  div.appendChild(styleInput);

  const desc = document.createElement('div');
  desc.innerHTML = "You can use the <a 'href=https://mapstyle.withgoogle.com/'>Styling wizard</a> from Google to import/export a style and paste it in the above area";
  div.appendChild(desc);

  selectStyle.addEventListener('change', function() {
    const value = selectStyle.value;
    const style = styles.get(value);
    console.log(style);
    if (style) {
      styleInput.value = JSON.stringify(style, null, 2);
    }
  });

  const buttons = {
    "OK": function () {
      try {
        const styles = JSON.parse(styleInput.value);
        customGMaps.changeStyle(styles);
        $(this).dialog('close');
      } catch(e) {
        console.error(e);
        alert("Couldn't parse the style");
      }
    },
    "Cancel": function () {
      $(this).dialog('close');
    }
  }

  dialog({
    id: 'plugin-custom-gmaps',
    html: div,
    title: 'Change Google Maps style',
    width: 'auto',
    buttons: buttons
  });
};

var setup = function() {
  $("<style>")
    .prop("type", "text/css")
    .html("#dialog-lugin-custom-gmaps select { display: block }\
           #dialog-plugin-custom-gmaps textarea { width: 100%; min-height:250px; font-family: monospace }")
  .appendTo("head");

  customGMaps.styles = JSON.parse(localStorage[customGMaps.STYLES_KEY] || '[]');

  $('#toolbox').append(' <a onclick="window.plugin.customGMaps.showDialog()">Custom GMaps Style</a>');

  customGMaps.addLayer();
}
