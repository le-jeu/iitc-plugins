
// ==UserScript==
// @author        jaiperdu
// @name          IITC plugin: Redfection
// @category      Info
// @version       0.2.2
// @description   Show redfection portals and links
// @id            redfection
// @namespace     https://github.com/IITC-CE/ingress-intel-total-conversion
// @updateURL     https://le-jeu.github.io/iitc-plugins/redfection.user.js
// @downloadURL   https://le-jeu.github.io/iitc-plugins/redfection.user.js
// @match         https://intel.ingress.com/*
// @grant         none
// ==/UserScript==
function wrapper(plugin_info) {

// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

/* Filters API

Filters work by exclusion, following the old layer system.
A feature that matches a filter is removed from the map.
A filter applies to a combinaison of portal/link/field and is described by
 - data properties that must (all) match
 - or a predicate for complex filter

  { portal: true, link: true, data: { team: 'E' }}
      filters any ENL portal/link

  [{ link: true, data: { oGuid: "some guid" }}, { link: true, data: { dGuid: "some guid" }}]
      filters any links on portal with guid "some guid"

  { field: true, pred: function (f) { return f.options.timestamp < Date.parse('2021-10-31'); } }
      filters any fields made before Halloween 2021
*/

/**
 * @type {Object.<string, FilterDesc>}
 */
const _filters = {};

/**
 * @callback FilterPredicate
 * @param {Object} ent - IITC entity
 * @returns {boolean}
 */

/**
 * @typedef FilterDesc
 * @type {object}
 * @property {boolean} filterDesc.portal         apply to portal
 * @property {boolean} filterDesc.link           apply to link
 * @property {boolean} filterDesc.field          apply to field
 * @property {object} [filterDesc.data]          entity data properties that must match
 * @property {FilterPredicate} [filterDesc.pred] predicate on the entity
 */

/**
 * @param {string} name                              filter name
 * @param {FilterDesc | FilterDesc[]} filterDesc     filter description (OR)
 */
function set(name, filterDesc) {
  _filters[name] = filterDesc;
}

function remove(name) {
  return delete _filters[name];
}

function simpleFilter(type, entity, filter) {
  // type must match
  if (!filter[type]) return false;
  // use predicate if available
  if (typeof filter.pred === 'function') return filter.pred(entity);
  // if no constraint, match
  if (!filter.data) return true;
  // else must match all constraints
  for (const prop in filter.data) if (entity.options.data[prop] !== filter.data[prop]) return false;
  return true;
}

function arrayFilter(type, entity, filters) {
  if (!Array.isArray(filters)) filters = [filters];
  filters = filters.flat();
  for (let i = 0; i < filters.length; i++) if (simpleFilter(type, entity, filters[i])) return true;
  return false;
}

/**
 *
 * @param {object} portal Portal to test
 * @returns {boolean} `true` if the the portal matches one of the filters
 */
function filterPortal(portal) {
  return arrayFilter('portal', portal, Object.values(_filters));
}

/**
 *
 * @param {object} link Link to test
 * @returns {boolean} `true` if the the link matches one of the filters
 */
function filterLink(link) {
  return arrayFilter('link', link, Object.values(_filters));
}

/**
 *
 * @param {object} field Field to test
 * @returns {boolean} `true` if the the field matches one of the filters
 */
function filterField(field) {
  return arrayFilter('field', field, Object.values(_filters));
}

function filterEntities() {
  for (const guid in window.portals) {
    const p = window.portals[guid];
    if (filterPortal(p)) p.remove();
    else p.addTo(window.map);
  }
  for (const guid in window.links) {
    const link = window.links[guid];
    if (filterLink(link)) link.remove();
    else link.addTo(window.map);
  }
  for (const guid in window.fields) {
    const field = window.fields[guid];
    if (filterField(field)) field.remove();
    else field.addTo(window.map);
  }
}

/**
 * @class FilterLayer
 * @description Layer abstraction to control with the layer chooser a filter.
 *              The filter is disabled on layer add, and enabled on layer remove.
 * @extends L.Layer
 * @param {{name: string, filter: FilterDesc}} options
 */
let FilterLayer = null;

function filterLayer(options) {
  if (!FilterLayer) {
    FilterLayer = L.Layer.extend({
      options: {
        name: null,
        filter: {},
      },

      initialize: function (options) {
        L.setOptions(this, options);
        set(this.options.name, this.options.filter);
      },

      onAdd: function () {
        remove(this.options.name);
        filterEntities();
      },

      onRemove: function () {
        set(this.options.name, this.options.filter);
        filterEntities();
      },
    });
  }
  return new FilterLayer(options);
}

function createDefaultOverlays() {
  var addLayers = {};

  var portalsLayers = [];
  portalsLayers[0] = filterLayer({
    name: 'Unclaimed/Placeholder Portals',
    filter: [
      { portal: true, data: { team: 'N' } },
      { portal: true, data: { level: undefined } },
    ],
  });
  addLayers['Unclaimed/Placeholder Portals'] = portalsLayers[0];
  for (var i = 1; i <= 8; i++) {
    var t = 'Level ' + i + ' Portals';
    portalsLayers[i] = filterLayer({
      name: t,
      filter: [
        { portal: true, data: { level: i, team: 'R' } },
        { portal: true, data: { level: i, team: 'E' } },
        { portal: true, data: { level: i, team: 'M' } },
      ],
    });
    addLayers[t] = portalsLayers[i];
  }

  var fieldsLayer = filterLayer({
    name: 'Fields',
    filter: { field: true },
  });
  addLayers['Fields'] = fieldsLayer;

  var linksLayer = filterLayer({
    name: 'Links',
    filter: { link: true },
  });
  addLayers['Links'] = linksLayer;

  // faction-specific layers
  var resistanceLayer = filterLayer({
    name: 'Resistance',
    filter: { portal: true, link: true, field: true, data: { team: 'R' } },
  });
  var enlightenedLayer = filterLayer({
    name: 'Enlightened',
    filter: { portal: true, link: true, field: true, data: { team: 'E' } },
  });
  var machinaLayer = filterLayer({
    name: window.TEAM_NAMES[window.TEAM_MAC],
    filter: { portal: true, link: true, field: true, data: { team: 'M' } },
  });

  // to avoid any favouritism, we'll put the player's own faction layer first
  if (window.PLAYER.team === 'RESISTANCE') {
    addLayers['Resistance'] = resistanceLayer;
    addLayers['Enlightened'] = enlightenedLayer;
  } else {
    addLayers['Enlightened'] = enlightenedLayer;
    addLayers['Resistance'] = resistanceLayer;
  }
  addLayers[machinaLayer.options.name] = machinaLayer;

  // compatibility
  addLayers.Neutral = L.layerGroup();

  return addLayers;
}

function bringPortalsToFront() {
  for (var guid in window.portals) {
    window.portals[guid].bringToFront();
  }

  // artifact portals are always brought to the front, above all others
  $.each(window.artifact.getInterestingPortals(), function (_, guid) {
    if (window.portals[guid] && window.portals[guid]._map) {
      window.portals[guid].bringToFront();
    }
  });
}

function deletePortalEntity(guid) {
  if (guid in window.portals) {
    var p = window.portals[guid];
    window.ornaments.removePortal(p);
    this.removePortalFromMapLayer(p);
    delete window.portals[guid];
    window.runHooks('portalRemoved', { portal: p, data: p.options.data });
  }
}

function deleteLinkEntity(guid) {
  if (guid in window.links) {
    var l = window.links[guid];
    l.remove();
    delete window.links[guid];
    window.runHooks('linkRemoved', { link: l, data: l.options.data });
  }
}

function deleteFieldEntity(guid) {
  if (guid in window.fields) {
    var f = window.fields[guid];
    f.remove();
    delete window.fields[guid];
    window.runHooks('fieldRemoved', { field: f, data: f.options.data });
  }
}

function createFieldEntity(ent) {
  this.seenFieldsGuid[ent[0]] = true; // flag we've seen it

  if (ent[2][1] === 'N') ent[2][1] = 'M';

  var data = {
    //    type: ent[2][0],
    team: ent[2][1],
    points: ent[2][2].map(function (arr) {
      return { guid: arr[0], latE6: arr[1], lngE6: arr[2] };
    }),
  };

  for (var i = 0; i < 3; i++) {
    var p = data.points[i];
    this.createPlaceholderPortalEntity(p.guid, p.latE6, p.lngE6, data.team);
  }

  if (ent[0] in window.fields) {
    var f = window.fields[ent[0]];
    if (f.options.timestamp >= ent[1]) return;
    this.deleteFieldEntity(ent[0]);
  }

  var team = window.teamStringToId(ent[2][1]);
  var latlngs = [
    L.latLng(data.points[0].latE6 / 1e6, data.points[0].lngE6 / 1e6),
    L.latLng(data.points[1].latE6 / 1e6, data.points[1].lngE6 / 1e6),
    L.latLng(data.points[2].latE6 / 1e6, data.points[2].lngE6 / 1e6),
  ];

  var poly = L.geodesicPolygon(latlngs, {
    fillColor: window.COLORS[team],
    fillOpacity: 0.25,
    stroke: false,
    interactive: false,

    team: team,
    ent: ent, // LEGACY - TO BE REMOVED AT SOME POINT! use .guid, .timestamp and .data instead
    guid: ent[0],
    timestamp: ent[1],
    data: data,
  });

  window.runHooks('fieldAdded', { field: poly });

  window.fields[ent[0]] = poly;

  // TODO? postpone adding to the layer??
  if (!filterField(poly)) poly.addTo(window.map);
}

function createLinkEntity(ent, faked) {
  var fakedLink = new RegExp('^[0-9a-f]{32}.b_[ab][bc]$');
  if (fakedLink.test(ent[0])) return;

  this.seenLinksGuid[ent[0]] = true;

  if (ent[2][1] === 'N') ent[2][1] = 'M';

  var data = {
    team: ent[2][1],
    oGuid: ent[2][2],
    oLatE6: ent[2][3],
    oLngE6: ent[2][4],
    dGuid: ent[2][5],
    dLatE6: ent[2][6],
    dLngE6: ent[2][7],
  };

  this.createPlaceholderPortalEntity(data.oGuid, data.oLatE6, data.oLngE6, data.team);
  this.createPlaceholderPortalEntity(data.dGuid, data.dLatE6, data.dLngE6, data.team);

  if (ent[0] in window.links) {
    var l = window.links[ent[0]];

    if (l.options.timestamp >= ent[1]) return;
    this.deleteLinkEntity(ent[0]);
  }

  var team = window.teamStringToId(ent[2][1]);
  var latlngs = [L.latLng(data.oLatE6 / 1e6, data.oLngE6 / 1e6), L.latLng(data.dLatE6 / 1e6, data.dLngE6 / 1e6)];
  var poly = L.geodesicPolyline(latlngs, {
    color: window.COLORS[team],
    opacity: 1,
    weight: faked ? 1 : 2,
    interactive: false,

    team: team,
    ent: ent,
    guid: ent[0],
    timestamp: ent[1],
    data: data,
  });

  window.runHooks('linkAdded', { link: poly });

  window.links[ent[0]] = poly;

  if (!filterLink(poly)) poly.addTo(window.map);
}

// add the portal to the visible map layer
function addPortalToMapLayer(portal) {
  if (!filterPortal(portal)) portal.addTo(window.map);
}

function removePortalFromMapLayer(portal) {
  // remove it from the portalsLevels layer
  portal.remove();
}

function teamStringToId(teamStr) {
  var team = window.TEAM_NONE;
  if (teamStr === 'ENLIGHTENED') team = window.TEAM_ENL;
  if (teamStr === 'RESISTANCE') team = window.TEAM_RES;
  if (teamStr === 'E') team = window.TEAM_ENL;
  if (teamStr === 'R') team = window.TEAM_RES;
  if (teamStr === 'M') team = window.TEAM_MAC;
  return team;
}

function setup() {
  window.Render.prototype.bringPortalsToFront = bringPortalsToFront;
  window.Render.prototype.createLinkEntity = createLinkEntity;
  window.Render.prototype.createFieldEntity = createFieldEntity;
  window.Render.prototype.deletePortalEntity = deletePortalEntity;
  window.Render.prototype.deleteLinkEntity = deleteLinkEntity;
  window.Render.prototype.deleteFieldEntity = deleteFieldEntity;
  window.Render.prototype.addPortalToMapLayer = addPortalToMapLayer;
  window.Render.prototype.removePortalFromMapLayer = removePortalFromMapLayer;

  const LayerChooser = window.LayerChooser;
  window.LayerChooser = LayerChooser.extend({
    initialize: function (baseLayers, overlays, options) {
      for (const key in overlays) delete overlays[key];
      const newOverlays = createDefaultOverlays();
      for (const key in newOverlays) overlays[key] = newOverlays[key];
      LayerChooser.prototype.initialize.apply(this, arguments);
    },
  });

  window.TEAM_MAC = 3;
  window.COLORS[window.TEAM_MAC] = '#ff0028';
  window.TEAM_TO_CSS[window.TEAM_MAC] = 'mac';
  window.TEAM_NAMES[window.TEAM_MAC] =
    'U\u0336\u035aN\u0334\u0316K\u0320\u0354N\u031e\u0325\u022e\u0336\u0339W\u0336\u0322\u1e48\u0328\u031f';

  window.teamStringToId = teamStringToId;

  const decodePortal = window.decodeArray.portal;
  window.decodeArray.portal = function (a, details) {
    const res = decodePortal(a, details);
    if (res.team === 'N' && res.resCount) {
      res.team = 'M';
      if (res.owner) res.owner = window.TEAM_NAMES[window.TEAM_MAC];
      if (res.resonators) {
        for (const r of res.resonators) {
          r.owner = window.TEAM_NAMES[window.TEAM_MAC];
        }
      }
    }
    return res;
  };

  const css = document.createElement('style');
  css.textContent = '.mac { color: #f74a4a }';
  document.head.append(css);
}

setup.priority = 'boot';

if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();

setup.info = plugin_info; //add the script info data to the function as a property
}

// inject code into site context
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };

var script = document.createElement('script');
// if on last IITC mobile, will be replaced by wrapper(info)
var mobile = `script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);`;
// detect if mobile
if (mobile.startsWith('script')) {
  script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
  script.appendChild(document.createTextNode('//# sourceURL=iitc:///plugins/redfection.js'));
  (document.body || document.head || document.documentElement).appendChild(script);
} else {
  // mobile string
  wrapper(info);
}
