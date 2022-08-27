import playerInventory from './plugin';

export function injectKeys(data) {
  if (!playerInventory.isHighlighActive) return;

  const bounds = window.map.getBounds();
  const entities = [];
  for (const [guid, key] of playerInventory.inventory.keys) {
    if (bounds.contains(key.latLng)) {
      // keep known team
      const team = window.portals[guid] ? window.portals[guid].options.ent[2][1] : 'N';
      const ent = [guid, 0, ['p', team, Math.round(key.latLng[0] * 1e6), Math.round(key.latLng[1] * 1e6)]];
      entities.push(ent);
    }
  }
  data.callback(entities);
}

export function portalKeyHighlight(data) {
  const guid = data.portal.options.guid;
  if (playerInventory.inventory.keys.has(guid)) {
    // place holder
    if (data.portal.options.team !== window.TEAM_NONE && data.portal.options.level === 0) {
      data.portal.setStyle({
        color: 'red',
        weight: 2 * Math.sqrt(window.portalMarkerScale()),
        dashArray: '',
      });
    } else if (window.map.getZoom() < 15 && data.portal.options.team === window.TEAM_NONE && !window.portalDetail.isFresh(guid))
      // injected without intel data
      data.portal.setStyle({ color: 'red', fillColor: 'gray' });
    else data.portal.setStyle({ color: 'red' });
  }
}

export function createPopup(guid) {
  const portal = window.portals[guid];
  const latLng = portal.getLatLng();
  // create popup only if the portal is in view
  if (window.map.getBounds().contains(latLng)) {
    const count = playerInventory.inventory.keys.get(guid).count;
    const text = Array.from(count)
      .map(([name, count]) => `<strong>${name}</strong>: ${count}`)
      .join('<br/>');

    L.popup()
      .setLatLng(latLng)
      .setContent('<div class="inventory-keys">' + text + '</div>')
      .openOn(window.map);
  }
}
