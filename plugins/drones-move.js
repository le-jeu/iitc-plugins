// @author         jaiperdu
// @name           Look for drone moves
// @category       Info
// @version        0.1.0
// @description    Find paires of portals in the view that may have been used recently by a drone move.

const dronesMove = {};
window.plugin.dronesMove = dronesMove;

dronesMove.portalStyle = {
  color: 'red',
  radius: 10,
  interactive: false,
};
dronesMove.moveStyle = {
  color: 'red',
  weight: 6,
  interactive: false,
};

function update() {
  const timeMap = {};
  for (const guid in window.portals) {
    const t = window.portals[guid].options.timestamp;
    if (t <= 0) continue;
    if (!(t in timeMap)) timeMap[t] = [];
    timeMap[t].push(guid);
  }

  // remove timestamp from links
  for (const guid in window.links) {
    const t = window.links[guid].options.timestamp;
    if (timeMap[t] && timeMap[t].includes(window.links[guid].options.data.oGuid))
      delete timeMap[t];
  }

  const paires = Object.values(timeMap).filter((l) => l.length == 2);
  dronesMove.layer.clearLayers();
  for (const [ga,gb] of paires) {
    const pa = window.portals[ga];
    const pb = window.portals[gb];
    L.polyline([pa.getLatLng(), pb.getLatLng()], dronesMove.moveStyle).addTo(dronesMove.layer);
    L.circleMarker(pa.getLatLng(), dronesMove.portalStyle).addTo(dronesMove.layer);
    L.circleMarker(pb.getLatLng(), dronesMove.portalStyle).addTo(dronesMove.layer);
  }
  console.info("found", paires.length, 'drone moves');
}

function setup () {
  dronesMove.layer = L.layerGroup();
  window.addLayerGroup('Drones last move', dronesMove.layer, false);

  window.addHook('mapDataRefreshEnd', update);
};
