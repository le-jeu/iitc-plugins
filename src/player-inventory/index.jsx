import playerInventoryCSS from './player-inventory.css';

import playerInventory from './plugin';

import { Inventory } from './inventory';
import { parseInventory } from './parser';
import { loadLastInventory, loadSettings, storeSettings, saveInventory } from './storage';
import { requestInventory } from './request';
import { shortenRarity } from './utils';
import { createPopup, injectKeys, portalKeyHighlight } from './map';

// eslint-disable-next-line no-unused-vars
import InventoryTables from './components/InventoryTables';

function buildInventoryHTML(inventory) {
  const container = <InventoryTables inventory={inventory}/>;

  $(container).accordion({
    header: 'b',
    heightStyle: 'fill',
    collapsible: true,
  });

  return container;
}

function fillPane(inventory) {
  const oldContainer = playerInventory.pane.querySelector('.container');
  if (oldContainer) playerInventory.pane.removeChild(oldContainer);
  playerInventory.pane.appendChild(buildInventoryHTML(inventory));
}

function getTitle() {
  let title = 'Inventory';
  if (playerInventory.lastRefresh) {
    title = title + ' (' + new Date(playerInventory.lastRefresh).toLocaleTimeString() + ')';
  }
  return title;
}

function displayInventory(inventory) {
  const container = buildInventoryHTML(inventory);

  playerInventory.dialog = window.dialog({
    title: getTitle(),
    id: 'inventory',
    html: container,
    width: 'auto',
    height: '560',
    classes: {
      'ui-dialog-content': 'inventory-box',
    },
    buttons: {
      Refresh: () => refreshInventory(),
      Options: displayOpt,
    },
  });

  refreshIfOld();
}

function handleInventory(data) {
  if (data.length > 0) {
    playerInventory.inventory = parseInventory('⌂', data);
    playerInventory.lastRefresh = Date.now();
    saveInventory(data);
    window.runHooks('pluginInventoryRefresh', { inventory: playerInventory.inventory });
    autoRefresh();
  } else {
    return Promise.reject('empty');
  }
}

function refreshInventory(auto) {
  clearTimeout(playerInventory.autoRefreshTimer);
  requestInventory()
    .then(handleInventory)
    .catch((e) => {
      if (e === 'no core') {
        alert('You need to subscribe to C.O.R.E. to get your inventory from Intel Map.');
      } else {
        if (!auto) {
          if (e === 'empty') {
            alert('Inventory empty, probably hitting rate limit, try again later');
          } else {
            alert('Inventory: Last refresh failed. ' + e);
          }
          autoRefresh();
        }
      }
    });
}

function refreshIfOld() {
  const delay = playerInventory.lastRefresh + playerInventory.settings.autoRefreshDelay * 60 * 1000 - Date.now();
  if (delay <= 0) return refreshInventory(true);
}

function autoRefresh() {
  if (!playerInventory.settings.autoRefreshActive) return;
  playerInventory.autoRefreshTimer = setTimeout(() => refreshInventory(true), playerInventory.settings.autoRefreshDelay * 60 * 1000);
}

function stopAutoRefresh() {
  clearTimeout(playerInventory.autoRefreshTimer);
}

function exportToKeys() {
  if (!window.plugin.keys) return;
  [window.plugin.keys.KEY, window.plugin.keys.UPDATE_QUEUE].forEach((mapping) => {
    const data = {};
    for (const [guid, key] of playerInventory.inventory.keys) {
      data[guid] = key.total;
    }
    window.plugin.keys[mapping.field] = data;
    window.plugin.keys.storeLocal(mapping);
  });
  window.runHooks('pluginKeysRefreshAll');
  window.plugin.keys.delaySync();
}

function exportToClipboard() {
  const data = [];
  for (const key of playerInventory.inventory.keys.values()) {
    for (const [capsule, num] of key.count) {
      data.push([key.title, key.latLng[0].toFixed(6), key.latLng[1].toFixed(6), capsule, num].join('\t'));
    }
  }
  const shared = data.join('\n');
  const content = (
    <textarea
      onclick={() => {
        content.select();
      }}
    >
      {shared}
    </textarea>
  );

  if (typeof android !== 'undefined' && android && android.shareString) android.shareString(shared);
  else {
    window.dialog({
      title: 'Keys',
      html: content,
      width: 'auto',
      height: 'auto',
    });
  }
}

