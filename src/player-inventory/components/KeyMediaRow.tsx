import { InventoryKey, InventoryMedia } from '../inventory';

export default function ({ item, children }: { item: InventoryKey | InventoryMedia; children?: any }) {
  const details = Array.from(item.count)
    .map(([name, count]) => `${name}: ${count}`)
    .join(', ');
  return (
    <tr>
      <td>
        <a title={details}>{item.total}</a>
      </td>
      <td>{children}</td>
    </tr>
  );
}
