// @author         jaiperdu
// @name           Highlight Kythera
// @category       Highlighter
// @version        1.0.0
// @description    Highlight Kythera and keep track between reloads

const portals = {};
const STORAGE_KEY = "plugin-highlight-kythera";
const ORNAMENT = "ap1";

const setup =  function() {
  try {
    const stored = localStorage[STORAGE_KEY];
    if (stored) {
      const parsed = JSON.parse(stored);
      for (const k in parsed)
        portals[k] = parsed[k];
    }
  } catch (e) {
    console.log(e);
  }
  
  window.addPortalHighlighter('Kythera', function (data) {
    const portal = data.portal;
    if ((portal.options.data.ornaments || []).includes(ORNAMENT) || portal.options.guid in portals) {
      portal.setStyle({
        weight: 2,
        radius: portal.options.radius * 1.1,
        opacity: 1,
        fillColor: 'red',
        color: 'black',
      });
      portals[portal.options.guid] = {
        timestamp: portal.options.timestamp,
        team: portal.options.data.team,
        latE6: portal.options.data.latE6,
        lngE6: portal.options.data.lngE6,
      };
    }
  });
  
  window.addHook("mapDataEntityInject", function (data) {
    const { callback } = data;
    const ents = [];
    for (const guid in portals) {
      if (guid in window.portals) continue;
      const portal = portals[guid];
      ents.push([
        guid,
        portal.timestamp,
        [
          "p", portal.team, portal.latE6, portal.lngE6,
        ],
      ]);
    }
    callback(ents);
  });
  
  window.addHook("mapDataRefreshEnd", function (cb) {
    localStorage[STORAGE_KEY] = JSON.stringify(portals);
  });
  
  
  const a = L.DomUtil.create('a', null, document.querySelector('#toolbox'));
  a.textContent = 'Clear Kythera Cache';
  L.DomEvent.on(a, 'click', () => {
    for (const guid in portals)
      delete portals[guid];
    delete localStorage[STORAGE_KEY];
  });
}
