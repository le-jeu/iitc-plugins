import { ItemType, itemTypes, LevelRarity } from "../inventory";
import { shortenRarity } from "../utils";

export default function (props: {
  item: { type: ItemType; leveled: boolean }; 
  lvl: LevelRarity, 
  count: number;
}) {
  const { item, lvl, count } = props;
  const lr = item.leveled ? 'L' + lvl : shortenRarity(lvl as string);
  const className = (item.leveled ? 'level_' : 'rarity_') + lr;
  const name = itemTypes[item.type];
  return (
    <tr className={className}>
      <td>{count}</td>
      <td>{lr}</td>
      <td>{name}</td>
    </tr>
  );
}
