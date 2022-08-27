const defaultImage = 'https://fevgames.net/wp-content/uploads/2018/11/FS-Onyx.png';

function onPortalDetailsUpdated(e) {
  const img = document.querySelector('.portal-pictures-image[data-guid="' + e.guid + '"]');
  if (img) {
    img.src = (e.portalData.image || defaultImage).replace('http:', '');
    img.title = e.portalData.title;
  }
}

function filterOnInput(ev) {
  ev.preventDefault();
  const f = ev.target.value.toLowerCase();
  for (const n of document.querySelectorAll('.portal-pictures-image')) {
    const title = n.title.toLowerCase();
    if (title.includes(f)) n.style.display = null;
    else n.style.display = 'none';
  }
}

function imgOnClick(ev) {
  const img = ev.target;
  img.dataset.count++;
  let prev = img.previousElementSibling;
  while (prev && prev.dataset.count - img.dataset.count < 0) prev = prev.previousElementSibling;
  if (prev) img.parentNode.insertBefore(img, prev.nextSibling);
  else img.parentNode.insertBefore(img, img.parentNode.firstElementChild);
  window.renderPortalDetails(img.dataset.guid);
  ev.preventDefault();
  return false;
}

function showDialog() {
  let portals = [];

  let bounds = window.map.getBounds();
  for (const portal of Object.values(window.portals)) {
    let ll = portal.getLatLng();
    if (bounds.contains(ll)) {
      portals.push(portal);
    }
  }

  const container = (
    <div style="max-width: 1000px">
      <input placeholder="Filter by title" oninput={filterOnInput} />
      <hr />
      <div>
        {portals.map((portal) => (
          <img
            src={(portal.options.data.image || defaultImage).replace('http:', '')}
            title={portal.options.data.title}
            className="imgpreview portal-pictures-image"
            dataset={{ guid: portal.options.guid, count: 0 }}
            onclick={imgOnClick}
          />
        ))}
      </div>
    </div>
  );

  window.dialog({
    id: 'plugin-portal-pictures',
    html: container,
    title: 'Show portal pictures',
    width: 'auto',
    closeCallback: () => {
      window.removeHook('portalDetailsUpdated', onPortalDetailsUpdated);
    },
  });
  window.addHook('portalDetailsUpdated', onPortalDetailsUpdated);
}

export default function () {
  window.plugin.portalPictures = {};
  window.plugin.portalPictures.showDialog = showDialog;
  $('<style>').html('.portal-pictures-image { padding: 1px }').appendTo('head');
  $('#toolbox').append(<a onclick={showDialog}>Portal pictures</a>);
}
