import playerInventoryCSS from './player-inventory.css';

import playerInventory from './plugin';

import { Inventory, itemTypes } from './inventory';
import { parseInventory } from './parser';
import { loadLastInventory, loadSettings, storeSettings, saveInventory } from './storage';
import { requestInventory } from './request';
import { createPopup, injectKeys, portalKeyHighlight } from './map';

// eslint-disable-next-line no-unused-vars
import PortalKeyLink from './components/portalKeyLink';

function shortenRarity(v) {
  return v
    .split('_')
    .map((a) => a[0])
    .join('');
}

function localeCompare(a, b) {
  if (typeof a !== 'string') a = '';
  if (typeof b !== 'string') b = '';
  return a.localeCompare(b);
}

// eslint-disable-next-line no-unused-vars
function ItemRow(props) {
  const { item, lvl, count } = props;
  const lr = item.leveled ? 'L' + lvl : shortenRarity(lvl);
  const className = (item.leveled ? 'level_' : 'rarity_') + lr;
  const name = itemTypes[item.type];
  return (
    <tr className={className}>
      <td>{count}</td>
      <td>{lr}</td>
      <td>{name}</td>
    </tr>
  );
}

function createAllTable(inventory) {
  const table = <table></table>;
  for (const type in inventory.items) {
    const total = inventory.countType(type);
    if (total === 0) continue;
    const item = inventory.items[type];
    for (const i in item.counts) {
      const num = inventory.countType(type, i);
      if (num > 0) {
        table.append(<ItemRow item={item} count={num} lvl={i} />);
      }
    }
  }
  return table;
}

