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
}

setup.priority = 'boot';

export default setup;
