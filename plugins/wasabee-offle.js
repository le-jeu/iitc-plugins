// @author         jaiperdu
// @name           Wasabee: Offle tweak
// @category       Misc
// @version        0.1.0
// @description    Interface with offle to propagate click to portal entity

var hookOn;
function onPortalSelected(data) {
  var guid = data.selectedPortalGuid;
  if (guid && guid === hookOn) {
    hookOn = null;
    window.portals[guid].fire('click');
  }
}

function onOfflePortalClick() {
	var guid = this.options.guid;
	if (guid in window.portals) window.portals[guid].fire('click');
	else hookOn = guid;
}

function setup() {
	if (!window.plugin.offle) return;
	var offle = window.plugin.offle;
	var origRenderPortal = offle.renderPortal;
	offle.renderPortal = function(guid) {
		var ret = origRenderPortal(guid);
		var marker = offle.currentPortalMarkers[guid];
		marker.options.guid = guid;
		marker.on('click', onOfflePortalClick);
		return ret;
	};
  window.addHook("portalSelected", onPortalSelected);
}