function displayNameMapping() {
  const capsules = playerInventory.inventory.capsules;
  const mapping = playerInventory.settings.capsuleNameMap;
  const capsulesName = Object.keys(capsules).sort();
  const text = [];
  for (const name of capsulesName) {
    if (mapping[name]) text.push(`${name}: ${mapping[name]}`);
  }

  const container = (
    <textarea className="container" placeholder="AAAAAAAA: Name of AAAAAAAA\nBBBBBBBB: Name of BBBBBBBB\n..." value={text.join('\n')}></textarea>
  );

  window.dialog({
    title: 'Inventory Capsule Names',
    id: 'inventory-names',
    html: container,
    buttons: [
      {
        text: 'Set',
        click: () => {
          const lines = container.value.trim().split('\n');
          for (const line of lines) {
            const m = line.trim().match(/^([0-9A-F]{8})\s*:\s*(.*)$/);
            if (m) {
              mapping[m[1]] = m[2];
            }
          }
          storeSettings(playerInventory.settings);
        },
      },
      {
        text: 'Close',
        click: function () {
          $(this).dialog('close');
        },
      },
    ],
  });
}

function displayOpt() {
  const container = (
    <div className="container">
      <label htmlFor="plugin-player-inventory-popup-enable">Keys popup</label>
      <input
        type="checkbox"
        checked={playerInventory.settings.popupEnable}
        id="plugin-player-inventory-popup-enable"
        onchange={(ev) => {
          playerInventory.settings.popupEnable = ev.target.checked === 'true' || (ev.target.checked === 'false' ? false : ev.target.checked);
          storeSettings(playerInventory.settings);
        }}
      ></input>

      <label htmlFor="plugin-player-inventory-autorefresh-enable">Auto-refresh</label>
      <input
        type="checkbox"
        checked={playerInventory.settings.autoRefreshActive}
        id="plugin-player-inventory-autorefresh-enable"
        onchange={(ev) => {
          playerInventory.settings.autoRefreshActive = ev.target.checked === 'true' || (ev.target.checked === 'false' ? false : ev.target.checked);
          if (playerInventory.settings.autoRefreshActive) {
            autoRefresh();
          } else {
            stopAutoRefresh();
          }
          storeSettings(playerInventory.settings);
        }}
      ></input>

      <label>Refresh delay (min)</label>
      <input
        type="number"
        checked={playerInventory.settings.autoRefreshDelay}
        onchange={(ev) => {
          playerInventory.settings.autoRefreshDelay = +ev.target.value > 0 ? +ev.target.value : 1;
          ev.target.value = playerInventory.settings.autoRefreshDelay;
          storeSettings(playerInventory.settings);
        }}
      ></input>

      <button onclick={displayNameMapping}>Set Capsule names</button>

      {/* sync keys with the keys plugin */}
      {window.plugin.keys && (
        <>
          <label htmlFor="plugin-player-inventory-autosync-enable">Auto-sync with Keys</label>
          <input
            type="checkbox"
            checked={playerInventory.settings.autoSyncKeys}
            id="plugin-player-inventory-autosync-enable"
            onchange={(ev) => {
              playerInventory.settings.autoSyncKeys = ev.target.checked === 'true' || (ev.target.checked === 'false' ? false : ev.target.checked);
              storeSettings(playerInventory.settings);
            }}
          ></input>
          <button onclick={exportToKeys}>Export to keys plugin</button>
        </>
      )}

      <button onclick={exportToClipboard}>Export keys to clipboard</button>

      <label htmlFor="plugin-player-inventory-keys-sidebar-enable">Keys in sidebar</label>
      <input
        type="checkbox"
        checked={playerInventory.settings.keysSidebarEnable}
        id="plugin-player-inventory-keys-sidebar-enable"
        onchange={(ev) => {
          playerInventory.settings.keysSidebarEnable = ev.target.checked === 'true' || (ev.target.checked === 'false' ? false : ev.target.checked);
          storeSettings(playerInventory.settings);
        }}
      ></input>

      <label htmlFor="plugin-player-inventory-lvlcolor-enable">Level/rarity colors</label>
      <input
        type="checkbox"
        checked={playerInventory.settings.lvlColorEnable}
        id="plugin-player-inventory-keys-lvlcolor-enable"
        onchange={(ev) => {
          playerInventory.settings.lvlColorEnable = ev.target.checked === 'true' || (ev.target.checked === 'false' ? false : ev.target.checked);
          setupCSS();
          storeSettings(playerInventory.settings);
        }}
      ></input>
    </div>
  );

  window.dialog({
    title: 'Inventory Opt',
    id: 'inventory-opt',
    html: container,
    width: 'auto',
    height: 'auto',
  });
}

