// @author         jaiperdu
// @name           Player Inventory
// @category       Info
// @version        0.2.29
// @description    View inventory and highlight portals with keys at any zoom. Can be used with the official plugins Keys and Keys on map to show the number of keys on the map.

// stock intel
const itemTypes = {
  PORTAL_LINK_KEY: 'Portal Key',
  EMITTER_A: 'Resonator',
  EMP_BURSTER: 'Xmp Burster',
  ULTRA_STRIKE: 'Ultra Strike',
  FLIP_CARD: 'Alignment Virus',
  'FLIP_CARD:ADA': 'ADA Refactor',
  'FLIP_CARD:JARVIS': 'JARVIS Virus',
  POWER_CUBE: 'Power Cube',
  BOOSTED_POWER_CUBE: 'Hypercube',
  BOOSTED_POWER_CUBE_K: 'Hypercube',
  RES_SHIELD: 'Portal Shield',
  EXTRA_SHIELD: 'Aegis Shield',
  TURRET: 'Turret',
  FORCE_AMP: 'Force Amp',
  LINK_AMPLIFIER: 'Link Amp',
  ULTRA_LINK_AMP: 'Ultra Link',
  HEATSINK: 'Heat Sink',
  MULTIHACK: 'Multi-hack',
  TRANSMUTER_ATTACK: 'Ito En Transmuter (-)',
  TRANSMUTER_DEFENSE: 'Ito En Transmuter (+)',
  MEDIA: 'Media',
  CAPSULE: 'Capsule',
  INTEREST_CAPSULE: 'Quantum Capsule',
  KEY_CAPSULE: 'Key Capsule',
  KINETIC_CAPSULE: 'Kinetic Capsule',
  DRONE: 'Drone',
  MYSTERIOUS_ITEM_PLACEHOLDER: 'Mysterious item',
  PLAYER_POWERUP: 'Player Powerup',
  'PLAYER_POWERUP:APEX': 'Apex Mod',
  PORTAL_POWERUP: 'Portal Powerup',
  'PORTAL_POWERUP:FRACK': 'Portal Fracker',
  'PORTAL_POWERUP:NEMESIS': 'Beacon - Nemesis',
  'PORTAL_POWERUP:TOASTY': 'Beacon - Toast!',
  'PORTAL_POWERUP:EXO5': 'Beacon - EXO5',
  'PORTAL_POWERUP:MAGNUSRE': 'Beacon - Reawakens',
  'PORTAL_POWERUP:VIANOIR': 'Beacon - Via Noir',
  'PORTAL_POWERUP:VIALUX': 'Beacon - Via Lux',
  'PORTAL_POWERUP:INITIO': 'Beacon - Initio',
  'PORTAL_POWERUP:AEGISNOVA': 'Beacon - Aegis Nova',
  'PORTAL_POWERUP:OBSIDIAN': 'Beacon - Obsidian',
  'PORTAL_POWERUP:NIA': 'Beacon - Niantic',
  'PORTAL_POWERUP:ENL': 'Beacon - ENL',
  'PORTAL_POWERUP:RES': 'Beacon - RES',
  'PORTAL_POWERUP:MEET': 'Beacon - Meetup',
  'PORTAL_POWERUP:LOOK': 'Beacon - Target',
  'PORTAL_POWERUP:BB_BATTLE': 'Battle Beacon',
  'PORTAL_POWERUP:FW_ENL': 'Enlightened Fireworks',
  'PORTAL_POWERUP:FW_RES': 'Resistance Fireworks',
  'PORTAL_POWERUP:BN_BLM': 'Beacon - Black Lives Matter',
};

const levelItemTypes = [
  "EMITTER_A",
  "EMP_BURSTER",
  "POWER_CUBE",
  "ULTRA_STRIKE",
  "MEDIA",
];

const rarity = [
  "VERY_COMMON",
  "COMMON",
  "LESS_COMMON",
  "RARE",
  "VERY_RARE",
  "EXTREMELY_RARE",
];

const rarityShort = rarity.map((v) => v.split('_').map((a) => a[0]).join(''));

const rarityToInt = {}
for (const i in rarity)
  rarityToInt[rarity[i]] = i;

class Inventory {
  constructor(name) {
    this.name = name;
    this.keys = new Map(); // guid => {counts: caps => count}
    this.medias = new Map();
    this.clear();
  }

  clear() {
    this.keys.clear();
    this.medias.clear();
    this.capsules = {};
    this.items = {};
    for (const type in itemTypes) {
      this.items[type] = {
        type: type,
        name: itemTypes[type],
        leveled: levelItemTypes.includes(type),
        counts: {},
        total: 0,
      }
    }
    this.count = 0;
    this.keyLockersCount = 0;
  }

