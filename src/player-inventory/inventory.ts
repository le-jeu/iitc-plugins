import { getItemName } from './extract';
import { addIfMissing } from './itemTypeOrder';

const dontCount = ['DRONE'];

export const levelItemTypes = ['EMITTER_A', 'EMP_BURSTER', 'POWER_CUBE', 'ULTRA_STRIKE', 'MEDIA'];

export const rarity = ['VERY_COMMON', 'COMMON', 'LESS_COMMON', 'RARE', 'VERY_RARE', 'EXTREMELY_RARE'];

export type ItemType =
  | 'PORTAL_LINK_KEY'
  | 'EMITTER_A'
  | 'EMP_BURSTER'
  | 'ULTRA_STRIKE'
  | 'FLIP_CARD'
  | 'FLIP_CARD:ADA'
  | 'FLIP_CARD:JARVIS'
  | 'POWER_CUBE'
  | 'BOOSTED_POWER_CUBE'
  | 'BOOSTED_POWER_CUBE_K'
  | 'RES_SHIELD'
  | 'EXTRA_SHIELD'
  | 'TURRET'
  | 'FORCE_AMP'
  | 'LINK_AMPLIFIER'
  | 'ULTRA_LINK_AMP'
  | 'HEATSINK'
  | 'MULTIHACK'
  | 'TRANSMUTER_ATTACK'
  | 'TRANSMUTER_DEFENSE'
  | 'MEDIA'
  | 'CAPSULE'
  | 'INTEREST_CAPSULE'
  | 'KEY_CAPSULE'
  | 'KINETIC_CAPSULE'
  | 'DRONE'
  | 'MYSTERIOUS_ITEM_PLACEHOLDER'
  | 'PLAYER_POWERUP'
  | 'PLAYER_POWERUP:APEX'
  | 'PORTAL_POWERUP'
  | 'PORTAL_POWERUP:FRACK'
  | 'PORTAL_POWERUP:NEMESIS'
  | 'PORTAL_POWERUP:TOASTY'
  | 'PORTAL_POWERUP:EXO5'
  | 'PORTAL_POWERUP:MAGNUSRE'
  | 'PORTAL_POWERUP:VIANOIR'
  | 'PORTAL_POWERUP:VIALUX'
  | 'PORTAL_POWERUP:INITIO'
  | 'PORTAL_POWERUP:AEGISNOVA'
  | 'PORTAL_POWERUP:OBSIDIAN'
  | 'PORTAL_POWERUP:NIA'
  | 'PORTAL_POWERUP:ENL'
  | 'PORTAL_POWERUP:RES'
  | 'PORTAL_POWERUP:MEET'
  | 'PORTAL_POWERUP:LOOK'
  | 'PORTAL_POWERUP:BB_BATTLE'
  | 'PORTAL_POWERUP:BB_BATTLE_RARE'
  | 'PORTAL_POWERUP:FW_ENL'
  | 'PORTAL_POWERUP:FW_RES'
  | 'PORTAL_POWERUP:BN_BLM';
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

export interface InventoryKey {
  guid: string;
  title: string;
  latLng: [number, number];
  address: string;
  count: Map<string, number>;
  total: number;
}

export interface InventoryMedia {
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

export interface InventoryCapsule {
  name: string;
  size: number;
  type?: ParsedCapsule['type'];
  keys: { [guid: string]: ParsedKey };
  medias: { [mediaid: string]: ParsedMedia };
  items: {
    [Property in ItemType]?: {
      type: ItemType;
      leveled: boolean;
      count: { [Property in LevelRarity]?: number };
      repr?: ParsedItem;
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
    addIfMissing(type);
    this.items[type] = {
      type: type,
      name: getItemName(type),
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
    const data: InventoryCapsule = {
      name: this.name,
      size: 0,
      keys: {},
      medias: {},
      items: {},
    };

    for (const key of this.keys.values()) {
      const count = key.count.get(this.name);
      if (count) {
        // @ts-ignore: type/capsule missing
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

    for (const type in this.items) {
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
