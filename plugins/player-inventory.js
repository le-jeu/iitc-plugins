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

const parsePortalLocation = function (location) {
	return [lat, lng] = location.split(',').map(a => (Number.parseInt(a,16)&(-1))*1e-6);
}

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

const parseItem = function (item) {
	const [id, ts, obj] = item;
	if (obj.container)
		return parseContainer(obj);
	if (isKey(obj))
		return parsePortalKey(obj);
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