function createAllSumTable(inventory) {
  const total = inventory.items['PORTAL_LINK_KEY'].total;
  const inventoryCount = inventory.items['PORTAL_LINK_KEY'].counts['VERY_COMMON'][inventory.name] || 0;
  const otherCount = total - inventoryCount - inventory.keyLockersCount;
  let beacon = 0;
  for (const type in inventory.items) {
    if (type.startsWith('PORTAL_POWERUP')) {
      switch (type) {
        case 'PORTAL_POWERUP:FRACK':
        case 'PORTAL_POWERUP:BB_BATTLE_RARE':
        case 'PORTAL_POWERUP:BB_BATTLE':
        case 'PORTAL_POWERUP:FW_ENL':
        case 'PORTAL_POWERUP:FW_RES':
          break;
        default:
          beacon++;
      }
    }
  }
  return (
    <div>
      <table>
        <tr>
          <th>Portal Keys</th>
          <th>⌂</th>
          <th>Lockers</th>
          <th>Other</th>
        </tr>
        <tr>
          <th>{total}</th>
          <td>{inventoryCount}</td>
          <td>{inventory.keyLockersCount}</td>
          <td>{otherCount}</td>
        </tr>
      </table>
      <table>
        {[
          ['EMITTER_A', 'R'],
          ['EMP_BURSTER', 'B'],
          ['ULTRA_STRIKE', 'US'],
          ['POWER_CUBE', 'PC'],
        ].map(([type, short]) => (
          <>
            <tr>
              <th>{itemTypes[type]}</th>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <th className={'level_L' + i}>{short + i}</th>
              ))}
            </tr>
            <tr>
              <th>{inventory.countType(type)}</th>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <td>{inventory.countType(type, i)}</td>
              ))}
            </tr>
          </>
        ))}
      </table>
      <table>
        <tr>
          <th>Hypercube</th>
          <th>ADA Refactor</th>
          <th>JARVIS Virus</th>
        </tr>
        <tr>
          <td>{inventory.countType('BOOSTED_POWER_CUBE') + inventory.countType('BOOSTED_POWER_CUBE_K')}</td>
          <td>{inventory.countType('FLIP_CARD:ADA')}</td>
          <td>{inventory.countType('FLIP_CARD:JARVIS')}</td>
        </tr>
      </table>
      <table>
        <tr>
          <th>Shield</th>
          <th className="rarity_C">C</th>
          <th className="rarity_R">R</th>
          <th className="rarity_VR">VR</th>
          <th className="rarity_VR">Aegis</th>
        </tr>
        <tr>
          <th>{inventory.countType('RES_SHIELD') + inventory.countType('EXTRA_SHIELD')}</th>
          {['COMMON', 'RARE', 'VERY_RARE'].map((k) => (
            <td>{inventory.countType('RES_SHIELD', k)}</td>
          ))}
          <td>{inventory.countType('EXTRA_SHIELD')}</td>
        </tr>
      </table>
      <table>
        <tr>
          <th>Turret</th>
          <th>Force Amp</th>
          <th>Link Amp</th>
          {inventory.countType('LINK_AMPLIFIER', 'VERY_RARE') ? <th className="rarity_VR">LA VR</th> : null}
          <th>Ultra Link</th>
          <th>ITO +</th>
          <th>ITO -</th>
        </tr>
        <tr>
          <td>{inventory.countType('TURRET')}</td>
          <td>{inventory.countType('FORCE_AMP')}</td>
          <td>{inventory.countType('LINK_AMPLIFIER', 'RARE')}</td>
          {inventory.countType('LINK_AMPLIFIER', 'VERY_RARE') ? <td>{inventory.countType('LINK_AMPLIFIER', 'VERY_RARE')}</td> : null}
          <td>{inventory.countType('ULTRA_LINK_AMP')}</td>
          <td>{inventory.countType('TRANSMUTER_DEFENSE')}</td>
          <td>{inventory.countType('TRANSMUTER_ATTACK')}</td>
        </tr>
      </table>
      <table>
        <tr>
          <th>HeatSink</th>
          <th className="rarity_C">C</th>
          <th className="rarity_R">R</th>
          <th className="rarity_VR">VR</th>
          <th>MultiHack</th>
          <th className="rarity_C">C</th>
          <th className="rarity_R">R</th>
          <th className="rarity_VR">VR</th>
        </tr>
        <tr>
          <th>{inventory.countType('HEATSINK')}</th>
          {['COMMON', 'RARE', 'VERY_RARE'].map((k) => (
            <td>{inventory.countType('HEATSINK', k)}</td>
          ))}
          <th>{inventory.countType('MULTIHACK')}</th>
          {['COMMON', 'RARE', 'VERY_RARE'].map((k) => (
            <td>{inventory.countType('MULTIHACK', k)}</td>
          ))}
        </tr>
      </table>
      <table>
        <tr>
          <th>Capsule</th>
          <th>Quantum</th>
          <th>KeyLocker</th>
          <th>Kinetic</th>
          <th>Media</th>
        </tr>
        <tr>
          <td>{inventory.countType('CAPSULE')}</td>
          <td>{inventory.countType('INTEREST_CAPSULE')}</td>
          <td>{inventory.countType('KEY_CAPSULE')}</td>
          <td>
            <span className="rarity_C">{inventory.countType('KINETIC_CAPSULE', 'COMMON')}</span>
            {' + '}
            <span className="rarity_R">{inventory.countType('KINETIC_CAPSULE', 'RARE')}</span>
          </td>
          <td>{inventory.countType('MEDIA')}</td>
        </tr>
      </table>
      <table>
        <tr>
          <th>Apex</th>
          <th>Fracker</th>
          <th className="rarity_R">BB R</th>
          <th className="rarity_VR">BB VR</th>
          <th>Beacon</th>
          <th>FW ENL</th>
          <th>FW RES</th>
        </tr>
        <tr>
          <td>{inventory.countType('PLAYER_POWERUP:APEX')}</td>
          <td>{inventory.countType('PORTAL_POWERUP:FRACK')}</td>
          <td>{inventory.countType('PORTAL_POWERUP:BB_BATTLE_RARE')}</td>
          <td>{inventory.countType('PORTAL_POWERUP:BB_BATTLE')}</td>
          <td>{beacon}</td>
          <td>{inventory.countType('PORTAL_POWERUP:FW_ENL')}</td>
          <td>{inventory.countType('PORTAL_POWERUP:FW_RES')}</td>
        </tr>
      </table>
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
function KeyMediaRow(props) {
  const { item, children } = props;
  const details = Array.from(item.count)
    .map(([name, count]) => `${name}: ${count}`)
    .join(', ');
  return (
    <tr>
      <td>
        <a title={details}>{item.total}</a>
      </td>
      <td>{children}</td>
    </tr>
  );
}

function createKeysTable(inventory) {
  const keys = [...inventory.keys.values()].sort((a, b) => localeCompare(a.title, b.title));
  return (
    <table>
      {keys.map((key) => (
        <KeyMediaRow item={key}>
          <PortalKeyLink item={key} />
        </KeyMediaRow>
      ))}
    </table>
  );
}

