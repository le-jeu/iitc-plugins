
// ==UserScript==
// @author        jaiperdu
// @name          IITC plugin: Share intel coordinates
// @category      Portal Info
// @version       0.1.2
// @description   Create your own urls to open portals into your favorite apps
// @id            share-by-coords
// @namespace     https://github.com/IITC-CE/ingress-intel-total-conversion
// @updateURL     https://le-jeu.github.io/iitc-plugins/share-by-coords.user.js
// @downloadURL   https://le-jeu.github.io/iitc-plugins/share-by-coords.user.js
// @match         https://intel.ingress.com/*
// @grant         none
// ==/UserScript==
function wrapper(plugin_info) {

// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

var css_248z = "#dialog-plugin-share-coords-edit .raw-url,\n#dialog-plugin-share-coords .raw-url {\n  white-space: nowrap;\n  padding: 1px 4px;\n  background: #0005\n}\n\n#dialog-plugin-share-coords table {\n  line-height: 1.4em;\n}\n#dialog-plugin-share-coords .raw-url {\n  font-size: smaller;\n}\n\n#dialog-plugin-share-coords-edit .raw-url input {\n  width: 100%\n}";

function recursiveAppend(element, children) {
  // cast to string to display "undefined" or "null"
  if (children === undefined || children === null) return;
  if (Array.isArray(children)) {
    for (const child of children) recursiveAppend(element, child);
  } else {
    element.append(children);
  }
}

function jsx(tagName, attrs) {
  if (typeof tagName === 'function') return tagName(attrs);
  const children = attrs.children;
  delete attrs.children;
  const rawHtml = attrs.rawHtml;
  delete attrs.rawHtml;
  const elem = document.createElement(tagName);
  // dataset
  if (attrs.dataset) {
    for (const key in attrs.dataset) elem.dataset[key] = attrs.dataset[key];
    delete attrs.dataset;
  }
  // events
  for (const key in attrs) {
    if (key.startsWith('on')) {
      elem.addEventListener(key.slice(2), attrs[key]);
      delete attrs[key];
    }
  }
  Object.assign(elem, attrs);
  if (rawHtml) {
    elem.innerHTML = rawHtml;
    return elem;
  }
  recursiveAppend(elem, children);
  return elem;
}

const jsxs = jsx;

const shareCoords = {};
shareCoords.default_templates = [{
  name: 'Waze',
  template: 'https://waze.com/ul?ll={lat},{lng}'
}, {
  name: 'Scanner',
  template: 'https://link.ingress.com/?link=https://intel.ingress.com/portal/{guid}'
}];
shareCoords.settings = {
  templates: Array.from(shareCoords.default_templates)
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
    guid: '0123456789abcdef'
  };
  const nameInput = jsx("input", {
    placeholder: "Some name"
  });
  const templateInput = jsx("input", {
    placeholder: "https://example.com/path/{lat}?foo={lng}#bar-{guid}"
  });
  const addButton = jsx("button", {
    onclick: () => {
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
        template
      });
      storeSettings();
      editTemplates(); // I'm lazy
    },
    children: "Add"
  });
  const html = jsx("div", {
    className: "container",
    children: jsxs("table", {
      children: [jsxs("tr", {
        children: [jsx("th", {
          children: "Name"
        }), jsx("th", {
          children: "Template"
        }), jsx("th", {
          children: "Action"
        })]
      }), shareCoords.settings.templates.map(t => jsxs("tr", {
        children: [jsx("td", {
          children: t.name
        }), jsx("td", {
          className: "raw-url",
          children: jsx("code", {
            children: t.template
          })
        }), jsx("td", {
          children: jsx("button", {
            onclick: e => {
              const i = shareCoords.settings.templates.findIndex(tt => t === tt);
              if (i >= 0) shareCoords.settings.templates.splice(i, 1);
              e.target.closest('tr').remove();
              storeSettings();
            },
            children: "Delete"
          })
        })]
      })), jsxs("tr", {
        children: [jsx("td", {
          children: nameInput
        }), jsx("td", {
          className: "raw-url",
          children: templateInput
        }), jsx("td", {
          children: addButton
        })]
      })]
    })
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
      }
    }
  });
}
function displayDialog() {
  const portal = window.portals[window.selectedPortal];
  const obj = {
    lat: portal.getLatLng().lat,
    lng: portal.getLatLng().lng,
    guid: portal.options.guid
  };
  const html = jsx("div", {
    className: "container",
    children: jsx("table", {
      children: shareCoords.settings.templates.map(t => {
        const url = L.Util.template(t.template, obj);
        return jsxs("tr", {
          children: [jsx("th", {
            children: jsx("a", {
              href: url,
              target: "_blank",
              children: t.name
            })
          }), jsx("td", {
            className: "raw-url",
            children: jsx("code", {
              children: url
            })
          })]
        });
      })
    })
  });
  window.dialog({
    html: html,
    id: 'plugin-share-coords',
    title: 'Share Coords',
    buttons: {
      Edit: editTemplates
    }
  });
}
function setup () {
  window.plugin.shareCoords = shareCoords;
  const style = jsx("style", {
    children: css_248z
  });
  document.head.append(style);
  window.addHook('portalDetailsUpdated', function () {
    document.querySelector('.linkdetails').append(jsx("aside", {
      children: jsx("a", {
        onclick: displayDialog,
        children: "ShareCoords"
      })
    }));
  });
  loadSettings();
}

if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();

setup.info = plugin_info; //add the script info data to the function as a property
}

// inject code into site context
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };

var script = document.createElement('script');
// if on last IITC mobile, will be replaced by wrapper(info)
var mobile = `script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);`;
// detect if mobile
if (mobile.startsWith('script')) {
  script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
  script.appendChild(document.createTextNode('//# sourceURL=iitc:///plugins/share-by-coords.js'));
  (document.body || document.head || document.documentElement).appendChild(script);
} else {
  // mobile string
  wrapper(info);
}
