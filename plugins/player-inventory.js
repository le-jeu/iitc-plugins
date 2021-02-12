// @author         jaiperdu
// @name           Player Inventory
// @category       Info
// @version        0.2.4
// @description    View inventory

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
    this.clear();
  }

  clear() {
    this.keys.clear();
    this.capsules = {}
    this.items = {};
    for (const type in itemTypes) {
      this.items[type] = {
        type: type,
        name: itemTypes[type],
        counts: [{},{},{},{},{},{}],
      }
      if (levelItemTypes.includes(type))
        this.items[type].counts = [{},{},{},{},{},{},{},{}];
    }
  }

  addCapsule(capsule) {
    this.capsules[capsule.name] = capsule;
    this.addItem(capsule);
    for (const item of capsule.content) {
        this.addItem(item);
    }
  }

  addItem(item) {
    const cat = this.items[item.type];
    const count =
      (levelItemTypes.includes(item.type))
      ? cat.counts[item.level-1]
      : cat.counts[rarityToInt[item.rarity]];
    if (!item.capsule) item.capsule = this.name;
    if (!item.count) item.count = 1;
    count[item.capsule] = (count[item.capsule] || 0) + item.count;

    if (item.type === "PORTAL_LINK_KEY") {
      this.addKey(item);
    } else if (item.type === "MEDIA") {
      this.addMedia(item);
    }
  }

  countType(type, levelRarity) {
    const counts = this.items[type].counts;
    if (levelRarity !== undefined) {
      const count = counts[levelRarity];
      let total = 0;
      for (const capsule in count) total += count[capsule];
      return total;
    }
    let total = 0;
    for (const count of counts) {
      for (const capsule in count) total += count[capsule];
    }
    return total;
  }

  addMedia(media) {
    //XXX
  }

  countKey(guid) {
    if (!this.keys.has(guid)) return 0;
    const count = this.keys.get(guid).count;
    let total = 0;
    for (const v of count.values()) total += v;
    return total;
  }

  addKey(key) {
    if (!this.keys.has(key.guid))
      this.keys.set(key.guid, {
        guid: key.guid,
        title: key.title,
        latLng: key.latLng,
        count: new Map(),
      });
    const current = this.keys.get(key.guid);
    const entry = current.count.get(key.capsule) || 0;
    current.count.set(key.capsule, entry + (key.count || 1));
  }
}

