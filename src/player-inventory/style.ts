import playerInventoryCSS from './player-inventory.css';

import playerInventory from './plugin';
import { shortenRarity } from './utils';

export function setupCSS() {
  let colorStyle = '';
  if (playerInventory.settings.lvlColorEnable) {
    window.COLORS_LVL.forEach((c, i) => {
      colorStyle += `.level_L${i}{ color: ${c} }`;
    });
    for (const r in window.COLORS_MOD) {
      colorStyle += `.rarity_${shortenRarity(r)} { color: ${window.COLORS_MOD[r]} }`;
    }
  }
  const style = document.head.querySelector('#player-inventory-css') || document.createElement('style');
  style.id = 'player-inventory-css';
  style.textContent = playerInventoryCSS + colorStyle;
  document.head.append(style);
}
