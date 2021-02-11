// @author         jaiperdu
// @name           Player Inventory
// @category       Info
// @version        0.1.1
// @description    View inventory (atm keys only)

// stock intel
const itemTypes = {
  BOOSTED_POWER_CUBE: 'Hypercube',
  BOOSTED_POWER_CUBE_K: 'Hypercube',
  CAPSULE: 'Capsule',
  DRONE: 'Drone',
  EMITTER_A: 'Resonator',
  EMP_BURSTER: 'Xmp Burster',
  EXTRA_SHIELD: 'Aegis Shield',
  FLIP_CARD: 'Alignment Virus',
  'FLIP_CARD:ADA': 'ADA Refactor',
  'FLIP_CARD:JARVIS': 'JARVIS Virus',
  FORCE_AMP: 'Force Amp',
  HEATSINK: 'Heat Sink',
  INTEREST_CAPSULE: 'Quantum Capsule',
  KEY_CAPSULE: 'Key Capsule',
  KINETIC_CAPSULE: 'Kinetic Capsule',
  LINK_AMPLIFIER: 'Link Amp',
  MEDIA: 'Media',
  MULTIHACK: 'Multi-hack',
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
  PORTAL_LINK_KEY: 'Portal Key',
  POWER_CUBE: 'Power Cube',
  RES_SHIELD: 'Portal Shield',
  TRANSMUTER_ATTACK: 'Ito En Transmuter (-)',
  TRANSMUTER_DEFENSE: 'Ito En Transmuter (+)',
  TURRET: 'Turret',
  ULTRA_STRIKE: 'Ultra Strike',
  ULTRA_LINK_AMP: 'Ultra Link'
};

const levelItemTypes = [
	"EMITTER_A",
	"EMP_BURSTER",
	"POWER_CUBE",
	"ULTRA_STRIKE",
	"MEDIA",
];

const rarityToInt = {
	VERY_COMMON: 0,
  COMMON: 1,
  LESS_COMMON: 2,
  RARE: 3,
  VERY_RARE: 4,
  EXTREMELY_RARE: 5,
}

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
		count[item.capsule] = (count[item.capsule] || 0) + item.count

		if (item.type === "PORTAL_LINK_KEY") {
			this.addKey(item);
		} else if (item.type === "MEDIA") {
			this.addMedia(item);
		}
	}

	addMedia(media) {
		//XXX
	}

	addKey(key) {
		if (!this.keys.has(key.portalGuid))
			this.keys.set(key.portalGuid, {
				guid: key.portalGuid,
				title: key.portalTitle,
				latLng: key.latLng,
				count: new Map(),
			});
		const current = this.keys.get(key.portalGuid);
		const entry = current.count.get(key.capsule) || 0;
		current.count.set(key.capsule, entry + key.count);
	}
}

const isKey = function (obj) {
	return obj.resource && obj.resource.resourceType == "PORTAL_LINK_KEY";
}

const parsePortalLocation = function (location) {
	return [lat, lng] = location.split(',').map(a => (Number.parseInt(a,16)&(-1))*1e-6);
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
const parsePortalKey = function (key) {
	const data = {
		type: "PORTAL_LINK_KEY",
		portalGuid: key.portalCoupler.portalGuid,
		portalTitle: key.portalCoupler.portalTitle,
		latLng: parsePortalLocation(key.portalCoupler.portalLocation),
		rarity: key.resource.resourceRarity,
		count: 1,
	};
	return data;
}

// {
// 	"resourceWithLevels": {
// 		"resourceType": "EMITTER_A",
// 		"level": 7
// 	}
// }
const parseLevelItem = function (item) {
	return {
		type: item.resourceWithLevels.resourceType,
		level: item.resourceWithLevels.level,
		count: 1,
	}
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
		count: 1,
	}
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
const parseFlipCard = function (flipcard) {
	return {
		type: flipcard.resource.resourceType + ':' + flipcard.flipCard.flipCardType,
		count: 1,
		rarity: flipcard.resource.resourceRarity,
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
const parseMedia = function (media) {
	return {
		type: media.resourceWithLevels.resourceType,
		mediaId: media.storyItem.mediaId,
		name: media.storyItem.shortDescription,
		level: media.resourceWithLevels.level
	}
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
const parsePlayerPowerUp = function (powerup) {
	return {
		type: powerup.resource.resourceType + ':' + powerup.playerPowerupResource.playerPowerupEnum,
		rarity: powerup.resource.resourceRarity,
	}
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
const parsePortalPowerUp = function (powerup) {
	return {
		type: powerup.resource.resourceType + ':' + powerup.timedPowerupResource.designation,
		rarity: powerup.resource.resourceRarity,
	}
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
const parseContainer = function (container) {
	const containerName = container.moniker.differentiator;
	const data = {
		type: container.resource.resourceType,
		name: containerName,
		content: [],
		rarity: container.resource.resourceRarity,
	};
	for (const stackableItem of container.container.stackableItems) {
		const item = parseItem(stackableItem.exampleGameEntity);
		if (item) {
			item.count *= stackableItem.itemGuids.length;
			item.capsule = data.containerName;
			data.content.push(item);
		}
	}
	return data;
};
/*
[
	guid, timestamp?, item object
]
*/
const parseItem = function (item) {
	const [id, ts, obj] = item;
	if (obj.storyItem)
		return parseMedia(obj);
	if (obj.resourceWithLevels)
		return parseLevelItem(obj);
	if (obj.modResource)
		return parseMod(obj);
	if (obj.flipCard)
		return parseFlipCard(obj);
	if (obj.container)
		return parseContainer(obj);
	if (isKey(obj))
		return parsePortalKey(obj);
	if (obj.timedPowerupResource)
		return parsePortalPowerUp(obj);
	if (obj.playerPowerupResource)
		return parsePlayerPowerUp(obj);
	if (obj.resource)
		return {
			type: obj.resource.resourceType,
			rarity: obj.resource.resourceRarity,
			count: 1
		}
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

const displayInventory = function (inventory) {

}

const plugin = {};

// for local testing
if (window && window.plugin) window.plugin.playerInventory = plugin;

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
		const marker = L.marker(key.latLng, {
			title: key.title,
		});
		window.registerMarkerForOMS(marker);
		marker.on('spiderfiedclick', function() {
			marker.openPopup();
			renderPortalDetails(guid);
		});

		const count = Array.from(key.count).map(([name, count]) => `<strong>${name}</strong>: ${count}`).join('<br/>');
		marker.bindPopup(count);
		marker.addTo(plugin.layer);
	}
}

var setup = function () {
	plugin.hasActiveSubscription = false;

	plugin.inventory = new Inventory();
	plugin.layer = new L.LayerGroup();

	window.addLayerGroup('Inventory Keys', plugin.layer, true);

	plugin.updateLayer = updateLayer;
	plugin.parseInventory = parseInventory;

  window.addHook('mapDataEntityInject', injectKeys);
	setTimeout(getSubscriptionStatus, 10000);
};
