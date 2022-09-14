import { Inventory } from '../inventory';
import { localeCompare } from '../utils';
import KeyMediaRow from './KeyMediaRow';

export default function ({ inventory }: { inventory: Inventory }) {
  const medias = [...inventory.medias.values()].sort((a, b) => localeCompare(a.name, b.name));
  return (
    <table>
      {medias.map((media) => (
        <KeyMediaRow item={media}>
          <a href={media.url}>{media.name}</a>
        </KeyMediaRow>
      ))}
    </table>
  );
}
