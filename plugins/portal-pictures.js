// @author         jaiperdu
// @name           Portal pictures
// @category       Info
// @version        0.1.0
// @description    Show portal pictures in a dialog

// use own namespace for plugin
window.plugin.portalPictures = function() {};

const defaultImage = 'https://fevgames.net/wp-content/uploads/2018/11/FS-Onyx.png';

window.plugin.portalPictures.onPortalDetailsUpdated = function (e) {
  const img = document.querySelector('.portal-pictures-image[data-guid="' + e.guid + '"]');
  if (img) {
    img.src = (e.portalData.image || defaultImage).replace("http:", "");
    img.title = e.portalData.title;
  }
}

window.plugin.portalPictures.showDialog = function() {
  let portals = [];

  let bounds = map.getBounds();
  for (const [guid, portal] of Object.entries(window.portals)) {
    let ll = portal.getLatLng();
    if (bounds.contains(ll)) {
      portals.push(portal);
    }
  }

  const div = document.createElement('div');
  div.style.maxWidth = "1000px";

  for (const portal of portals) {
    const img = document.createElement("img");
    img.src = (portal.options.data.image || defaultImage).replace("http:", "");
    img.title = portal.options.data.title;
    img.classList.add('imgpreview');
    img.classList.add('portal-pictures-image');
    img.dataset.guid = portal.options.guid;
    img.dataset.count = 0;
    img.addEventListener("click", function(ev) {
      img.dataset.count++;
      let prev = img.previousElementSibling;
      while (prev && prev.dataset.count - img.dataset.count < 0)
        prev = prev.previousElementSibling;
      if (prev)
        img.parentNode.insertBefore(img, prev.nextSibling);
      else
        img.parentNode.insertBefore(img, img.parentNode.firstElementChild);
      renderPortalDetails(portal.options.guid);
      ev.preventDefault();
      return false;
    }, false);
    div.appendChild(img);
  }

  window.addHook("portalDetailsUpdated", window.plugin.portalPictures.onPortalDetailsUpdated);

  dialog({
    id: 'plugin-portal-pictures',
    html: div,
    title: 'Show portal pictures',
    width: 'auto',
    closeCallback: () => {
      window.removeHook("portalDetailsUpdated", window.plugin.portalPictures.onPortalDetailsUpdated);
    }
  });
};

window.plugin.portalPictures.setup  = function() {
  $('#toolbox').append(' <a onclick="window.plugin.portalPictures.showDialog()">Portal pictures</a>');
};

let setup =  window.plugin.portalPictures.setup;
