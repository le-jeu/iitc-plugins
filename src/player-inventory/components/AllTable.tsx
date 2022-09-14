import type { Inventory, ItemType, LevelRarity } from '../inventory';
import ItemRow from './ItemRow';

export default function createAllTable({ inventory }: { inventory: Inventory }) {
  const table = <table></table>;
  for (const type in inventory.items) {
    const total = inventory.countType(type as ItemType);
    if (total === 0) continue;
    const item = inventory.items[type];
    for (const i in item.counts) {
      const num = inventory.countType(type as ItemType, i as LevelRarity);
      if (num > 0) {
        table.append(<ItemRow item={item} count={num} lvl={i} />);
      }
    }
  }
  return table;
}
