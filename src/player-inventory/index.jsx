import playerInventory from './plugin';

import { Inventory } from './inventory';
import { parseInventory } from './parser';
import { loadLastInventory, loadSettings } from './storage';
import { requestInventory } from './request';
import { createPopup, injectKeys, portalKeyHighlight } from './map';
import { exportToKeys } from './pluginKeys';
import { setupCSS } from './style';

import { refreshInventory, refreshIfOld, autoRefresh } from './refresh';

// eslint-disable-next-line no-unused-vars
import InventoryTables from './components/InventoryTables';
// eslint-disable-next-line no-unused-vars
import Options from './components/Options';

function buildInventoryHTML(inventory, capsule) {
  const container = <InventoryTables inventory={inventory} />;

  $(container).accordion({
    header: 'b',
    heightStyle: 'fill',
    collapsible: true,
  });

  if (capsule) {
    let idx =
      Array.from(container.children).filter((e) => e.tagName == 'B').findIndex((e) => e.dataset['capsule'] == capsule);
    if (idx >= 0)
      $(container).accordion("option", "active", idx);
  }

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

function displayInventory(inventory, capsule) {
  const container = buildInventoryHTML(inventory, capsule);

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

function displayOpt() {
  const container = <Options />;

  window.dialog({
    title: 'Inventory Opt',
    id: 'inventory-opt',
    html: container,
    width: 'auto',
    height: 'auto',
  });
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

    if (window.script_info.script.version < '0.38') {
      document.getElementById('toolbox').append(
        <a title="Inventory options" onclick={displayOpt}>
          Inventory Opt
        </a>
      );
    } else {
      window.IITC.toolbox.addButton({
        label: 'Inventory Opt',
        title: 'Inventory options',
        action: displayOpt
      });
    }
  } else {
    if (window.script_info.script.version < '0.38') {
      document.getElementById('toolbox').append(
        <a title="Show inventory" onclick={() => displayInventory(playerInventory.inventory)}>
          Inventory
        </a>
      );
    } else {
      window.IITC.toolbox.addButton({
        label: 'Inventory',
        title: 'Show inventory',
        action: () => displayInventory(playerInventory.inventory)
      });
    }
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
    highlightColor: '#ff0000',
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
        <div title={mapping[name] ? `${mapping[name]} [${name}]` : name} onclick={() => displayInventory(playerInventory.inventory, name)}>
          {mapping[name] ? `${mapping[name]}` : name}
        </div>
      ));

      document.getElementById('randdetails').append(
        <tr className="inventory-details">
          <td>{total}</td>
          <th>Keys</th>
          <th>Capsules</th>
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