  addCapsule(capsule) {
    const data = {
      name: capsule.name,
      size: capsule.size,
      type: capsule.type,
      keys: {},
      medias: {},
      items: {},
    }
    this.capsules[capsule.name] = data;

    if (capsule.type === "KEY_CAPSULE")
      this.keyLockersCount += capsule.size;

    this.addItem(capsule);
    for (const item of capsule.content) {
      this.addItem(item);
      if (item.type === "PORTAL_LINK_KEY")
        data.keys[item.guid] = item;
      else if (item.type === "MEDIA")
        data.medias[item.mediaId] = item;
      else {
        if (!data.items[item.type]) data.items[item.type] = {repr: item, leveled: levelItemTypes.includes(item.type), count:{}};
        data.items[item.type].count[item.rarity || item.level] = item.count;
      }
    }
  }

  addItem(item) {
    const cat = this.items[item.type];
    const lr = cat.leveled ? item.level : item.rarity;
    if (!cat.counts[lr]) cat.counts[lr] = {};
    const count = cat.counts[lr];
    if (!item.capsule) item.capsule = this.name;
    if (!item.count) item.count = 1;
    count[item.capsule] = (count[item.capsule] || 0) + item.count;
    count.total = (count.total || 0) + item.count;
    cat.total += item.count;
    this.count += item.count;

    if (item.type === "PORTAL_LINK_KEY") {
      this.addKey(item);
    } else if (item.type === "MEDIA") {
      this.addMedia(item);
    }
  }

  countType(type, levelRarity) {
    const cat = this.items[type];
    if (levelRarity !== undefined) {
      return cat.counts[levelRarity] ? cat.counts[levelRarity].total : 0;
    }
    return cat.total;
  }

  addMedia(media) {
    if (!this.medias.has(media.mediaId))
      this.medias.set(media.mediaId, {
        mediaId: media.mediaId,
        name: media.name,
        url: media.url,
        count: new Map(),
        total: 0,
      });
    const current = this.medias.get(media.mediaId);
    const entry = current.count.get(media.capsule) || 0;
    current.count.set(media.capsule, entry + (media.count || 1));
    current.total += (media.count || 1);
  }

  countKey(guid) {
    if (!this.keys.has(guid)) return 0;
    return this.keys.get(guid).total;
  }

  addKey(key) {
    if (!this.keys.has(key.guid))
      this.keys.set(key.guid, {
        guid: key.guid,
        title: key.title,
        latLng: key.latLng,
        address: key.address,
        count: new Map(),
        total: 0,
      });
    const current = this.keys.get(key.guid);
    const entry = current.count.get(key.capsule) || 0;
    current.count.set(key.capsule, entry + (key.count || 1));
    current.total += (key.count || 1);
  }

  onHand() {
    const data = {
      name: this.name,
      size: 0,
      keys: {},
      medias: {},
      items: {},
    };

    for (const key of this.keys.values()) {
      const count = key.count.get(this.name);
      if (count) {
        data.keys[key.guid] = {
          guid: key.guid,
          title: key.title,
          latLng: key.latLng,
          address: key.address,
          count: key.count.get(this.name),
        };
        data.size += count;
      }
    }

    for (const type in itemTypes) {
      if (type === "PORTAL_LINK_KEY") continue;
      const item = this.items[type];
      for (const k in item.counts) {
        const count = item.counts[k][this.name];
        if (count) {
          if (!data.items[type])
            data.items[type] = {
              leveled: levelItemTypes.includes(type),
              count:{}
            };
          data.items[type].count[k] = count;
          data.size += count;
        }
      }
    }
    return data;
  }
}

function parsePortalLocation(location) {
  return [lat, lng] = location.split(',').map(a => (Number.parseInt(a,16)&(-1))*1e-6);
}

/*
{
  "modResource": {
    "displayName": "SoftBank Ultra Link",
    "stats": {
      "LINK_RANGE_MULTIPLIER": "5000",
      "LINK_DEFENSE_BOOST": "1500",
      "OUTGOING_LINKS_BONUS": "8",
      "REMOVAL_STICKINESS": "150000",
      ...

      "BURNOUT_INSULATION": "4",
      "HACK_SPEED": "200000",
      "ATTACK_FREQUENCY": "1500",
      "HIT_BONUS": "200000",
      "REMOVAL_STICKINESS": "200000",
      "XM_SPIN": "-1"
    },
    "rarity": "VERY_RARE",
    "resourceType": "ULTRA_LINK_AMP"
  }
}
*/
function parseMod(mod) {
  return {
    type: mod.modResource.resourceType,
    name: mod.modResource.displayName,
    rarity: mod.modResource.rarity,
  }
}

