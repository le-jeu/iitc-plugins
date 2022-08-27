const STORE_KEY = 'plugin-player-inventory';
const SETTINGS_KEY = 'plugin-player-inventory-settings';

export function openIndexedDB() {
  const rq = window.indexedDB.open('player-inventory', 1);
  rq.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore('inventory', { autoIncrement: true });
  };
  return rq;
}

/**
 *
 * @returns {Promise<{ date: string, raw: any }} Returns last saved inventory raw data
 */
export function loadLastInventory() {
  return new Promise(loadFromIndexedDB);
}

function loadFromIndexedDB(resolve, reject) {
  if (!window.indexedDB) return loadFromLocalStorage(resolve, reject);
  const rq = openIndexedDB();
  rq.onerror = function () {
    loadFromLocalStorage(resolve, reject);
  };
  rq.onsuccess = function (event) {
    const db = event.target.result;
    const tx = db.transaction(['inventory'], 'readonly');
    const store = tx.objectStore('inventory');
    const rq = store.getAll();
    rq.onsuccess = function (event) {
      const r = event.target.result;
      if (r.length > 0) {
        const data = r[r.length - 1];
        resolve(data);
      } else {
        loadFromLocalStorage(resolve, reject);
      }
    };
    rq.onerror = function () {
      loadFromLocalStorage(resolve, reject);
    };
    db.close();
  };
}

function loadFromLocalStorage(resolve, reject) {
  const store = localStorage[STORE_KEY];
  if (store) {
    try {
      const data = JSON.parse(store);
      resolve(data);
    } catch (e) {
      console.log(e);
    }
  }
  reject('no inventory found');
}

export function saveInventory(data) {
  return storeToIndexedDB(data);
}

function storeToIndexedDB(data) {
  if (!window.indexedDB) return storeToLocalStorage(data);
  const rq = openIndexedDB();
  rq.onerror = function () {
    storeToLocalStorage(data);
  };
  rq.onsuccess = function (event) {
    const db = event.target.result;
    const tx = db.transaction(['inventory'], 'readwrite');
    const store = tx.objectStore('inventory');
    store.clear().onsuccess = function () {
      store.add({
        raw: data,
        date: Date.now(),
      });
    };
    tx.oncomplete = function () {
      delete localStorage[STORE_KEY];
    };
    tx.onerror = function () {
      storeToLocalStorage(data);
    };
    db.close();
  };
}

function storeToLocalStorage(data) {
  const store = {
    raw: data,
    date: Date.now(),
  };
  localStorage[STORE_KEY] = JSON.stringify(store);
}

export function loadSettings() {
  const settings = localStorage[SETTINGS_KEY];
  if (settings) {
    try {
      const data = JSON.parse(settings);
      return data;
    } catch (e) {
      console.log(e);
    }
  }
  return {};
}

export function storeSettings(settings) {
  localStorage[SETTINGS_KEY] = JSON.stringify(settings);
}
