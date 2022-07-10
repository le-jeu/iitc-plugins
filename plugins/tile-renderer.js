// @author         jaiperdu
// @name           Tile rendering using canvas
// @category       Tweaks
// @version        0.2.1
// @description    Render vector layers and ornaments with canvas tiles

function setup() {
  '@include_raw:external/L.TileCanvas.js@';

  // CanvasMarker shares more similarity with CircleMarker than Marker
  const CanvasMarker = L.CircleMarker.extend({
    options: {
      // the icon must have options with iconUrl, iconSize and iconAnchor
      icon: new L.Icon.Default(),
    },

    initialize: function (latlng, options) {
      L.Util.setOptions(this, options);
      this._latlng = L.latLng(latlng);
    },

    _initIcon: function () {
      var img = new Image();
      var iconUrl = this.options.icon.options.iconUrl;
      img.src = iconUrl;
      this._canvasImg = img;
      img.onload = this.redraw.bind(this);
    },

    onAdd: function () {
      this._renderer._initPath(this);
      this._initIcon();
      this._reset();
      this._renderer._addPath(this);
    },

    _updateBounds: function () {
      var options = this.options.icon.options;
      var w = this._clickTolerance(),
        p = [w, w],
        anchor = this._point.subtract(options.iconAnchor);
      this._pxBounds = new L.Bounds(
        anchor.subtract(p),
        anchor.add(options.iconSize).add(p)
      );
    },

    _updatePath: function () {
      var options = this.options.icon.options;
      var pos = this._point.subtract(options.iconAnchor);
      var ctx = this._renderer._ctx;
      ctx.save();
      ctx.globalAlpha = this.options.opacity;
      ctx.drawImage(
        this._canvasImg,
        pos.x,
        pos.y,
        options.iconSize[0],
        options.iconSize[1]
      );
      ctx.restore();
    },

    _empty: function () {
      return (
        this._canvasImg && !this._renderer._bounds.intersects(this._pxBounds)
      );
    },
  });

  // Creates a CanvasMarker (using current map canvas renderer).
  function canvasMarker(latlng, options) {
    return new CanvasMarker(latlng, options);
  }

  // don't use the canvasicon layer
  window.DISABLE_CANVASICONLAYER = true;

  if (window.mapOptions) {
    // iitc > 0.32
    window.mapOptions.renderer = L.tileCanvas({
      pane: "overlayPane",
      tolerance: 0,
    });
  } else {
    // fallback for iitc <= 0.32
    window.addHook("iitcLoaded", () => {
      window.map.options.renderer = L.tileCanvas({
        pane: "overlayPane",
        tolerance: 0,
      });
    });
  }

  // use the tilecanvas renderer for ornaments too
  window.ornaments.addPortal = function (portal) {
    this.removePortal(portal);

    var ornaments = portal.options.data.ornaments;
    if (ornaments && ornaments.length) {
      this._portals[portal.options.guid] = ornaments.map(function (ornament) {
        var layer = this._layer;
        if (ornament.startsWith("pe")) {
          layer = ornament === "peFRACK" ? this._frackers : this._beacons;
        }
        var size = this.OVERLAY_SIZE;
        return canvasMarker(portal.getLatLng(), {
          icon: L.icon({
            iconUrl:
              "//commondatastorage.googleapis.com/ingress.com/img/map_icons/marker_images/" +
              ornament +
              ".png",
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          }),
          interactive: false,
          keyboard: false,
          opacity: this.OVERLAY_OPACITY,
          layer: layer,
        }).addTo(layer);
      }, this);
    }
  };
}

setup.priority = "boot";
