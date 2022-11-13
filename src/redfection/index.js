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
  window.TEAM_NAMES[window.TEAM_MAC] = 'U̶͚̓̍N̴̖̈K̠͔̍͑̂͜N̞̥͋̀̉Ȯ̶̹͕̀W̶̢͚͑̚͝Ṉ̨̟̒̅ ';

  window.teamStringToId = teamStringToId;

  const decodePortal = window.decodeArray.portal;
  window.decodeArray.portal = function (a, details) {
    if (a.length > 6 && a[1] === 'N' && a[6] > 0) a[1] = 'M';
    return decodePortal(a, details);
  };

  const css = document.createElement('style');
  css.textContent = '.mac { color: #f74a4a }';
  document.head.append(css);
}

setup.priority = 'boot';

export default setup;
