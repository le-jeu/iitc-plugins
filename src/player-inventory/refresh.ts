import playerInventory from './plugin';

import { saveInventory } from './storage';
import { parseInventory } from './parser';
import { requestInventory } from './request';

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

export function refreshInventory(auto) {
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

export function refreshIfOld() {
  const delay = playerInventory.lastRefresh + playerInventory.settings.autoRefreshDelay * 60 * 1000 - Date.now();
  if (delay <= 0) return refreshInventory(true);
}

export function autoRefresh() {
  if (!playerInventory.settings.autoRefreshActive) return;
  playerInventory.autoRefreshTimer = setTimeout(() => refreshInventory(true), playerInventory.settings.autoRefreshDelay * 60 * 1000);
}

export function stopAutoRefresh() {
  clearTimeout(playerInventory.autoRefreshTimer);
}
