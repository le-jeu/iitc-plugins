import { InventoryCapsule } from '../inventory';
import { orderedTypes } from '../itemTypeOrder';
import { localeCompare } from '../utils';
import ItemRow from './ItemRow';
import PortalKeyLink from './PortalKeyLink';

export default function ({ capsule }: { capsule: InventoryCapsule }) {
  const keys = Object.values(capsule.keys).sort((a, b) => localeCompare(a.title, b.title));
  const medias = Object.values(capsule.medias).sort((a, b) => localeCompare(a.name, b.name));
  return (
    <table>
      {keys.map((item) => (
        <tr>
          <td>{item.count}</td>
          {capsule.type !== 'KEY_CAPSULE' ? <td></td> : null}
          <td>
            <PortalKeyLink item={item} />
          </td>
        </tr>
      ))}
      {medias.map((item) => (
        <tr className="level_L1">
          <td>{item.count}</td>
          <td>M</td>
          <td>
            <a href={item.url}>{item.name}</a>
          </td>
        </tr>
      ))}
      {orderedTypes.map((type) => {
        const item = capsule.items[type];
        if (item) {
          return Object.keys(item.count).map((i) => <ItemRow count={item.count[i]} item={item} lvl={i} />);
        }
      })}
    </table>
  );
}
