// @author         jaiperdu
// @name           Wasabee Key Sync
// @category       Misc
// @version        0.1.8
// @description    Sync keys from CORE with Wasabee OP/D

const wkeys = {};

function getSelectedOp() {
  const Wasabee = window.plugin.wasabee;
  if (Wasabee && Wasabee._selectedOp) return Wasabee._selectedOp;
  return null;
}

function getToken() {
  return localStorage["wasabee-jwt"];
}

function pushKey(server, opID, portalID, onhand, capsule) {
  const fd = new FormData();
  fd.append("count", onhand);
  fd.append("capsule", capsule);
  return fetch(`${server}/api/v1/draw/${opID}/portal/${portalID}/keyonhand`, {
    method: "POST",
    mode: "cors",
    cache: "default",
    credentials: "omit",
    redirect: "manual",
    referrerPolicy: "origin",
    headers: {
      Authorization: "Bearer " + getToken(),
    },
    body: fd,
  });
}

function pushDKeys(server, dks) {
  const j = JSON.stringify(dks);
  return fetch(`${server}/api/v1/d/bulk`, {
    method: "POST",
    mode: "cors",
    cache: "default",
    credentials: "omit",
    redirect: "manual",
    referrerPolicy: "origin",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      Authorization: "Bearer " + getToken(),
    },
    body: j,
  });
}

function parsePortalLocation(location) {
  return ([lat, lng] = location.split(",").map((a) => (Number.parseInt(a, 16) & -1) * 1e-6));
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

function parseContainer(container) {
  const name = container.moniker.differentiator;
  const items = [];
  for (const stackableItem of container.container.stackableItems) {
    const item = parseItem(stackableItem.exampleGameEntity);
    if (item) {
      item.count = stackableItem.itemGuids.length;
      item.capsule = name;
      items.push(item);
    }
  }
  return items;
}

function parseResource(obj) {
  const data = {
    type: obj.resource.resourceType,
    rarity: obj.resource.resourceRarity,
    capsule: "",
    count: 1,
  };
  if (obj.container) return parseContainer(obj);
  if (obj.portalCoupler) return parsePortalKey(data, obj);
}
/*
[
  guid, timestamp?, item object
]
*/
function parseItem(item) {
  const [id, ts, obj] = item;
  if (obj.resource) return parseResource(obj);
}

function parseInventory(data) {
  const keys = [];
  const toStack = {};
  for (const entry of data) {
    const item = parseItem(entry);
    if (item) {
      if (!(item instanceof Array)) {
        // flat keys
        if (item.guid in toStack) toStack[item.guid].count += item.count; // +1
        else {
          toStack[item.guid] = item;
          keys.push(item);
        }
      } else for (const key of item) keys.push(key);
    }
  }
  return keys;
}

// again...
function getPortalLink(key) {
  const a = L.DomUtil.create("a");
  a.textContent = key.title;
  a.title = key.address;
  a.href = window.makePermalink(key.latLng);
  L.DomEvent.on(a, "click", function (event) {
    window.renderPortalDetails(key.guid);
    window.selectPortalByLatLng(key.latLng);
    event.preventDefault();
    return false;
  });
  L.DomEvent.on(a, "dblclick", function (event) {
    window.renderPortalDetails(key.guid);
    window.zoomToAndShowPortal(key.guid, key.latLng);
    event.preventDefault();
    return false;
  });
  return a;
}

function localeCompare(a, b) {
  if (typeof a !== "string") a = "";
  if (typeof b !== "string") b = "";
  return a.localeCompare(b);
}

function handleInventory(data) {
  if (data.result.length > 0) {
    wkeys.keys = parseInventory(data.result);
    displayKeys();
  } else {
    alert("Inventory empty, probably hitting rate limit, try again later");
  }
}

function getInventory() {
  window.postAjax("getInventory", { lastQueryTimestamp: 0 }, handleInventory, handleError);
}

function handleSubscription(data) {
  plugin.hasActiveSubscription = data.result;
  if (data.result) getInventory();
  else alert("You need to subscribe to CORE.");
}

function handleError(e) {
  alert(e);
}

function getSubscriptionStatus() {
  window.postAjax('getHasActiveSubscription', {}, handleSubscription, handleError);
}

// sort table

class liteSortTable {
  constructor(fields, key) {
    this.fields = fields;
    this.sortBy = 0;
    this.sortAsc = true;
    this.key = key;
    this.data = [];

    this.table = L.DomUtil.create("table", "wasabee-table");
    const thead = this.table.createTHead();
    this.tbody = this.table.createTBody();
    const row = thead.insertRow();
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      const th = L.DomUtil.create("th", "", row);
      if (field.html) field.html.call(this, th);
      else th.textContent = field.name;
      if (field.sort !== false) {
        L.DomEvent.on(th, "click", () => {
          if (this.sortBy == i) this.sortAsc = !this.sortAsc;
          else {
            this.sortAsc = true;
            this.sortBy = i;
          }
          this.sort();
        });
      }
    }
  }

  setItems(items) {
    this.data = [];
    for (const item of items) {
      const d = {
        row: [],
        data: item,
        key: this.key(item),
      };
      for (const field of this.fields) d.row.push(field.value(item));
      this.data.push(d);
    }
    this.sortData();

    const rows = {};
    for (const row of this.tbody.querySelectorAll(`tr[data-key]`)) rows[row.dataset.key] = row;

    for (const d of this.data) {
      const row = rows[d.key] || this.tbody.insertRow();
      row.dataset.key = d.key;
      delete rows[d.key];
      for (let i = 0; i < this.fields.length; i++) {
        const value = d.row[i];
        const isNew = !row.cells[i];
        const cell = row.cells[i] || row.insertCell();
        if (isNew && this.fields[i].onclick) {
          L.DomEvent.on(cell, "click", this.fields[i].onclick.bind(this));
        }
        if (this.fields[i].formatValue) {
          cell.textContent = "";
          this.fields[i].formatValue.call(this, cell, d.data, value);
        } else cell.textContent = value;
      }
      this.tbody.appendChild(row);
    }

    for (const key in rows) rows[key].remove();

    return this;
  }

  sortData() {
    if (this.fields[this.sortBy].sort) this.data.sort((a, b) => this.fields[this.sortBy].sort(a.data, b.data));
    else this.data.sort((a, b) => a.row[this.sortBy] > b.row[this.sortBy]);
    if (!this.sortAsc) this.data.reverse();
    return this;
  }

  sort() {
    this.sortData();
    const rows = {};
    for (const row of this.tbody.querySelectorAll(`tr[data-key]`)) rows[row.dataset.key] = row;
    for (const d of this.data) {
      const row = rows[d.key];
      if (row) this.tbody.appendChild(row);
    }
    return this;
  }
}

