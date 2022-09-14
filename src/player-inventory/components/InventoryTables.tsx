import { Inventory } from '../inventory';
import { localeCompare } from '../utils';
import { getItemName } from '../extract';
import { storeSettings } from '../storage';

import playerInventory from '../plugin';

import AllTable from './AllTable';
import AllSumTable from './AllSumTable';
import KeysTable from './KeysTable';
import MediaTable from './MediaTable';
import CapsuleTable from './CapsuleTable';

export default function ({ inventory }: { inventory: Inventory }) {
  const inventoryCount = inventory.count - inventory.keyLockersCount;
  const keyInInventory = inventory.keys.size > 0 ? inventory.items['PORTAL_LINK_KEY'].counts['VERY_COMMON'][inventory.name] || 0 : 0;
  const container = (
    <div className="container">
      <b>{`Summary I:${inventoryCount - keyInInventory} K:${keyInInventory} T:${inventoryCount}/2500 KL:${inventory.keyLockersCount}`}</b>
      <div className="sum">
        <AllSumTable inventory={inventory} />
      </div>

      <b>Details</b>
      <div className="all">
        <AllTable inventory={inventory} />
      </div>
    </div>
  );

  if (inventory.keys.size > 0) {
    container.append(
      <>
        <b>Keys</b>
        <div className="medias">
          <KeysTable inventory={inventory} />
        </div>
      </>
    );
  }

  if (inventory.medias.size > 0) {
    container.append(
      <>
        <b>Medias</b>
        <div className="all">
          <MediaTable inventory={inventory} />
        </div>
      </>
    );
  }

  const onHand = inventory.onHand();
  container.append(
    <>
      <b>On Hand ({onHand.size})</b>
      <div className="capsule">
        <CapsuleTable capsule={onHand} />
      </div>
    </>
  );

  const mapping = playerInventory.settings.capsuleNameMap;
  const capsulesName = Object.keys(inventory.capsules).sort((a, b) => {
    if (mapping[a] && !mapping[b]) return -1;
    if (!mapping[a] && mapping[b]) return 1;
    a = mapping[a] || a;
    b = mapping[b] || b;
    return localeCompare(a, b);
  });
  const keyLockers = capsulesName.filter((name) => inventory.capsules[name].type === 'KEY_CAPSULE');
  const quantums = capsulesName.filter((name) => inventory.capsules[name].type === 'INTEREST_CAPSULE');
  const commonCapsules = capsulesName.filter((name) => inventory.capsules[name].type === 'CAPSULE');
  for (const names of [keyLockers, quantums, commonCapsules]) {
    for (const name of names) {
      const capsule = inventory.capsules[name];
      if (capsule.size > 0) {
        const displayName = mapping[name] ? `${mapping[name]} [${name}]` : name;
        const typeName = getItemName(capsule.type);
        const size = capsule.size;

        const head = <b>{`${typeName}: ${displayName} (${size})`}</b>;

        container.append(
          <>
            {head}
            <div className="capsule">
              <div>
                <a
                  className="edit-name-icon"
                  title="Change capsule name"
                  onclick={(ev) => {
                    const input = ev.target.nextElementSibling;
                    input.style.display = input.style.display === 'unset' ? null : 'unset';
                  }}
                >
                  ✏️
                </a>
                <input
                  className="edit-name-input"
                  value={mapping[name] || ''}
                  placeholder="Enter capsule name"
                  oninput={(ev) => {
                    mapping[name] = ev.target.value;
                    storeSettings(playerInventory.settings);
                    const displayName = mapping[name] ? `${mapping[name]} [${name}]` : name;
                    head.textContent = `${typeName}: ${displayName} (${size})`;
                  }}
                />
              </div>
              <CapsuleTable capsule={capsule} />
            </div>
          </>
        );
      }
    }
  }
  return container;
}
