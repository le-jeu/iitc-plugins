import { shortenRarity } from '../utils';
import { getItemName } from '../extract';

import type { ItemType, LevelRarity } from '../inventory';

export default function (props: { item: { type: ItemType; leveled: boolean }; lvl: LevelRarity | string; count: number }) {
  const { item, lvl, count } = props;
  const lr = item.leveled ? 'L' + lvl : shortenRarity(lvl as string);
  const className = (item.leveled ? 'level_' : 'rarity_') + lr;
  const name = getItemName(item.type);
  return (
    <tr className={className}>
      <td>{count}</td>
      <td>{lr}</td>
      <td>{name}</td>
    </tr>
  );
}
