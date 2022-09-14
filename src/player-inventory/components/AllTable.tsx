import type { Inventory, LevelRarity } from '../inventory';
import { orderedTypes } from '../itemTypeOrder';

import ItemRow from './ItemRow';

export default function createAllTable({ inventory }: { inventory: Inventory }) {
  const table = <table></table>;
  for (const type of orderedTypes) {
    const total = inventory.countType(type);
    if (total === 0) continue;
    const item = inventory.items[type];
    for (const i in item.counts) {
      const num = inventory.countType(type, i as LevelRarity);
      if (num > 0) {
        table.append(<ItemRow item={item} count={num} lvl={i} />);
      }
    }
  }
  return table;
}
