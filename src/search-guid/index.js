const W = window;

const guid_re = /[0-9a-f]{32}\.[0-9a-f]{2}/;

function addResult(query, data) {
  const guid = data.guid;
  const teams = ["NEU", "RES", "ENL"];
  const team = W.teamStringToId(data.team);
  query.addResult({
    title: data.title,
    description:
      teams[team] +
      ", L" +
      data.level +
      ", " +
      data.health +
      "%, " +
      data.resCount +
      " Resonators",
    position: L.latLng(data.latE6 * 1e-6, data.lngE6 * 1e-6),
    onSelected: function (result, event) {
      if (event.type == "dblclick") {
        W.zoomToAndShowPortal(guid, result.position);
      } else if (window.portals[guid]) {
        if (!W.map.getBounds().contains(result.position))
          W.map.setView(result.position);
        W.renderPortalDetails(guid);
      } else {
        W.selectPortalByLatLng(result.position);
      }
      return true; // prevent default behavior
    },
  });
}

function search(query) {
  const res = query.term.match(guid_re);
  if (res) {
    const guid = res[0];
    const data = W.portalDetail.get(guid);
    if (data) addResult(query, data);
    else {
      W.portalDetail.request(guid).then(function (data) {
        addResult(query, data);
      });
    }
  }
}

export default function () {
  W.addHook("search", search);
}