/*
{
  "resourceWithLevels": {
    "resourceType": "MEDIA",
    "level": 1
  },
  "imageByUrl": {
    "imageUrl": "http://lh3.googleusercontent.com/l62x6RqXSc0JZESahVtmbUOdLFDPAwVUaxx9kfOkAu98HA7bnU0mOftOV10qzgd_tO7dA_chiZHmG8YxfN0F"
  },
  "inInventory": {
    "playerId": "redacted",
    "acquisitionTimestampMs": "redacted"
  },
  "displayName": {
    "displayName": "Media"
  },
  "storyItem": {
    "primaryUrl": "https://youtu.be/4MyMpzkcYmk",
    "shortDescription": "UmbraDefeat",
    "mediaId": "4176",
    "hasBeenViewed": false,
    "releaseDate": "1571122800000"
  }
*/
function parseMedia(data, media) {
  data.mediaId = media.storyItem.mediaId;
  data.name = media.storyItem.shortDescription;
  data.url = media.storyItem.primaryUrl;
  return data;
}

// {
//   "resourceWithLevels": {
//     "resourceType": "EMITTER_A",
//     "level": 7
//   }
// }
function parseLevelItem(obj) {
  const data = {
    type: obj.resourceWithLevels.resourceType,
    level: obj.resourceWithLevels.level,
  };
  if (obj.storyItem)
    return parseMedia(data, obj);
  return data;
}

/*
{
  "resource": {
    "resourceType": "PORTAL_LINK_KEY",
    "resourceRarity": "VERY_COMMON"
  },
  "portalCoupler": {
    "portalGuid": "...",
    "portalLocation": "int32 hex,int32 hex",
    "portalImageUrl": "...",
    "portalTitle": "...",
    "portalAddress": "..."
  },
  "inInventory": {
    "playerId": "...",
    "acquisitionTimestampMs": "..."
  }
}
*/
function parsePortalKey(data, key) {
  data.guid = key.portalCoupler.portalGuid;
  data.title = key.portalCoupler.portalTitle;
  data.latLng = parsePortalLocation(key.portalCoupler.portalLocation);
  data.address = key.portalCoupler.portalAddress;
  return data;
}

/*
{
  "resource": {
    "resourceType": "FLIP_CARD",
    "resourceRarity": "VERY_RARE"
  },
  "flipCard": {
    "flipCardType": "JARVIS"
  }
}
*/
function parseFlipCard(data, flipcard) {
  data.type += ':' + flipcard.flipCard.flipCardType;
  return data;
}

/*
{
  "resource": {
    "resourceType": "PLAYER_POWERUP",
    "resourceRarity": "VERY_RARE"
  },
  "inInventory": {
    "playerId": "...",
    "acquisitionTimestampMs": "..."
  },
  "playerPowerupResource": {
    "playerPowerupEnum": "APEX"
  }
}
*/
function parsePlayerPowerUp(data, powerup) {
  data.type += ':' + powerup.playerPowerupResource.playerPowerupEnum;
  return data;
}

/*
{
  "resource": {
    "resourceType": "PORTAL_POWERUP",
    "resourceRarity": "VERY_RARE"
  },
  "timedPowerupResource": {
    "multiplier": 0,
    "designation": "NIA",
    "multiplierE6": 1000000
  }
}
*/
function parsePortalPowerUp(data, powerup) {
  data.type += ':' + powerup.timedPowerupResource.designation;
  return data;
}
/*
{
  "resource": {
    "resourceType": "INTEREST_CAPSULE",
    "resourceRarity": "VERY_RARE"
  },
  "moniker": {
    "differentiator": "12345678"
  },
  "container": {
    "currentCapacity": 100,
    "currentCount": 0,
    "stackableItems": [
      {
        "itemGuids": [...],
        "exampleGameEntity": ["...", 0, {
          <ITEMDATA>,
          "displayName": {
            "displayName": "Portal Shield",
            "displayDescription": "Mod which shields Portal from attacks."
          }
        }]
      },
    ]
  }
}
*/
function parseContainer(data, container) {
  data.name = container.moniker.differentiator;
  data.size = container.container.currentCount;
  data.content = [];
  for (const stackableItem of container.container.stackableItems) {
    const item = parseItem(stackableItem.exampleGameEntity);
    if (item) {
      item.count = stackableItem.itemGuids.length;
      item.capsule = data.name;
      data.content.push(item);
    }
  }
  return data;
}

function parseResource(obj) {
  const data = {
    type: obj.resource.resourceType,
    rarity: obj.resource.resourceRarity,
  };
  if (obj.flipCard)
    return parseFlipCard(data, obj);
  if (obj.container)
    return parseContainer(data, obj);
  if (obj.portalCoupler)
    return parsePortalKey(data, obj);
  if (obj.timedPowerupResource)
    return parsePortalPowerUp(data, obj);
  if (obj.playerPowerupResource)
    return parsePlayerPowerUp(data, obj);
  return data;
}
/*
[
  guid, timestamp?, item object
]
*/
function parseItem(item) {
  const [id, ts, obj] = item;
  if (obj.resource)
    return parseResource(obj);
  if (obj.resourceWithLevels)
    return parseLevelItem(obj);
  if (obj.modResource)
    return parseMod(obj);
  // xxx: other types
}

