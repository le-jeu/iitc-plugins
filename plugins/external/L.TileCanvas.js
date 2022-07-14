// https://github.com/nheir/Leaflet.TileCanvas/blob/main/L.TileCanvas.js

// use mostly GridLayer method on events
L.TileCanvas = L.GridLayer.extend({
  options: {
    // overwrite L.GridLayer pane
    pane: "overlayPane",
  },

  initialize: function (options) {
    L.Util.setOptions(this, options);
    L.Util.stamp(this);
    this._layers = this._layers || {};
  },

  createTile: function () {
    var tile = L.DomUtil.create("canvas");

    var size = this.getTileSize();
    tile.width = size.x;
    tile.height = size.y;

    return tile;
  },

  onAdd: function () {
    L.GridLayer.prototype.onAdd.call(this);

    // from L.Canvas
    this.on("update", this._updatePaths, this);

    // Redraw vectors since canvas is cleared upon removal,
    // in case of removing the renderer itself from the map.
    this._draw();
  },

  onRemove: function () {
    L.GridLayer.prototype.onRemove.call(this);

    // from L.Canvas
    this.off("update", this._updatePaths, this);
  },

  getEvents: function () {
    var events = L.GridLayer.prototype.getEvents.call(this);
    events.zoomend = L.Canvas.prototype._onZoomEnd;
    return events;
  },

  _updateTransform: L.Util.falseFn,

  _initContainer: function () {
    if (this._container) {
      return;
    }

    L.GridLayer.prototype._initContainer.call(this);
    var container = this._container;

    L.DomEvent.on(container, "mousemove", this._onMouseMove, this);
    L.DomEvent.on(
      container,
      "click dblclick mousedown mouseup contextmenu",
      this._onClick,
      this
    );
    L.DomEvent.on(container, "mouseout", this._handleMouseOut, this);
  },

  _updateLevels: function () {
    L.GridLayer.prototype._updateLevels.call(this);

    // remove the 'pointer: none' preventing interactive
    this._level.el.classList.remove("leaflet-tile-container");
  },

  _addTile: function (coords, container) {
    L.GridLayer.prototype._addTile.call(this, coords, container);
    var key = this._tileCoordsToKey(coords);
    var tile = this._tiles[key];
    tile.needRedraw = true;

    // disable dom event on canvas tile
    tile.el["_leaflet_disable_events"] = true;
  },

  // disable 'move' event handler
  _onMove: L.Util.falseFn,

  _onMoveEnd: function () {
    if (!this._map || this._map._animatingZoom) {
      return;
    }

    L.GridLayer.prototype._onMoveEnd.call(this);
    this.fire("update");
  },

  _update: function (center) {
    L.GridLayer.prototype._update.call(this, center);

    // update bounds with respect to current tiles
    var tileRange = new L.Bounds();
    for (var key in this._tiles) {
      var tile = this._tiles[key];
      if (tile.current) {
        tileRange.extend(tile.coords);
      }
    }

    if (!tileRange.min) {
      // dummy Bounds to unsure this._bounds is well defined
      this._bounds = new L.Bounds([[0,0], [1,1]]);
    } else {
      // paths need this for cliping
      this._bounds = this._tileRangeToLayerPxBounds(tileRange);
    }
    // var pixelOrigin = this._map.getPixelOrigin();
    // this._bounds = window.map.getPixelWorldBounds();
    // this._bounds = new L.Bounds(
    //   this._bounds.min.subtract(pixelOrigin),
    //   this._bounds.max.subtract(pixelOrigin),
    // );
  },

  // because the vector.project referential differ from L.GridLayer referential
  // we need some conversion: mapping layer points with tile range
  _layerPxBoundsToTileRange: function (pxBounds) {
    var bounds = new L.Bounds();
    var pixelOrigin = this._map.getPixelOrigin();
    bounds.extend(pxBounds.min.add(pixelOrigin));
    bounds.extend(pxBounds.max.add(pixelOrigin));
    return this._pxBoundsToTileRange(bounds);
  },

  _tileRangeToLayerPxBounds: function (tileRange) {
    var tileSize = this.getTileSize();
    var pixelOrigin = this._map.getPixelOrigin();
    return new L.Bounds(
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
      this._redrawBounds = this._redrawBounds || new L.Bounds();
      this._redrawBounds.extend(
        layer._pxBounds.min.subtract([padding, padding])
      );
      this._redrawBounds.extend(layer._pxBounds.max.add([padding, padding]));
    }
  },

  _clearTile: function (tile) {
    var ctx = tile.el.getContext("2d");
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

    // Render each tile marked as dirty
    for (key in this._tiles) {
      tile = this._tiles[key];
      if (tile.needRedraw) {
        this._ctx = ctx = tile.el.getContext("2d");
        ctx.save();

        origin = this._getTilePos(tile.coords).add(translate);
        bounds = new L.Bounds();
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

  // inherit all other method from the Canvas/Renderer class
  _updatePaths: L.Canvas.prototype._updatePaths,

  _initPath: L.Canvas.prototype._initPath,
  _addPath: L.Canvas.prototype._addPath,
  _removePath: L.Canvas.prototype._removePath,
  _updatePath: L.Canvas.prototype._updatePath,

  _updateStyle: L.Canvas.prototype._updateStyle,
  _updateDashArray: L.Canvas.prototype._updateDashArray,

  _requestRedraw: L.Canvas.prototype._requestRedraw,
  _redraw: L.Canvas.prototype._redraw,

  _updatePoly: L.Canvas.prototype._updatePoly,
  _updateCircle: L.Canvas.prototype._updateCircle,
  _fillStroke: L.Canvas.prototype._fillStroke,

  _onClick: L.Canvas.prototype._onClick,
  _onMouseMove: L.Canvas.prototype._onMouseMove,
  _handleMouseOut: L.Canvas.prototype._handleMouseOut,
  _handleMouseHover: L.Canvas.prototype._handleMouseHover,
  _fireEvent: L.Canvas.prototype._fireEvent,
  _bringToFront: L.Canvas.prototype._bringToFront,
  _bringToBack: L.Canvas.prototype._bringToBack,
});

// Creates a TileCanvas renderer with the given options.
L.tileCanvas = function (options) {
  return L.Browser.canvas ? new L.TileCanvas(options) : null;
};
