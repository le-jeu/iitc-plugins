import { FilterLayer } from './filters';

export function createDefaultOverlays() {
  var addLayers = {};

  var portalsLayers = [];
  portalsLayers[0] = new FilterLayer({
    name: 'Unclaimed/Placeholder Portals',
    filter: [
      { portal: true, data: { team: 'N' } },
      { portal: true, data: { level: undefined } },
    ],
  });
  addLayers['Unclaimed/Placeholder Portals'] = portalsLayers[0];
  for (var i = 1; i <= 8; i++) {
    var t = 'Level ' + i + ' Portals';
    portalsLayers[i] = new FilterLayer({
      name: t,
      filter: [
        { portal: true, data: { level: i, team: 'R' } },
        { portal: true, data: { level: i, team: 'E' } },
      ],
    });
    addLayers[t] = portalsLayers[i];
  }

  var fieldsLayer = new FilterLayer({
    name: 'Fields',
    filter: { field: true },
  });
  addLayers['Fields'] = fieldsLayer;

  var linksLayer = new FilterLayer({
    name: 'Links',
    filter: { link: true },
  });
  addLayers['Links'] = linksLayer;

  // faction-specific layers
  var resistanceLayer = new FilterLayer({
    name: 'Resistance',
    filter: { portal: true, link: true, field: true, data: { team: 'R' } },
  });
  var enlightenedLayer = new FilterLayer({
    name: 'Enlightened',
    filter: { portal: true, link: true, field: true, data: { team: 'E' } },
  });

  // to avoid any favouritism, we'll put the player's own faction layer first
  if (window.PLAYER.team === 'RESISTANCE') {
    addLayers['Resistance'] = resistanceLayer;
    addLayers['Enlightened'] = enlightenedLayer;
  } else {
    addLayers['Enlightened'] = enlightenedLayer;
    addLayers['Resistance'] = resistanceLayer;
  }

  // compatibility
  addLayers.Neutral = L.layerGroup();

  return addLayers;
}
