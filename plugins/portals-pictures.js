// @author         jaiperdu
// @name           Portals pictures
// @category       Info
// @version        0.1.3
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

  const container = document.createElement('div');
  container.style.maxWidth = "1000px";

  const filter = document.createElement('input');
  filter.type = 'text';
  filter.placeholder = "Filter by title";
  filter.addEventListener('input', function(ev) {
    ev.preventDefault();
    const f = ev.target.value.toLowerCase();
    for (const n of document.querySelectorAll('.portal-pictures-image')) {
      const title = n.title.toLowerCase();
      if (title.includes(f))
        n.style.display = null;
      else
        n.style.display = 'none';
    }
  });
  container.appendChild(filter);
  container.appendChild(document.createElement('hr'));

  const div = document.createElement('div');
  container.appendChild(div);

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
    html: container,
    title: 'Show portal pictures',
    width: 'auto',
    closeCallback: () => {
      window.removeHook("portalDetailsUpdated", window.plugin.portalPictures.onPortalDetailsUpdated);
    }
  });
};

window.plugin.portalPictures.setup  = function() {
  $('<style>').html('.portal-pictures-image { padding: 1px }').appendTo('head');
  $('#toolbox').append(' <a onclick="window.plugin.portalPictures.showDialog()">Portal pictures</a>');
};

let setup =  window.plugin.portalPictures.setup;