function parseInventory(name, data) {
  const inventory = new Inventory(name);
  for (const entry of data) {
    const item = parseItem(entry);
    if (item) {
      if (item.type.includes("CAPSULE"))
        inventory.addCapsule(item);
      else
        inventory.addItem(item);
    }
  }
  return inventory;
}

const plugin = {};
window.plugin.playerInventory = plugin;

// again...
function getPortalLink(key) {
  const a = L.DomUtil.create('a');
  a.textContent = key.title;
  a.title = key.address;
  a.href = window.makePermalink(key.latLng);
  L.DomEvent.on(a, 'click', function(event) {
      window.renderPortalDetails(key.guid);
      window.selectPortalByLatLng(key.latLng);
      event.preventDefault();
      return false;
  })
  L.DomEvent.on(a, 'dblclick', function(event) {
      window.renderPortalDetails(key.guid);
      window.zoomToAndShowPortal(key.guid, key.latLng);
      event.preventDefault();
      return false;
  });
  return a;
}

function localeCompare(a,b) {
  if (typeof a !== "string") a = '';
  if (typeof b !== "string") b = '';
  return a.localeCompare(b)
}

const STORE_KEY = "plugin-player-inventory";
const SETTINGS_KEY = "plugin-player-inventory-settings";

function openIndexedDB() {
  const rq = window.indexedDB.open("player-inventory", 1);
  rq.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore("inventory", { autoIncrement: true });
  };
  return rq;
}

function loadFromIndexedDB() {
  if (!window.indexedDB) return loadFromLocalStorage();
  const rq = openIndexedDB();
  rq.onerror = function (event) {
    loadFromLocalStorage();
  };
  rq.onsuccess = function (event) {
    const db = event.target.result;
    const tx = db.transaction(["inventory"], "readonly");
    const store = tx.objectStore("inventory");
    store.getAll().onsuccess = function (event) {
      const r = event.target.result;
      if (r.length > 0) {
        const data = r[r.length-1];
        plugin.inventory = parseInventory("⌂", data.raw);
        plugin.lastRefresh = data.date;
        autoRefresh();
        window.runHooks("pluginInventoryRefresh", {inventory: plugin.inventory});
      } else {
        loadFromLocalStorage();
      }
    }
    db.close();
  };
}

function storeToIndexedDB(data) {
  if (!window.indexedDB) return storeToLocalStorage(data);
  const rq = openIndexedDB();
  rq.onerror = function (event) {
    storeToLocalStorage(data);
  };
  rq.onsuccess = function (event) {
    const db = event.target.result;
    const tx = db.transaction(["inventory"], "readwrite");
    const store = tx.objectStore("inventory");
    store.clear().onsuccess = function (event) {
      const rq = store.add({
        raw: data,
        date: Date.now(),
      });
    };
    tx.oncomplete = function () {
      delete localStorage[STORE_KEY];
    }
    tx.onerror = function () {
      storeToLocalStorage(data);
    }
    db.close();
  };
}

function loadFromLocalStorage() {
  const store = localStorage[STORE_KEY];
  if (store) {
    try {
      const data = JSON.parse(store);
      plugin.inventory = parseInventory("⌂", data.raw);
      plugin.lastRefresh = data.date;
      autoRefresh();
      window.runHooks("pluginInventoryRefresh", {inventory: plugin.inventory});
    } catch (e) {console.log(e);}
  }
}

function storeToLocalStorage(data) {
  const store = {
    raw: data,
    date: Date.now(),
  }
  localStorage[STORE_KEY] = JSON.stringify(store);
}

function loadSettings() {
  const settings = localStorage[SETTINGS_KEY];
  if (settings) {
    try {
      const data = JSON.parse(settings);
      $.extend(plugin.settings, data);
    } catch (e) {console.log(e);}
  }
}

function storeSettings() {
  localStorage[SETTINGS_KEY] = JSON.stringify(plugin.settings);
}

function handleInventory(data) {
  if (data.result.length > 0) {
    plugin.inventory = parseInventory("⌂", data.result);
    plugin.lastRefresh = Date.now();
    storeToIndexedDB(data.result);
    window.runHooks("pluginInventoryRefresh", {inventory: plugin.inventory});
  } else {
    alert("Inventory empty, probably hitting rate limit, try again later");
  }
  autoRefresh();
}

function handleError() {
  autoRefresh();
}

function getInventory() {
  window.postAjax('getInventory', {lastQueryTimestamp:0}, handleInventory, handleError);
}

function handleSubscription(data) {
  plugin.hasActiveSubscription = data.result;
  if (data.result) getInventory();
}

function getSubscriptionStatus() {
  window.postAjax('getHasActiveSubscription', {}, handleSubscription, handleError);
}

