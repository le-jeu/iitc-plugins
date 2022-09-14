import { Inventory } from '../inventory';
import { localeCompare } from '../utils';
import KeyMediaRow from './KeyMediaRow';
import PortalKeyLink from './PortalKeyLink';

export default function ({ inventory }: { inventory: Inventory }) {
  const keys = [...inventory.keys.values()].sort((a, b) => localeCompare(a.title, b.title));
  return (
    <table>
      {keys.map((key) => (
        <KeyMediaRow item={key}>
          <PortalKeyLink item={key} />
        </KeyMediaRow>
      ))}
    </table>
  );
}
