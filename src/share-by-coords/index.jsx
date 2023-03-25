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
  const obj = {
    lat: 0.42,
    lng: -17,
    guid: '0123456789abcdef',
  };
  const nameInput = <input placeholder="Some name" />;
  const templateInput = <input placeholder="https://example.com/path/{lat}?foo={lng}#bar-{guid}" />;
  const addButton = (
    <button
      onclick={() => {
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
      }}
    >
      Add
    </button>
  );

  const html = (
    <div className="container">
      <table>
        <tr>
          <th>Name</th>
          <th>Template</th>
          <th>Action</th>
        </tr>
        {shareCoords.settings.templates.map((t) => (
          <tr>
            <td>{t.name}</td>
            <td className="raw-url">{t.template}</td>
            <td>
              <button
                onclick={(e) => {
                  const i = shareCoords.settings.templates.findIndex((tt) => t === tt);
                  if (i >= 0) shareCoords.settings.templates.splice(i, 1);
                  e.target.closest('tr').remove();
                  storeSettings();
                }}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
        <tr>
          <td>{nameInput}</td>
          <td className="raw-url">{templateInput}</td>
          <td>{addButton}</td>
        </tr>
      </table>
    </div>
  );

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
  const portal = window.portals[window.selectedPortal];
  const obj = {
    lat: portal.getLatLng().lat,
    lng: portal.getLatLng().lng,
    guid: portal.options.guid,
  };

  const html = (
    <div className="container">
      <table>
        {shareCoords.settings.templates.map((t) => {
          const url = L.Util.template(t.template, obj);
          return (
            <tr>
              <th>
                <a href={url} target="_blank">
                  {t.name}
                </a>
              </th>
              <td className="raw-url">
                <code>{url}</code>
              </td>
            </tr>
          );
        })}
      </table>
    </div>
  );

  window.dialog({
    html: html,
    id: 'plugin-share-coords',
    title: 'Share Coords',
    buttons: {
      Edit: editTemplates,
    },
  });
}

export default function () {
  window.plugin.shareCoords = shareCoords;
  const style = <style></style>;
  style.textContent =
    '#dialog-plugin-share-coords .raw-url { white-space: nowrap; padding: 1px 4px; background: #0005 }' +
    '#dialog-plugin-share-coords-edit .raw-url input { width: 100% }';
  document.head.append(style);

  window.addHook('portalDetailsUpdated', function () {
    document.querySelector('.linkdetails').append(
      <aside>
        <a onclick={displayDialog}>ShareCoords</a>
      </aside>
    );
  });

  loadSettings();
}
