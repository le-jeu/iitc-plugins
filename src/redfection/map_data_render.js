import { filterLink, filterField, filterPortal } from './filters';

export function bringPortalsToFront() {
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

export function deletePortalEntity(guid) {
  if (guid in window.portals) {
    var p = window.portals[guid];
    window.ornaments.removePortal(p);
    this.removePortalFromMapLayer(p);
    delete window.portals[guid];
    window.runHooks('portalRemoved', { portal: p, data: p.options.data });
  }
}

export function deleteLinkEntity(guid) {
  if (guid in window.links) {
    var l = window.links[guid];
    l.remove();
    delete window.links[guid];
    window.runHooks('linkRemoved', { link: l, data: l.options.data });
  }
}

export function deleteFieldEntity(guid) {
  if (guid in window.fields) {
    var f = window.fields[guid];
    f.remove();
    delete window.fields[guid];
    window.runHooks('fieldRemoved', { field: f, data: f.options.data });
  }
}

export function createFieldEntity(ent) {
  this.seenFieldsGuid[ent[0]] = true; // flag we've seen it

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

export function createLinkEntity(ent, faked) {
  var fakedLink = new RegExp('^[0-9a-f]{32}.b_[ab][bc]$');
  if (fakedLink.test(ent[0])) return;

  this.seenLinksGuid[ent[0]] = true;

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
export function addPortalToMapLayer(portal) {
  if (!filterPortal(portal)) portal.addTo(window.map);
}

export function removePortalFromMapLayer(portal) {
  // remove it from the portalsLevels layer
  portal.remove();
}