function portalCapsID(key) {
  return key.guid + key.capsule;
}

const keyTable = [
  {
    html: function (c) {
      const checkbox = L.DomUtil.create("input", "", c);
      checkbox.type = "checkbox";
      L.DomEvent.on(checkbox, "change", (ev) => {
        selectAllKeys(ev.target.checked);
        this.setItems(wkeys.keys);
      });
    },
    value: (k) => wkeys.selected.has(portalCapsID(k)),
    formatValue: (c, k, v) => {
      const checkbox = L.DomUtil.create("input", "", c);
      checkbox.type = "checkbox";
      checkbox.checked = v;

      L.DomEvent.on(checkbox, "change", (ev) => {
        if (ev.target.checked) wkeys.selected.add(portalCapsID(k));
        else wkeys.selected.delete(portalCapsID(k));
      });
    },
    sort: false,
  },
  {
    name: "Name",
    value: (k) => k.title,
    sort: (a, b) => localeCompare(a.title, b.title),
    formatValue: (c, k, v) => {
      c.appendChild(getPortalLink(k));
    },
  },
  {
    name: "#",
    value: (k) => k.count,
    sort: (a, b) => a.count - b.count,
  },
  {
    name: "Capsule",
    value: (k) => k.capsule,
    onclick: function (ev) {
      const v = ev.target.textContent;
      selectCapsule(v, !ev.getModifierState("Shift"));
      this.setItems(wkeys.keys);
    },
  },
];

