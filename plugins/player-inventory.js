// @author         jaiperdu
// @name           Player Inventory
// @category       Info
// @version        0.1.1
// @description    View inventory (atm keys only)

class Inventory {
	constructor(name) {
		this.name = name;
		this.keys = new Map(); // guid => {counts: caps => count}
		this.items = [];
	}

	clear() {
		this.keys.clear();
		this.items = [];
	}

	addItem(item) {
		if (!item.capsule) item.capsule = this.name;
		this.items.push(item);
		if (item.type.includes("CAPSULE")) {
			for (const entry of item.content.items) {
				this.addItem(entry);
			}
		} else if (item.type === "PORTAL_LINK_KEY") {
			this.addKey(item);
		}
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

const is

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
		type: flipcard.resource.resourceType,
		name: flipcard.flipCard.flipCardType,
		count: 1,
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
		content: new Inventory(containerName),
	};
	for (const stackableItem of container.container.stackableItems) {
		const item = parseItem(stackableItem.exampleGameEntity);
		if (item) {
			item.count *= stackableItem.itemGuids.length;
			data.content.addItem(item);
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
	if (obj.storyItem)
		return parseMedia(obj);
	if (obj.resource)
		return {
			type: obj.resource.resourceType,
			count: 1
		}
	// xxx: other types
};

const parseInventory = function (name, data) {
	const inventory = new Inventory(name);
	for (const entry of data) {
		const item = parseItem(entry);
		if (item)
			inventory.addItem(item);
	}
	return inventory;
};

const plugin = window.plugin.playerInventory = {};

const handleInventory = function (data) {
	plugin.inventory = parseInventory("☺", data.result);
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