const parsePortalLocation = function (location) {
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
const parseMod = function (mod) {
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
const parseMedia = function (data, media) {
  data.mediaId = media.storyItem.mediaId;
  data.name = media.storyItem.shortDescription;
  return data;
}

// {
//   "resourceWithLevels": {
//     "resourceType": "EMITTER_A",
//     "level": 7
//   }
// }
const parseLevelItem = function (obj) {
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
const parsePortalKey = function (data, key) {
  data.guid = key.portalCoupler.portalGuid;
  data.title = key.portalCoupler.portalTitle;
  data.latLng = parsePortalLocation(key.portalCoupler.portalLocation);
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
const parseFlipCard = function (data, flipcard) {
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
const parsePlayerPowerUp = function (data, powerup) {
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
const parsePortalPowerUp = function (data, powerup) {
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
const parseContainer = function (data, container) {
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
};

const parseResource = function (obj) {
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
const parseItem = function (item) {
  const [id, ts, obj] = item;
  if (obj.resource)
    return parseResource(obj);
  if (obj.resourceWithLevels)
    return parseLevelItem(obj);
  if (obj.modResource)
    return parseMod(obj);
  // xxx: other types
};

const parseInventory = function (name, data) {
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
};

const plugin = {};
window.plugin.playerInventory = plugin;

// again...
const getPortalLink = function(key) {
  const a = L.DomUtil.create('a', 'text-overflow-ellipsis');
  a.textContent = key.title;
  a.href = window.makePermalink(key.latLng);
  L.DomEvent.on(a, 'click', function(event) {
      window.selectPortalByLatLng(key.latLng);
      event.preventDefault();
      return false;
  })
  L.DomEvent.on(a, 'dblclick', function(event) {
      map.setView(key.latLng, DEFAULT_ZOOM);
      window.selectPortalByLatLng(key.latLng);
      event.preventDefault();
      return false;
  });
  return a;
}

const handleInventory = function (data) {
  plugin.inventory = parseInventory("⌂", data.result);
  plugin.updateLayer();
}

const handleError = function () {};

const getInventory = function () {
  window.postAjax('getInventory', {lastQueryTimestamp:0}, handleInventory, handleError);
};

const handleSubscription = function (data) {
  plugin.hasActiveSubscription = data.result;
  if (data.result) getInventory();
}

const getSubscriptionStatus = function () {
  window.postAjax('getHasActiveSubscription', {}, handleSubscription, handleError);
};

const injectKeys = function(data) {
  const bounds = window.map.getBounds();
  const entities = [];
  for (const [guid, key] of plugin.inventory.keys) {
    if (bounds.contains(key.latLng) && !window.portals[guid]) {
      const ent = [
        guid,
        0,
        ['p', null, Math.round(key.latLng[0]*1e6), Math.round(key.latLng[1]*1e6)]
      ];
      entities.push(ent);
    }
  }
  data.callback(entities);
}

const updateLayer = function () {
  plugin.layer.clearLayers();

  for (const [guid, key] of plugin.inventory.keys) {
    const marker = L.circleMarker(key.latLng, {
      color: "red",
      radius: 3,
    });
    marker.on('click', function() {
      marker.openPopup();
      renderPortalDetails(guid);
    });

    const count = Array.from(key.count).map(([name, count]) => `<strong>${name}</strong>: ${count}`).join('<br/>');
    marker.bindPopup(count);
    marker.addTo(plugin.layer);
  }
}


const createAllTable = function (inventory) {
  const table = L.DomUtil.create("table");
  for (const type in inventory.items) {
    const total = inventory.countType(type);
    if (total == 0)
      continue;
    const item = inventory.items[type];
    const leveled = levelItemTypes.includes(type);
    for (const i in item.counts) {
      const num = inventory.countType(type, i);
      if (num > 0) {
        const lr = (leveled) ? "L" + (+i+1) : rarityShort[i];
        const row = L.DomUtil.create('tr', ((leveled) ? "level_" : "rarity_") + lr, table);
        row.innerHTML = `<td>${item.name}</td><td>${lr}</td><td>${num}</td>`;
      }
    }
  }
  return table;
}

const createAllSumTable = function (inventory) {
  const table = L.DomUtil.create("table");
  for (const type in inventory.items) {
    const total = inventory.countType(type);
    if (total == 0)
      continue;
    const item = inventory.items[type];
    const leveled = levelItemTypes.includes(type);

    const row = L.DomUtil.create('tr', null, table);

    const nums = item.counts
      .map((_,i) => inventory.countType(type, i))
      .map((num,i) => {
        const lr = (leveled) ? "L" + (+i+1) : rarityShort[i];
        const className = (leveled ? "level_" : "rarity_") + lr;
        return [num, `<span class="${className}">${num} ${lr}</span>`];
      })
      .filter(t => t[0] > 0)
      .map(t => t[1])
      .join(', ');

    row.innerHTML = `<td>${item.name}</td><td>${total}</td><td>${nums}</td>`;
  }
  return table;
}

const createKeysTable = function (inventory) {
  const table = L.DomUtil.create("table");
  const keys = [...inventory.keys.values()].sort((a,b) => a.title.localeCompare(b.title));
  for (const key of keys) {
    const a = getPortalLink(key);
    const total = inventory.countKey(key.guid);
    const counts = Array.from(key.count).map(([name, count]) => `${name}: ${count}`).join(', ');

    const row = L.DomUtil.create('tr', null, table);
    L.DomUtil.create('td', null, row).appendChild(a);
    L.DomUtil.create('td', null, row).textContent = total;
    L.DomUtil.create('td', null, row).textContent = counts;
  }
  return table;
}

const createCapsuleTable = function (inventory, capsule) {
  const table = L.DomUtil.create("table");
  for (const item of capsule.content) {
    if (item.type !== "PORTAL_LINK_KEY")
      continue;
    const a = getPortalLink(item);
    const total = item.count;

    const row = L.DomUtil.create('tr', null, table);
    L.DomUtil.create('td', null, row).appendChild(a);
    L.DomUtil.create('td', null, row).textContent = total;
    L.DomUtil.create('td', null, row);
  }
  for (const item of capsule.content) {
    if (item.type === "PORTAL_LINK_KEY")
      continue;
    const name = itemTypes[item.type];
    const leveled = levelItemTypes.includes(item.type);
    const lr = (leveled) ? "L" + (item.level) : rarityShort[rarityToInt[item.rarity]];
    const row = L.DomUtil.create('tr', ((leveled) ? "level_" : "rarity_") + lr, table);
    row.innerHTML = `<td>${name}</td><td>${lr}</td><td>${item.count}</td>`;
  }
  return table;
}

const displayInventory = function (inventory) {
  const container = L.DomUtil.create("div", "container");

  const sumHeader = L.DomUtil.create("b", null, container);
  sumHeader.textContent = "Summary";
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

  for (const name in inventory.capsules) {
    const capsule = inventory.capsules[name];
    if (capsule.size > 0) {
      L.DomUtil.create("b", null, container).textContent = `${name} (${capsule.size})`;
      L.DomUtil.create("div", "capsule", container).appendChild(createCapsuleTable(inventory, capsule));
    }
  }

  $(container).accordion({
      header: 'b',
      heightStyle: 'fill'
  });

  dialog({
    title: 'Inventory',
    id: 'inventory',
    html: container,
    width: 'auto',
    height: 500,
  });
}

var setup = function () {
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

  plugin.hasActiveSubscription = false;

  plugin.inventory = new Inventory();
  plugin.layer = new L.LayerGroup();

  window.addHook('mapDataRefreshEnd', updateLayer);

  window.addLayerGroup('Inventory Keys', plugin.layer, true);

  window.addHook('portalDetailsUpdated', (data) => {
    //{guid: guid, portal: portal, portalDetails: details, portalData: data}
    const total = plugin.inventory.countKey(data.guid);
    if (total > 0) {
      const count = plugin.inventory.keys.get(data.guid).count;
      const text = Array.from(count).map(([name, count]) => `<strong>${name}</strong>: ${count}`).join('<br/>');

      window.portals[data.guid].bindPopup(text).openPopup();
    }
  });

  plugin.updateLayer = updateLayer;
  plugin.parseInventory = parseInventory;
  plugin.displayInventory = displayInventory;

  //window.addHook('mapDataEntityInject', injectKeys);
  window.addHook('iitcLoaded', getSubscriptionStatus);

  $('<a>')
        .html('Inventory')
        .attr('title','Show inventory')
        .click(() => displayInventory(plugin.inventory))
        .appendTo('#toolbox');
};