function injectKeys(data) {
  if (!plugin.isHighlighActive)
    return;

  const bounds = window.map.getBounds();
  const entities = [];
  for (const [guid, key] of plugin.inventory.keys) {
    if (bounds.contains(key.latLng)) {
      // keep known team
      const team = window.portals[guid] ? window.portals[guid].options.ent[2][1] : 'N';
      const ent = [
        guid,
        0,
        ['p', team, Math.round(key.latLng[0]*1e6), Math.round(key.latLng[1]*1e6)]
      ];
      entities.push(ent);
    }
  }
  data.callback(entities);
}

function portalKeyHighlight(data) {
  const guid = data.portal.options.guid;
  if (plugin.inventory.keys.has(guid)) {
    // place holder
    if (data.portal.options.team != TEAM_NONE && data.portal.options.level === 0) {
      data.portal.setStyle({
        color: 'red',
        weight: 2*Math.sqrt(window.portalMarkerScale()),
        dashArray: '',
      });
    }
    else if (window.map.getZoom() < 15 && data.portal.options.team == TEAM_NONE && !window.portalDetail.isFresh(guid))
      // injected without intel data
      data.portal.setStyle({color: 'red', fillColor: 'gray'});
    else data.portal.setStyle({color: 'red'});
  }
}

function createPopup(guid) {
  const portal = window.portals[guid];
  const latLng = portal.getLatLng();
  // create popup only if the portal is in view
  if (window.map.getBounds().contains(latLng)) {
    const count = plugin.inventory.keys.get(guid).count;
    const text = Array.from(count).map(([name, count]) => `<strong>${name}</strong>: ${count}`).join('<br/>');

    const popup = L.popup()
      .setLatLng(latLng)
      .setContent('<div class="inventory-keys">' + text + '</div>').openOn(window.map);
  }
}

function createAllTable(inventory) {
  const table = L.DomUtil.create("table");
  for (const type in inventory.items) {
    const total = inventory.countType(type);
    if (total == 0)
      continue;
    const item = inventory.items[type];
    for (const i in item.counts) {
      const num = inventory.countType(type, i);
      if (num > 0) {
        const lr = item.leveled ? "L" + i : rarityShort[rarityToInt[i]];
        const row = L.DomUtil.create('tr', (item.leveled ? "level_" : "rarity_") + lr, table);
        row.innerHTML = `<td>${num}</td><td>${lr}</td><td>${item.name}</td>`;
      }
    }
  }
  return table;
}

function createAllSumTable(inventory) {
  const table = L.DomUtil.create("table");
  for (const type in inventory.items) {
    const total = inventory.countType(type);
    if (total == 0)
      continue;
    const item = inventory.items[type];

    const row = L.DomUtil.create('tr', null, table);

    const nums = [];

    if (type === "PORTAL_LINK_KEY") {
      const inventoryCount = item.counts["VERY_COMMON"][inventory.name] || 0;
      const otherCount = total - inventoryCount - inventory.keyLockersCount;
      nums.push(`<span class="level_L1">${inventory.name}: ${inventoryCount}</span>`);
      nums.push(`<span class="level_L1">Key Lockers: ${inventory.keyLockersCount}</span>`);
      nums.push(`<span class="level_L1">Other: ${otherCount}</span>`);
    } else {
      for (const k in item.counts) {
        const num = inventory.countType(type, k);
        if (num > 0) {
          const lr = item.leveled ? "L" + k : rarityShort[rarityToInt[k]];
          const className = (item.leveled ? "level_" : "rarity_") + lr;
          nums.push(`<span class="${className}">${num} ${lr}</span>`);
        }
      }
    }

    row.innerHTML = `<td>${item.name}</td><td>${total}</td><td>${nums.join(', ')}</td>`;
  }
  return table;
}

function createKeysTable(inventory) {
  const table = L.DomUtil.create("table");
  const keys = [...inventory.keys.values()].sort((a,b) => localeCompare(a.title, b.title));
  for (const key of keys) {
    const a = getPortalLink(key);
    const total = inventory.countKey(key.guid);
    const counts = Array.from(key.count).map(([name, count]) => `${name}: ${count}`).join(', ');

    const row = L.DomUtil.create('tr', null, table);
    L.DomUtil.create('td', null, row).innerHTML = `<a title="${counts}">${total}</a>`;
    L.DomUtil.create('td', null, row).appendChild(a);
    // L.DomUtil.create('td', null, row).textContent = counts;
  }
  return table;
}

function createMediaTable(inventory) {
  const table = L.DomUtil.create("table");
  const medias = [...inventory.medias.values()].sort((a,b) => localeCompare(a.name, b.name));
  for (const media of medias) {
    const counts = Array.from(media.count).map(([name, count]) => `${name}: ${count}`).join(', ');

    L.DomUtil.create('tr', 'level_L1', table).innerHTML =
        `<td><a title="${counts}">${media.total}</a></td>`
      + `<td><a href="${media.url}">${media.name}</a>`;
  }
  return table;
}

