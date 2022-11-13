import { filterLayer } from './filters';

export function createDefaultOverlays() {
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
