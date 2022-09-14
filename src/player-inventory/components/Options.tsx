import playerInventory from '../plugin';
import { storeSettings } from '../storage';

import { stopAutoRefresh, autoRefresh } from '../refresh';
import { exportToKeys } from '../pluginKeys';
import { setupCSS } from '../style';

export default function () {
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
  return container;
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