function createCapsuleTable(inventory, capsule) {
  const table = L.DomUtil.create("table");
  const keys = Object.values(capsule.keys).sort((a,b) => localeCompare(a.title, b.title));
  for (const item of keys) {
    const a = getPortalLink(item);
    const total = item.count;

    const row = L.DomUtil.create('tr', null, table);
    L.DomUtil.create('td', null, row).textContent = total;
    if (capsule.type !== "KEY_CAPSULE") L.DomUtil.create('td', null, row);
    L.DomUtil.create('td', null, row).appendChild(a);
  }
  const medias = Object.values(capsule.medias).sort((a,b) => localeCompare(a.name, b.name));
  for (const item of medias) {
    L.DomUtil.create('tr', 'level_L1', table).innerHTML = `<td>${item.count}</td><td>M</td><td><a href="${item.url}">${item.name}</a>`;
  }
  for (const type in itemTypes) {
    const item = capsule.items[type];
    if (!item) continue;
    const name = itemTypes[type];
    for (const k in item.count) {
      const lr = item.leveled ? "L" + k : rarityShort[rarityToInt[k]];
      const row = L.DomUtil.create('tr', (item.leveled ? "level_" : "rarity_") + lr, table);
      row.innerHTML = `<td>${item.count[k]}</td><td>${lr}</td><td>${name}</td>`;
    }
  }
  return table;
}