function createMediaTable(inventory) {
  const medias = [...inventory.medias.values()].sort((a, b) => localeCompare(a.name, b.name));
  return (
    <table>
      {medias.map((media) => (
        <KeyMediaRow item={media}>
          <a href={media.url}>{media.name}</a>
        </KeyMediaRow>
      ))}
    </table>
  );
}

function createCapsuleTable(capsule) {
  const keys = Object.values(capsule.keys).sort((a, b) => localeCompare(a.title, b.title));
  const medias = Object.values(capsule.medias).sort((a, b) => localeCompare(a.name, b.name));
  return (
    <table>
      {keys.map((item) => (
        <tr>
          <td>{item.count}</td>
          {capsule.type !== 'KEY_CAPSULE' ? <td></td> : null}
          <td>
            <PortalKeyLink item={item} />
          </td>
        </tr>
      ))}
      {medias.map((item) => (
        <tr className="level_L1">
          <td>{item.count}</td>
          <td>M</td>
          <td>
            <a href={item.url}>{item.name}</a>
          </td>
        </tr>
      ))}
      {Object.keys(itemTypes).map((type) => {
        const item = capsule.items[type];
        if (item) {
          return Object.keys(item.count).map((i) => <ItemRow count={item.count[i]} item={item} lvl={i} />);
        }
      })}
    </table>
  );
}

function buildInventoryHTML(inventory) {
  const inventoryCount = inventory.count - inventory.keyLockersCount;
  const keyInInventory = inventory.keys.size > 0 ? inventory.items['PORTAL_LINK_KEY'].counts['VERY_COMMON'][inventory.name] || 0 : 0;
  const container = (
    <div className="container">
      <b>{`Summary I:${inventoryCount - keyInInventory} K:${keyInInventory} T:${inventoryCount}/2500 KL:${inventory.keyLockersCount}`}</b>
      <div className="sum">{createAllSumTable(inventory)}</div>

      <b>Details</b>
      <div className="all">{createAllTable(inventory)}</div>
    </div>
  );

  if (inventory.keys.size > 0) {
    container.append(
      <>
        <b>Keys</b>
        <div className="medias">{createKeysTable(inventory)}</div>
      </>
    );
  }

  if (inventory.medias.size > 0) {
    container.append(
      <>
        <b>Medias</b>
        <div className="all">{createMediaTable(inventory)}</div>
      </>
    );
  }

  const onHand = inventory.onHand();
  container.append(
    <>
      <b>On Hand ({onHand.size})</b>
      <div className="capsule">{createCapsuleTable(onHand)}</div>
    </>
  );

  const mapping = playerInventory.settings.capsuleNameMap;
  const capsulesName = Object.keys(inventory.capsules).sort((a, b) => {
    if (mapping[a] && !mapping[b]) return -1;
    if (!mapping[a] && mapping[b]) return 1;
    a = mapping[a] || a;
    b = mapping[b] || b;
    return localeCompare(a, b);
  });
  const keyLockers = capsulesName.filter((name) => inventory.capsules[name].type === 'KEY_CAPSULE');
  const quantums = capsulesName.filter((name) => inventory.capsules[name].type === 'INTEREST_CAPSULE');
  const commonCapsules = capsulesName.filter((name) => inventory.capsules[name].type === 'CAPSULE');
  for (const names of [keyLockers, quantums, commonCapsules]) {
    for (const name of names) {
      const capsule = inventory.capsules[name];
      if (capsule.size > 0) {
        const displayName = mapping[name] ? `${mapping[name]} [${name}]` : name;
        const typeName = itemTypes[capsule.type];
        const size = capsule.size;

        const head = <b>{`${typeName}: ${displayName} (${size})`}</b>;

        container.append(
          <>
            {head}
            <div className="capsule">
              <div>
                <a
                  className="edit-name-icon"
                  title="Change capsule name"
                  onclick={(ev) => {
                    const input = ev.target.nextElementSibling;
                    input.style.display = input.style.display === 'unset' ? null : 'unset';
                  }}
                >
                  ✏️
                </a>
                <input
                  className="edit-name-input"
                  value={mapping[name] || ''}
                  placeholder="Enter capsule name"
                  oninput={(ev) => {
                    mapping[name] = ev.target.value;
                    storeSettings(playerInventory.settings);
                    const displayName = mapping[name] ? `${mapping[name]} [${name}]` : name;
                    head.textContent = `${typeName}: ${displayName} (${size})`;
                  }}
                />
              </div>
              {createCapsuleTable(capsule)}
            </div>
          </>
        );
      }
    }
  }

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
