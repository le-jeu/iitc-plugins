import { createDefaultOverlays } from './map';
import {
  bringPortalsToFront,
  createFieldEntity,
  createLinkEntity,
  deletePortalEntity,
  deleteLinkEntity,
  deleteFieldEntity,
  addPortalToMapLayer,
  removePortalFromMapLayer,
} from './map_data_render';
import { teamStringToId } from './entity_info';

function setup() {
  window.Render.prototype.bringPortalsToFront = bringPortalsToFront;
  window.Render.prototype.createLinkEntity = createLinkEntity;
  window.Render.prototype.createFieldEntity = createFieldEntity;
  window.Render.prototype.deletePortalEntity = deletePortalEntity;
  window.Render.prototype.deleteLinkEntity = deleteLinkEntity;
  window.Render.prototype.deleteFieldEntity = deleteFieldEntity;
  window.Render.prototype.addPortalToMapLayer = addPortalToMapLayer;
  window.Render.prototype.removePortalFromMapLayer = removePortalFromMapLayer;

  const lcInit = (window.LayerChooser || L.Control.Layers).prototype.initialize;
  (window.LayerChooser || L.Control.Layers).include({
    initialize: function (baseLayers, overlays, options) {
      for (const key in overlays) delete overlays[key];
      const newOverlays = createDefaultOverlays();
      for (const key in newOverlays) {
        overlays[key] = newOverlays[key];
        if (!window.LayerChooser && window.isLayerGroupDisplayed(key, true)) {
          overlays[key].addTo(window.map);
        }
      }
      lcInit.apply(this, arguments);
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
  css.textContent = 
    '.mac { color: #f74a4a }\n'
    + '#portalslist table tr.mac td { background-color: #a22121 }';
  document.head.append(css);
}

setup.priority = 'boot';

export default setup;