function buildInventoryHTML(inventory) {
  const container = L.DomUtil.create("div", "container");

  const sumHeader = L.DomUtil.create("b", null, container);
  {
    const inventoryCount = inventory.count - inventory.keyLockersCount;
    const keyInInventory = (inventory.keys.size > 0) ? inventory.items["PORTAL_LINK_KEY"].counts["VERY_COMMON"][inventory.name] || 0 : 0;
    sumHeader.textContent = `Summary I:${inventoryCount - keyInInventory} K:${keyInInventory} T:${inventoryCount}/2500 KL:${inventory.keyLockersCount}`;
  }
  const sum = L.DomUtil.create("div", "sum", container);
  sum.appendChild(createAllSumTable(inventory));

  const allHeader = L.DomUtil.create("b", null, container);
  allHeader.textContent = "Details";
  const all = L.DomUtil.create("div", "all", container);
  all.appendChild(createAllTable(inventory));

  const keysHeader = L.DomUtil.create("b", null, container);
  keysHeader.textContent = "Keys";
  const keys = L.DomUtil.create("div", "keys", container);
  keys.appendChild(createKeysTable(inventory));

  if (inventory.medias.size > 0) {
    const mediasHeader = L.DomUtil.create("b", null, container);
    mediasHeader.textContent = "Medias";
    const medias = L.DomUtil.create("div", "medias", container);
    medias.appendChild(createMediaTable(inventory));
  }

  const onHand = inventory.onHand();
  L.DomUtil.create("b", null, container).textContent = `On Hand (${onHand.size})`;
  L.DomUtil.create("div", "capsule", container).appendChild(createCapsuleTable(inventory, onHand));

  const capsulesName = Object.keys(inventory.capsules).sort();
  const keyLockers = capsulesName.filter((name) => inventory.capsules[name].type === "KEY_CAPSULE");
  const quantums = capsulesName.filter((name) => inventory.capsules[name].type === "INTEREST_CAPSULE");
  const commonCapsules = capsulesName.filter((name) => inventory.capsules[name].type === "CAPSULE");
  for (const names of [keyLockers, quantums, commonCapsules]) {
    for (const name of names) {
      const capsule = inventory.capsules[name];
      if (capsule.size > 0) {
        L.DomUtil.create("b", null, container).textContent = `${itemTypes[capsule.type]}: ${name} (${capsule.size})`;
        L.DomUtil.create("div", "capsule", container).appendChild(createCapsuleTable(inventory, capsule));
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
  const oldContainer = plugin.pane.querySelector('.container');
  if (oldContainer) plugin.pane.removeChild(oldContainer);
  plugin.pane.appendChild(buildInventoryHTML(inventory));
}

function displayInventory(inventory) {
  const container = buildInventoryHTML(inventory);

  plugin.dialog = dialog({
    title: 'Inventory',
    id: 'inventory',
    html: container,
    width: 'auto',
    height: '500',
    classes: {
      'ui-dialog-content': 'inventory-box',
    },
    buttons: {
      "Refresh": refreshInventory,
      "Options": displayOpt,
    }
  });

  refreshIfOld();
}

function refreshInventory() {
  clearTimeout(plugin.autoRefreshTimer);
  getSubscriptionStatus();
}

function refreshIfOld() {
  const delay = plugin.lastRefresh + plugin.settings.autoRefreshDelay * 60 * 1000 - Date.now();
  if (delay <= 0) return refreshInventory();
}

function autoRefresh() {
  if (!plugin.settings.autoRefreshActive) return;
  plugin.autoRefreshTimer = setTimeout(refreshInventory, plugin.settings.autoRefreshDelay * 60 * 1000);
}

function stopAutoRefresh() {
  clearTimeout(plugin.autoRefreshTimer);
}

function exportToKeys() {
  if (!window.plugin.keys) return;
  [window.plugin.keys.KEY, window.plugin.keys.UPDATE_QUEUE].forEach((mapping) => {
    const data = {};
    for (const [guid, key] of plugin.inventory.keys) {
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
  for (const [guid, key] of plugin.inventory.keys) {
    for (const [capsule, num] of key.count) {
      data.push([key.title, key.latLng[0], key.latLng[1], capsule, num].join('\t'));
    }
  }
  const shared = data.join('\n');

  if(typeof android !== 'undefined' && android && android.shareString)
    android.shareString(shared);
  else {
    const content = L.DomUtil.create('textarea');
    content.textContent = shared;
    L.DomEvent.on(content, 'click', () => {
      content.select();
    });
    dialog({
      title: 'Keys',
      html: content,
      width: 'auto',
      height: 'auto',
    });
  }

}

function displayOpt() {
  const container = L.DomUtil.create("div", "container");

  const popupLabel = L.DomUtil.create('label', null, container);
  popupLabel.textContent = "Keys popups";
  popupLabel.htmlFor = "plugin-player-inventory-popup-enable"
  const popupCheck = L.DomUtil.create('input', null, container);
  popupCheck.type = 'checkbox';
  popupCheck.checked = plugin.settings.popupEnable;
  popupCheck.id = 'plugin-player-inventory-popup-enable';
  L.DomEvent.on(popupCheck, "change", (ev) => {
    plugin.settings.popupEnable = popupCheck.checked === 'true' || (popupCheck.checked === 'false' ? false : popupCheck.checked);
    storeSettings();
  });

  const refreshLabel = L.DomUtil.create('label', null, container);
  refreshLabel.textContent = "Auto-refresh";
  refreshLabel.htmlFor = "plugin-player-inventory-autorefresh-enable"
  const refreshCheck = L.DomUtil.create('input', null, container);
  refreshCheck.type = 'checkbox';
  refreshCheck.checked = plugin.settings.autoRefreshActive;
  refreshCheck.id = 'plugin-player-inventory-autorefresh-enable';
  L.DomEvent.on(refreshCheck, "change", (ev) => {
    plugin.settings.autoRefreshActive = refreshCheck.checked === 'true' || (refreshCheck.checked === 'false' ? false : refreshCheck.checked);
    if (plugin.settings.autoRefreshActive) {
      autoRefresh();
    } else {
      stopAutoRefresh();
    }
    storeSettings();
  });

  const refreshDelayLabel = L.DomUtil.create('label', null, container);
  refreshDelayLabel.textContent = "Refresh delay (min)";
  const refreshDelay = L.DomUtil.create('input', null, container);
  refreshDelay.type = 'number';
  refreshDelay.value = plugin.settings.autoRefreshDelay;
  L.DomEvent.on(refreshDelay, "change", (ev) => {
    plugin.settings.autoRefreshDelay = +refreshDelay.value > 0 ? +refreshDelay.value : 1;
    refreshDelay.value = plugin.settings.autoRefreshDelay;
    storeSettings();
  });

  // sync keys with the keys plugin
  if (window.plugin.keys) {
    const syncLabel = L.DomUtil.create('label', null, container);
    syncLabel.textContent = "Auto-sync with Keys";
    syncLabel.htmlFor = "plugin-player-inventory-autosync-enable"
    const syncCheck = L.DomUtil.create('input', null, container);
    syncCheck.type = 'checkbox';
    syncCheck.checked = plugin.settings.autoSyncKeys;
    syncCheck.id = 'plugin-player-inventory-autosync-enable';
    L.DomEvent.on(syncCheck, "change", (ev) => {
      plugin.settings.autoSyncKeys = syncCheck.checked === 'true' || (syncCheck.checked === 'false' ? false : syncCheck.checked);
      storeSettings();
    });
    const button = L.DomUtil.create("button", null, container);
    button.textContent = "Export to keys plugin";
    L.DomEvent.on(button, 'click', exportToKeys);
  }

  {
    const button = L.DomUtil.create("button", null, container);
    button.textContent = "Export keys to clipboard";
    L.DomEvent.on(button, 'click', exportToClipboard);
  }

  {
    const keysSidebarLabel = L.DomUtil.create('label', null, container);
    keysSidebarLabel.textContent = "Keys in sidebar";
    keysSidebarLabel.htmlFor = "plugin-player-inventory-keys-sidebar-enable"
    const keysSidebarCheck = L.DomUtil.create('input', null, container);
    keysSidebarCheck.type = 'checkbox';
    keysSidebarCheck.checked = plugin.settings.keysSidebarEnable;
    keysSidebarCheck.id = 'plugin-player-inventory-keys-sidebar-enable';
    L.DomEvent.on(keysSidebarCheck, "change", (ev) => {
      plugin.settings.keysSidebarEnable = keysSidebarCheck.checked === 'true' || (keysSidebarCheck.checked === 'false' ? false : keysSidebarCheck.checked);
      storeSettings();
    });
  }

  dialog({
    title: 'Inventory Opt',
    id: 'inventory-opt',
    html: container,
    width: 'auto',
    height: 'auto',
  });
}

function setupCSS() {
  $('<style>').html('@include_string:player-inventory.css@').appendTo('head');
  let colorStyle = "";
  window.COLORS_LVL.forEach((c,i) => {
    colorStyle += `.level_L${i}{ color: ${c} }`;
  });
  rarity.forEach((r,i) => {
    if (window.COLORS_MOD[r])
      colorStyle += `.rarity_${rarityShort[i]} { color: ${window.COLORS_MOD[r]}}`;
  });
  $('<style>').html(colorStyle).appendTo('head');
}

function setupDisplay() {
  plugin.dialog = null;

  if (window.useAndroidPanes()) {
    android.addPane('playerInventory', 'Inventory', 'ic_action_view_as_list');
    addHook('paneChanged', function (pane) {
      if (pane === 'playerInventory') {
        refreshIfOld();
        plugin.pane.style.display = "";
      } else if (plugin.pane) {
        plugin.pane.style.display = "none";
      }
    });
    plugin.pane = L.DomUtil.create('div', 'inventory-box mobile', document.body);
    plugin.pane.id = 'pane-inventory';
    plugin.pane.style.display = "none";

    const refreshButton = L.DomUtil.create('button', null, plugin.pane);
    refreshButton.textContent = 'Refresh';
    L.DomEvent.on(refreshButton, 'click', refreshInventory);

    $('<a>')
      .html('Inventory Opt')
      .attr('title','Inventory options')
      .click(displayOpt)
      .appendTo('#toolbox');
  } else {
    $('<a>')
      .html('Inventory')
      .attr('title','Show inventory')
      .click(() => displayInventory(plugin.inventory))
      .appendTo('#toolbox');
  }
}

// iitc setup
function setup() {
  // Dummy inventory
  plugin.inventory = new Inventory();

  plugin.hasActiveSubscription = false;
  plugin.isHighlighActive = false;

  plugin.lastRefresh = Date.now();
  plugin.autoRefreshTimer = null;

  plugin.settings = {
    autoRefreshActive: false,
    popupEnable: true,
    autoRefreshDelay: 30,
    autoSyncKeys: false,
    keysSidebarEnable: false,
  }

  loadSettings();

  setupCSS();
  setupDisplay();

  plugin.getSubscriptionStatus = getSubscriptionStatus;

  plugin.highlighter = {
    highlight: portalKeyHighlight,
    setSelected: function (selected) {
      plugin.isHighlighActive = selected;
    },
  }
  window.addPortalHighlighter('Inventory keys', plugin.highlighter);

  window.addHook('pluginInventoryRefresh', (data) => {
    if (plugin.settings.autoSyncKeys) {
      exportToKeys();
    }
    if (plugin.dialog) {
      plugin.dialog.html(buildInventoryHTML(data.inventory));
    }
    if (plugin.pane) {
      fillPane(data.inventory);
    }
  })

  window.addHook('mapDataEntityInject', injectKeys);
  window.addHook('portalSelected', (data) => {
    //{selectedPortalGuid: guid, unselectedPortalGuid: oldPortalGuid}
    if (!plugin.settings.popupEnable) return;
    if (data.selectedPortalGuid && data.selectedPortalGuid !== data.unselectedPortalGuid) {
      const total = plugin.inventory.countKey(data.selectedPortalGuid);
      if (total > 0) {
        createPopup(data.selectedPortalGuid);
      }
    }
  });
  window.addHook('portalDetailsUpdated', (data) => {
    //{guid: guid, portal: portal, portalDetails: details, portalData: data}
    if (!plugin.settings.keysSidebarEnable) return;
    const total = plugin.inventory.countKey(data.guid);
    if (total > 0) {
      const key = plugin.inventory.keys.get(data.guid);
      const capsules = Array.from(key.count.keys());
      $("#randdetails")
        .append(`<tr><td>${total}</td><th>Keys</th><th>Capsules</th><td style="white-space: normal">${capsules.join(' ')}</td></tr>`);
    }
  });

  loadFromIndexedDB();
}
