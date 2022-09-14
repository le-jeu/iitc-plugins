// stock intel
export const itemTypes = {
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
  // missing strings from stock intel
  'PORTAL_POWERUP:BB_BATTLE_RARE': 'Rare Battle Beacon',
};

const dontCount = ['DRONE'];

function defaultTypeString(s) {
  if (!(s in itemTypes)) itemTypes[s] = s;
}

export const levelItemTypes = ['EMITTER_A', 'EMP_BURSTER', 'POWER_CUBE', 'ULTRA_STRIKE', 'MEDIA'];

export const rarity = ['VERY_COMMON', 'COMMON', 'LESS_COMMON', 'RARE', 'VERY_RARE', 'EXTREMELY_RARE'];

export type ItemType = keyof typeof itemTypes;
type Level = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type Rarity = 'VERY_COMMON' | 'COMMON' | 'LESS_COMMON' | 'RARE' | 'VERY_RARE' | 'EXTREMELY_RARE';

export type LevelRarity = Level | Rarity;

type CapsuleCount = { [name: string]: number };

interface InventoryItem {
  type: ItemType;
  name: string;
  leveled: boolean;
  counts: { [Property in LevelRarity]?: CapsuleCount };
  total: number;
}

interface InventoryKey {
  guid: string;
  title: string;
  latLng: [number, number];
  address: string;
  count: Map<string, number>;
  total: number;
}

interface InventoryMedia {
  mediaId: string;
  name: string;
  url: string;
  count: Map<string, number>;
  total: number;
}

interface ParsedItem {
  type: ItemType;
  count: number;
  capsule: string;
  level?: Level;
  rarity?: Rarity;
}

interface ParsedKey extends ParsedItem {
  type: 'PORTAL_LINK_KEY';
  guid: string;
  title: string;
  latLng: [number, number];
  address: string;
}

interface ParsedMedia extends ParsedItem {
  type: 'MEDIA';
  mediaId: string;
  name: string;
  url: string;
}

interface ParsedCapsule extends ParsedItem {
  type: 'CAPSULE' | 'KEY_CAPSULE' | 'INTEREST_CAPSULE' | 'KINETIC_CAPSULE';
  name: string;
  size: number;
  content: ParsedItem[];
}

interface InventoryCapsule {
  name: string;
  size: number;
  type: ParsedCapsule['type'];
  keys: { [guid: string]: ParsedKey };
  medias: { [mediaid: string]: ParsedMedia };
  items: {
    [Property in ItemType]?: {
      type: ItemType;
      leveled: boolean;
      count: { [Property in LevelRarity]?: number };
      repr: ParsedItem;
    };
  };
}

export class Inventory {
  name: string;
  keys: Map<string, InventoryKey>;
  medias: Map<string, InventoryMedia>;
  items: { [Property in ItemType]: InventoryItem };
  capsules: { [name: string]: InventoryCapsule };
  count: number;
  keyLockersCount: number;

  constructor(name: string) {
    this.name = name;
    this.keys = new Map(); // guid => {counts: caps => count}
    this.medias = new Map();
    this.clear();
  }

  clearItem(type: ItemType) {
    defaultTypeString(type);
    this.items[type] = {
      type: type,
      name: itemTypes[type],
      leveled: levelItemTypes.includes(type),
      counts: {},
      total: 0,
    };
  }

  clear() {
    this.keys.clear();
    this.medias.clear();
    this.capsules = {};
    this.items = {} as Inventory['items'];
    for (const type in itemTypes) {
      this.clearItem(type as ItemType);
    }
    this.count = 0;
    this.keyLockersCount = 0;
  }

  getItem(type: ItemType) {
    if (!(type in this.items)) this.clearItem(type);
    return this.items[type];
  }

  addCapsule(capsule: ParsedCapsule) {
    const data: InventoryCapsule = {
      name: capsule.name,
      size: capsule.size,
      type: capsule.type,
      keys: {},
      medias: {},
      items: {},
    };
    this.capsules[capsule.name] = data;

    if (capsule.type === 'KEY_CAPSULE') this.keyLockersCount += capsule.size;

    this.addItem(capsule);
    for (const item of capsule.content) {
      this.addItem(item);
      if (item.type === 'PORTAL_LINK_KEY') data.keys[(item as ParsedKey).guid] = item as ParsedKey;
      else if (item.type === 'MEDIA') data.medias[(item as ParsedMedia).mediaId] = item as ParsedMedia;
      else {
        const cat = data.items[item.type] || { repr: item, leveled: levelItemTypes.includes(item.type), count: {}, type: item.type };
        cat.count[item.rarity || (item.level as LevelRarity)] = item.count;
        data.items[item.type] = cat;
      }
    }
  }

  addItem(item: ParsedItem) {
    const cat = this.getItem(item.type);
    const lr = '' + (cat.leveled ? item.level : item.rarity);
    if (!cat.counts[lr]) cat.counts[lr] = {};
    const count = cat.counts[lr];
    if (!item.capsule) item.capsule = this.name;
    if (!item.count) item.count = 1;
    count[item.capsule] = (count[item.capsule] || 0) + item.count;
    count.total = (count.total || 0) + item.count;
    cat.total += item.count;

    if (!dontCount.includes(item.type)) this.count += item.count;

    if (item.type === 'PORTAL_LINK_KEY') {
      this.addKey(item as ParsedKey);
    } else if (item.type === 'MEDIA') {
      this.addMedia(item as ParsedMedia);
    }
  }

  countType(type: ItemType, levelRarity?: LevelRarity) {
    const cat = this.getItem(type);
    if (levelRarity !== undefined) {
      return cat.counts[levelRarity] ? cat.counts[levelRarity].total : 0;
    }
    return cat.total;
  }

  addMedia(media: ParsedMedia) {
    if (!this.medias.has(media.mediaId))
      this.medias.set(media.mediaId, {
        mediaId: media.mediaId,
        name: media.name,
        url: media.url,
        count: new Map(),
        total: 0,
      });
    const current = this.medias.get(media.mediaId) as InventoryMedia;
    const entry = current.count.get(media.capsule) || 0;
    current.count.set(media.capsule, entry + (media.count || 1));
    current.total += media.count || 1;
  }

  countKey(guid: string) {
    if (!this.keys.has(guid)) return 0;
    return (this.keys.get(guid) as InventoryKey).total;
  }

  addKey(key: ParsedKey) {
    if (!this.keys.has(key.guid))
      this.keys.set(key.guid, {
        guid: key.guid,
        title: key.title,
        latLng: key.latLng,
        address: key.address,
        count: new Map(),
        total: 0,
      });
    const current = this.keys.get(key.guid) as InventoryKey;
    const entry = current.count.get(key.capsule) || 0;
    current.count.set(key.capsule, entry + (key.count || 1));
    current.total += key.count || 1;
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
      if (type === 'PORTAL_LINK_KEY') continue;
      const item = this.getItem(type as ItemType);
      for (const k in item.counts) {
        const count = item.counts[k][this.name];
        if (count) {
          if (!data.items[type])
            data.items[type] = {
              type: type,
              leveled: levelItemTypes.includes(type),
              count: {},
            };
          data.items[type].count[k] = count;
          data.size += count;
        }
      }
    }
    return data;
  }
}
