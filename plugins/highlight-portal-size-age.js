// @author         jaiperdu
// @name           ISmaller/Bigger/Older Portals
// @category       Highlighter
// @version        1.0.0
// @description    Resize portal and age highlighers

/* exported setup */
function setup() {
  window.addPortalHighlighter('Smaller Portals', function (data) {
    const portal = data.portal;
    portal.setStyle({
      weight: portal.options.weight * 0.7,
      radius: portal.options.radius * 0.8,
    });
  });
  window.addPortalHighlighter('Bigger Portals', function (data) {
    const portal = data.portal;
    portal.setStyle({
      weight: portal.options.weight * 1.2,
      radius: portal.options.radius * 1.5,
    });
  });
  window.addPortalHighlighter('Old Portals', function (data) {
    const portal = data.portal;
    const delta = (Date.now() - portal.options.timestamp) / 86400000;
    const color = delta > 1 ? 'grey' : 'hsl(' + Math.round(delta * 300) + ',100%,50%)';
    portal.setStyle({
      color: color,
      fillColor: color,
    });
  });
}