function selectCapsule(caps, only) {
  if (only) wkeys.selected.clear();
  for (const k of wkeys.keys) {
    if (k.capsule === caps) wkeys.selected.add(portalCapsID(k));
  }
}

function selectAllKeys(select) {
  if (!select) wkeys.selected.clear();
  else {
    for (const k of wkeys.keys) wkeys.selected.add(portalCapsID(k));
  }
}

function selectOpPortals() {
  const sop = getSelectedOp();
  wkeys.selected.clear();
  for (const k of wkeys.keys) {
    if (sop.containsMarkerByID(k.guid, "GetKeyPortalMarker") || sop.anchors.includes(k.guid)) wkeys.selected.add(portalCapsID(k));
  }
}

function namesToCapID(names) {
  if (names.length == 0)
    // o_O
    return "";
  if (names.length == 1) return names[0];
  names = names.map((v) => (v === "" ? "Inv" : v));
  if (names.length > 8) return "*multi*";
  let size = Math.floor(16 + 1 - names.length) / names.length;
  return names.map((v) => v.slice(0, size)).join(",");
}

function syncOpKeys() {
  const op = getSelectedOp();
  if (!op.isServerOp() || !op.isOnCurrentServer()) {
    alert("You need to select an OP that is on the current server.");
    return;
  }
  const me = JSON.parse(localStorage["wasabee-me"]);
  const gid = me.GoogleID || me.id; // .id for >0.21
  const map = {};
  for (const k of wkeys.keys) {
    if (wkeys.selected.has(portalCapsID(k))) {
      if (!(k.guid in map)) map[k.guid] = { total: 0, names: [] };
      map[k.guid].total += k.count;
      map[k.guid].names.push(k.capsule);
    }
  }
  for (const guid in map) {
    pushKey(op.server, op.ID, guid, map[guid].total, namesToCapID(map[guid].names)).then(() =>
      op.keyOnHand(guid, gid, map[guid].total, namesToCapID(map[guid].names))
    );
  }
}

function syncDKeys() {
  const me = localStorage["wasabee-me"];
  if (!me) {
    alert("You are not connected...");
    return;
  }
  const map = {};
  for (const k of wkeys.keys) {
    if (wkeys.selected.has(portalCapsID(k))) {
      if (!(k.guid in map)) map[k.guid] = L.extend({ total: 0, names: [] }, k);
      map[k.guid].total += k.count;
      map[k.guid].names.push(k.capsule);
    }
  }
  pushDKeys(
    localStorage[window.plugin.wasabee.static.constants.SERVER_BASE_KEY],
    Object.values(map).map((k) => ({
      PortalID: k.guid,
      Count: k.total,
      CapID: namesToCapID(k.names),
      Name: k.title,
      Lat: k.latLng[0].toFixed(6),
      Lng: k.latLng[1].toFixed(6),
    }))
  )
    .then(() => window.map.fire("wasabee:defensivekeys"))
    .catch((e) => alert("Something went wrong: " + e.toString()));
}

function displayKeys() {
  const table = new liteSortTable(keyTable, portalCapsID);
  table.sortBy = 1;
  table.setItems(wkeys.keys);

  const container = table.table;

  window.dialog({
    title: "Sync Wasabee Keys",
    id: "sync-wasabee-keys",
    html: container,
    width: "auto",
    height: "500",
    // classes: {
    //   'ui-dialog-content': 'sync-wasabee-keys-box',
    // },
    buttons: {
      Refresh: getSubscriptionStatus,
      "Select OP portals only": () => {
        selectOpPortals();
        table.setItems(wkeys.keys);
      },
      "Sync to OP Keys": syncOpKeys,
      "Sync to D-Keys": syncDKeys,
    },
  });
}

function setup() {
  window.plugin.wasabeeKeys = wkeys;
  wkeys.keys = [];
  wkeys.selected = new Set();
  $("<a>").html("WKeys Sync").attr("title", "Sync Wasabee Keys").click(displayKeys).appendTo("#toolbox");
}
