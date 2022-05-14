// @author         jaiperdu
// @name           Tile rendering using canvas
// @category       Tweaks
// @version        0.2.1
// @description    Render vector layers and ornaments with canvas tiles

function setup() {
  const DomEvent = L.DomEvent;
  const Browser = L.Browser;
  const Util = L.Util;
  const Bounds = L.Bounds;
  const GridLayer = L.GridLayer;
  const Canvas = L.Canvas;
  const CircleMarker = L.CircleMarker;
  const toLatLng = L.latLng;
  const IconDefault = L.Icon.Default;

  const TileCanvas = GridLayer.extend({
    options: {
      // overwrite GridLayer pane
      pane: 'overlayPane',
    },

    initialize: function (options) {
      Util.setOptions(this, options);
      Util.stamp(this);
      this._layers = this._layers || {};
    },

    createTile: function () {
      var tile = L.DomUtil.create('canvas');

      var size = this.getTileSize();
      tile.width = size.x;
      tile.height = size.y;

      return tile;
    },

    onAdd: function () {
      GridLayer.prototype.onAdd.call(this);

      // from L.Canvas
      this.on('update', this._updatePaths, this);

      // Redraw vectors since canvas is cleared upon removal,
      // in case of removing the renderer itself from the map.
      this._draw();
    },

    onRemove: function () {
      GridLayer.prototype.onRemove.call(this);

      // from L.Canvas
      this.off('update', this._updatePaths, this);
    },

    getEvents: function () {
      var events = GridLayer.prototype.getEvents.call(this);
      events.zoomend = Canvas.prototype._onZoomEnd;
      return events;
    },

    _updateTransform: Util.falseFn,

    _initContainer: function () {
      if (this._container) {
        return;
      }

      GridLayer.prototype._initContainer.call(this);
      var container = this._container;

      DomEvent.on(container, 'mousemove', this._onMouseMove, this);
      DomEvent.on(
        container,
        'click dblclick mousedown mouseup contextmenu',
        this._onClick,
        this
      );
      DomEvent.on(container, 'mouseout', this._handleMouseOut, this);
    },

    _updateLevels: function () {
      GridLayer.prototype._updateLevels.call(this);

      // remove the 'pointer: none' preventing interactive
      this._level.el.classList.remove('leaflet-tile-container');
    },

    _addTile: function (coords, container) {
      GridLayer.prototype._addTile.call(this, coords, container);
      var key = this._tileCoordsToKey(coords);
      var tile = this._tiles[key];
      tile.needRedraw = true;
      tile.bounds = this._tileCoordsToBounds(tile.coords);
      // disable dom event on canvas tile
      tile.el['_leaflet_disable_events'] = true;
    },

    _onMove: Util.falseFn,
    _onMoveEnd: function () {
      if (!this._map || this._map._animatingZoom) {
        return;
      }

      GridLayer.prototype._onMoveEnd.call(this);
      this.fire('update');
    },

    _update: function (center) {
      GridLayer.prototype._update.call(this, center);

      // update bounds with respect to current tiles
      var tileRange = new Bounds();
      for (var key in this._tiles) {
        var tile = this._tiles[key];
        if (tile.current) {
          tileRange.extend(tile.coords);
        }
      }
      this._bounds = this._tileRangeToLayerPxBounds(tileRange);
    },

    // because the vector.project referential differ from GridLayer referential
    // we need some conversion: mapping layer points with tile range
    _layerPxBoundsToTileRange: function (pxBounds) {
      var bounds = new Bounds();
      var pixelOrigin = this._map.getPixelOrigin();
      bounds.extend(pxBounds.min.add(pixelOrigin));
      bounds.extend(pxBounds.max.add(pixelOrigin));
      return this._pxBoundsToTileRange(bounds);
    },

    _tileRangeToLayerPxBounds: function (tileRange) {
      var tileSize = this.getTileSize();
      var pixelOrigin = this._map.getPixelOrigin();
      return new Bounds(
        tileRange.min.scaleBy(tileSize).subtract(pixelOrigin),
        tileRange.max.add([1, 1]).scaleBy(tileSize).subtract(pixelOrigin)
      );
    },

    _extendRedrawBounds: function (layer) {
      if (
        layer._pxBounds &&
        isFinite(layer._pxBounds.min.x) &&
        isFinite(layer._pxBounds.min.y) &&
        isFinite(layer._pxBounds.max.x) &&
        isFinite(layer._pxBounds.max.y)
      ) {
        var padding = (layer.options.weight || 0) + 1;
        this._redrawBounds = this._redrawBounds || new Bounds();
        this._redrawBounds.extend(
          layer._pxBounds.min.subtract([padding, padding])
        );
        this._redrawBounds.extend(layer._pxBounds.max.add([padding, padding]));
      }
    },

    _clearTile: function (tile) {
      var ctx = tile.el.getContext('2d');
      ctx.clearRect(0, 0, tile.el.width, tile.el.height);
      tile.needRedraw = true;
    },

    _clear: function () {
      // clear entire tiles that intersect the redraw bounds
      var key,
        tile,
        tileRange = this._redrawBounds;
      if (tileRange) {
        tileRange = this._layerPxBoundsToTileRange(this._redrawBounds);
        for (key in this._tiles) {
          tile = this._tiles[key];
          if (tile.current && tileRange.contains(tile.coords)) {
            this._clearTile(tile);
          }
        }
      }
    },

    _draw: function () {
      if (this._map._animatingZoom) {
        return;
      }

      var layer, bounds;
      var tile, ctx, key, origin, translate;

      // vector difference between tile and vector projection referentials
      translate = this._level.origin.subtract(this._map.getPixelOrigin());

      this._drawing = true;

      // Render each tile marked as unclean
      for (key in this._tiles) {
        tile = this._tiles[key];
        if (tile.needRedraw) {
          this._ctx = ctx = tile.el.getContext('2d');
          ctx.save();

          origin = this._getTilePos(tile.coords).add(translate);
          bounds = new Bounds();
          bounds.extend(origin);
          bounds.extend(origin.add(this.getTileSize()));
          ctx.translate(-origin.x, -origin.y);

          // filter layers that interesects the tile (bounds)
          for (var order = this._drawFirst; order; order = order.next) {
            layer = order.layer;
            if (layer._pxBounds && layer._pxBounds.intersects(bounds)) {
              layer._updatePath();
            }
          }

          ctx.restore();
          delete tile.needRedraw;
        }
      }

      this._drawing = false;
    },

    _updatePaths: Canvas.prototype._updatePaths,

    _initPath: Canvas.prototype._initPath,
    _addPath: Canvas.prototype._addPath,
    _removePath: Canvas.prototype._removePath,
    _updatePath: Canvas.prototype._updatePath,

    _updateStyle: Canvas.prototype._updateStyle,
    _updateDashArray: Canvas.prototype._updateDashArray,

    _requestRedraw: Canvas.prototype._requestRedraw,
    _redraw: Canvas.prototype._redraw,

    _updatePoly: Canvas.prototype._updatePoly,
    _updateCircle: Canvas.prototype._updateCircle,
    _fillStroke: Canvas.prototype._fillStroke,

    _onClick: Canvas.prototype._onClick,
    _onMouseMove: Canvas.prototype._onMouseMove,
    _handleMouseOut: Canvas.prototype._handleMouseOut,
    _handleMouseHover: Canvas.prototype._handleMouseHover,
    _fireEvent: Canvas.prototype._fireEvent,
    _bringToFront: Canvas.prototype._bringToFront,
    _bringToBack: Canvas.prototype._bringToBack,
  });

  // CanvasMarker shares more similarity with CircleMarker than Marker
  const CanvasMarker = CircleMarker.extend({
    options: {
      // the icon must have options with iconUrl, iconSize and iconAnchor
      icon: new IconDefault(),
    },

    initialize: function (latlng, options) {
      Util.setOptions(this, options);
      this._latlng = toLatLng(latlng);
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
      this._pxBounds = new Bounds(
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

  // Creates a TileCanvas renderer with the given options.
  function tileCanvas(options) {
    return Browser.canvas ? new TileCanvas(options) : null;
  }

  // Creates a CanvasMarker (using current map canvas renderer).
  function canvasMarker(latlng, options) {
    return new CanvasMarker(latlng, options);
  }

  // don't use the canvasicon layer
  window.DISABLE_CANVASICONLAYER = true;

  if (window.mapOptions) {
    // iitc > 0.32
    window.mapOptions.renderer = tileCanvas({
      pane: 'overlayPane',
      tolerance: 0,
    });
  } else {
    // fallback for iitc <= 0.32
    window.addHook('iitcLoaded', () => {
      window.map.options.renderer = tileCanvas({
        pane: 'overlayPane',
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
        if (ornament.startsWith('pe')) {
          layer = ornament === 'peFRACK' ? this._frackers : this._beacons;
        }
        var size = this.OVERLAY_SIZE;
        return canvasMarker(portal.getLatLng(), {
          icon: L.icon({
            iconUrl:
              '//commondatastorage.googleapis.com/ingress.com/img/map_icons/marker_images/' +
              ornament +
              '.png',
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

setup.priority = 'boot';