function setupCSS() {
  let colorStyle = '';
  if (playerInventory.settings.lvlColorEnable) {
    window.COLORS_LVL.forEach((c, i) => {
      colorStyle += `.level_L${i}{ color: ${c} }`;
    });
    for (const r in window.COLORS_MOD) {
      colorStyle += `.rarity_${shortenRarity(r)} { color: ${window.COLORS_MOD[r]} }`;
    }
  }
  const style = document.head.querySelector('#player-inventory-css') || <style id="player-inventory-css"></style>;
  style.textContent = playerInventoryCSS + colorStyle;
  document.head.append(style);
}

function setupDisplay() {
  playerInventory.dialog = null;

  if (window.useAndroidPanes()) {
    android.addPane('playerInventory', 'Inventory', 'ic_action_view_as_list');
    window.addHook('paneChanged', function (pane) {
      if (pane === 'playerInventory') {
        refreshIfOld();
        playerInventory.pane.style.display = '';
      } else if (playerInventory.pane) {
        playerInventory.pane.style.display = 'none';
      }
    });
    playerInventory.pane = (
      <div className="inventory-box mobile" id="pane-inventory">
        <button onclick={() => refreshInventory()}>Refresh</button>
      </div>
    );
    playerInventory.pane.style.display = 'none';
    document.body.append(playerInventory.pane);

    document.getElementById('toolbox').append(
      <a title="Inventory options" onclick={displayOpt}>
        Inventory Opt
      </a>
    );
  } else {
    document.getElementById('toolbox').append(
      <a title="Show inventory" onclick={() => displayInventory(playerInventory.inventory)}>
        Inventory
      </a>
    );
  }
}

// iitc setup
export default function () {
  // Dummy inventory
  playerInventory.inventory = new Inventory();

  playerInventory.isHighlighActive = false;

  playerInventory.lastRefresh = Date.now();
  playerInventory.autoRefreshTimer = null;

  playerInventory.settings = {
    autoRefreshActive: false,
    popupEnable: true,
    autoRefreshDelay: 30,
    autoSyncKeys: false,
    keysSidebarEnable: false,
    capsuleNameMap: {},
    lvlColorEnable: true,
  };

  $.extend(playerInventory.settings, loadSettings());

  setupCSS();
  setupDisplay();

  playerInventory.requestInventory = requestInventory;

  playerInventory.highlighter = {
    highlight: portalKeyHighlight,
    setSelected: function (selected) {
      playerInventory.isHighlighActive = selected;
    },
  };
  window.addPortalHighlighter('Inventory keys', playerInventory.highlighter);

  window.addHook('pluginInventoryRefresh', (data) => {
    if (playerInventory.settings.autoSyncKeys) {
      exportToKeys();
    }
    if (playerInventory.dialog) {
      playerInventory.dialog.html(buildInventoryHTML(data.inventory));
      playerInventory.dialog.dialog('option', 'title', getTitle());
    }
    if (playerInventory.pane) {
      fillPane(data.inventory);
      const button = playerInventory.pane.querySelector('button');
      if (button) button.textContent = 'Refresh (' + new Date(playerInventory.lastRefresh).toLocaleTimeString() + ')';
    }
  });

  window.addHook('mapDataEntityInject', injectKeys);
  window.addHook('portalSelected', (data) => {
    // {selectedPortalGuid: guid, unselectedPortalGuid: oldPortalGuid}
    if (!playerInventory.settings.popupEnable) return;
    if (data.selectedPortalGuid && data.selectedPortalGuid !== data.unselectedPortalGuid) {
      const total = playerInventory.inventory.countKey(data.selectedPortalGuid);
      if (total > 0) {
        createPopup(data.selectedPortalGuid);
      }
    }
  });
  window.addHook('portalDetailsUpdated', (data) => {
    // {guid: guid, portal: portal, portalDetails: details, portalData: data}
    if (!playerInventory.settings.keysSidebarEnable) return;
    const total = playerInventory.inventory.countKey(data.guid);
    if (total > 0) {
      const key = playerInventory.inventory.keys.get(data.guid);
      const mapping = playerInventory.settings.capsuleNameMap;
      const capsules = Array.from(key.count.keys()).map((name) => (
        <div title={mapping[name] ? `${mapping[name]} [${name}]` : name}>{mapping[name] ? `${mapping[name]}` : name}</div>
      ));

      document.getElementById('randdetails').append(
        <tr className="inventory-details">
          <td>{total}</td>
          <td>Keys</td>
          <td>Capsules</td>
          <td>{capsules}</td>
        </tr>
      );
    }
  });

  loadLastInventory().then((data) => {
    playerInventory.inventory = parseInventory('⌂', data.raw);
    playerInventory.lastRefresh = data.date;
    autoRefresh();
    window.runHooks('pluginInventoryRefresh', { inventory: playerInventory.inventory });
  });
}
