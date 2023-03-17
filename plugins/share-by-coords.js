// @author         jaiperdu
// @name           Share intel coordinates
// @category       Portal Info
// @version        0.1.1
// @description    Create your own urls to open portals into your favorite apps

// use own namespace for plugin
const shareCoords = {};
shareCoords.default_templates = [
  {
    name: 'Waze',
    template: 'https://waze.com/ul?ll={lat},{lng}',
  },
  {
    name: 'Scanner',
    template: 'https://link.ingress.com/?link=https://intel.ingress.com/portal/{guid}',
  },
];
shareCoords.settings = {
  templates: Array.from(shareCoords.default_templates),
};
shareCoords.SETTINGS_KEY = 'plugin-share-coords-settings';

function loadSettings() {
  try {
    const settings = JSON.parse(localStorage[shareCoords.SETTINGS_KEY]);
    Object.assign(shareCoords.settings, settings);
  } catch (e) {
    // nothing to do
  }
}

function storeSettings() {
  localStorage[shareCoords.SETTINGS_KEY] = JSON.stringify(shareCoords.settings);
}

function editTemplates() {
  const html = L.DomUtil.create('div', 'container');
  const portal = window.portals[window.selectedPortal];
  const obj = {
    lat: portal.getLatLng().lat,
    lng: portal.getLatLng().lng,
    guid: portal.options.guid,
  };

  const urls = L.DomUtil.create('table', null, html);
  urls.innerHTML = '<tr><th>Name</th><th>Template</th><th>Action</th></tr>';
  for (const t of shareCoords.settings.templates) {
    const row = L.DomUtil.create('tr', null, urls);
    const name = L.DomUtil.create('td', null, row);
    name.textContent = t.name;
    const template = L.DomUtil.create('td', 'raw-url', row);
    template.textContent = t.template;
    const action = L.DomUtil.create('td', null, row);
    const deleteButton = L.DomUtil.create('button', null, action);
    deleteButton.textContent = 'Delete';
    L.DomEvent.on(deleteButton, 'click', () => {
      const i = shareCoords.settings.templates.findIndex((tt) => t === tt);
      if (i >= 0) shareCoords.settings.templates.splice(i, 1);
      row.remove();
      storeSettings();
    });
  }
  const row = L.DomUtil.create('tr', null, urls);
  const name = L.DomUtil.create('td', null, row);
  const nameInput = L.DomUtil.create('input', null, name);
  nameInput.placeholder = 'Some name';
  const template = L.DomUtil.create('td', 'raw-url', row);
  const templateInput = L.DomUtil.create('input', null, template);
  templateInput.placeholder = 'https://example.com/path/{lat}?foo={lng}#bar-{guid}';
  const action = L.DomUtil.create('td', null, row);
  const addButton = L.DomUtil.create('button', null, action);
  addButton.textContent = 'Add';
  L.DomEvent.on(addButton, 'click', () => {
    const name = nameInput.value;
    const template = templateInput.value;
    if (!name) {
      alert('Name is empty...');
      return;
    }
    try {
      L.Util.template(template, obj);
    } catch (e) {
      alert('Url cannot be used correctly: ' + e);
      return;
    }
    shareCoords.settings.templates.push({
      name,
      template,
    });
    storeSettings();
    editTemplates(); // I'm lazy
  });

  window.dialog({
    html: html,
    id: 'plugin-share-coords-edit',
    title: 'Share Coords -- Edit links',
    width: 'auto',
    buttons: {
      'Add defaults': function () {
        shareCoords.settings.templates = shareCoords.settings.templates.concat(shareCoords.default_templates);
        storeSettings();
        editTemplates();
      },
    },
  });
}

function displayDialog() {
  const html = L.DomUtil.create('div', 'container');
  const portal = window.portals[window.selectedPortal];
  const obj = {
    lat: portal.getLatLng().lat,
    lng: portal.getLatLng().lng,
    guid: portal.options.guid,
  };

  const urls = L.DomUtil.create('ul', null, html);
  for (const t of shareCoords.settings.templates) {
    const li = L.DomUtil.create('li', null, urls);
    const a = L.DomUtil.create('a', null, li);
    a.href = L.Util.template(t.template, obj);
    a.textContent = t.name;
    a.target = '_blank';
    const template = L.DomUtil.create('code', 'raw-url', li);
    template.textContent = a.href;
  }

  window.dialog({
    html: html,
    id: 'plugin-share-coords',
    title: 'Share Coords',
    buttons: {
      Edit: editTemplates,
    },
  });
}

window.plugin.shareCoords = shareCoords;

/* eslint-disable-next-line no-unused-vars */
function setup() {
  const style = document.createElement('style');
  style.textContent = '#dialog-plugin-share-coords .raw-url { margin-left: 1em; }';
  style.append('//# sourceURL=iitc://share-by-coords.css');
  document.head.append(style);

  window.addHook('portalDetailsUpdated', function () {
    const a = L.DomUtil.create('a', null, L.DomUtil.create('aside', null, document.querySelector('.linkdetails')));
    a.textContent = 'ShareCoords';
    L.DomEvent.on(a, 'click', displayDialog);
  });

  loadSettings();
}
