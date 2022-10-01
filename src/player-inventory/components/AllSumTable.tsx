import { getItemName } from '../extract';
import type { Inventory } from '../inventory';

const C_R_VR = ['COMMON', 'RARE', 'VERY_RARE'] as const;

export default function ({ inventory }: { inventory: Inventory }) {
  const total = inventory.items['PORTAL_LINK_KEY'].total;
  const inventoryCount = inventory.items['PORTAL_LINK_KEY'].counts['VERY_COMMON'][inventory.name] || 0;
  const otherCount = total - inventoryCount - inventory.keyLockersCount;
  let beacon = 0;
  for (const type in inventory.items) {
    if (type.startsWith('PORTAL_POWERUP')) {
      switch (type) {
        case 'PORTAL_POWERUP:FRACK':
        case 'PORTAL_POWERUP:BB_BATTLE_RARE':
        case 'PORTAL_POWERUP:BB_BATTLE':
        case 'PORTAL_POWERUP:FW_ENL':
        case 'PORTAL_POWERUP:FW_RES':
          break;
        default:
          beacon += inventory.countType(type);
      }
    }
  }
  return (
    <div>
      <table>
        <tr>
          <th>Portal Keys</th>
          <th>⌂</th>
          <th>Lockers</th>
          <th>Other</th>
        </tr>
        <tr>
          <th>{total}</th>
          <td>{inventoryCount}</td>
          <td>{inventory.keyLockersCount}</td>
          <td>{otherCount}</td>
        </tr>
      </table>
      <table>
        {(
          [
            ['EMITTER_A', 'R'],
            ['EMP_BURSTER', 'B'],
            ['ULTRA_STRIKE', 'US'],
            ['POWER_CUBE', 'PC'],
          ] as const
        ).map(([type, short]) => (
          <>
            <tr>
              <th>{getItemName(type)}</th>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <th className={'level_L' + i}>{short + i}</th>
              ))}
            </tr>
            <tr>
              <th>{inventory.countType(type)}</th>
              {([1, 2, 3, 4, 5, 6, 7, 8] as const).map((i) => (
                <td>{inventory.countType(type, i)}</td>
              ))}
            </tr>
          </>
        ))}
      </table>
      <table>
        <tr>
          <th>Hypercube</th>
          <th>ADA Refactor</th>
          <th>JARVIS Virus</th>
        </tr>
        <tr>
          <td>{inventory.countType('BOOSTED_POWER_CUBE') + inventory.countType('BOOSTED_POWER_CUBE_K')}</td>
          <td>{inventory.countType('FLIP_CARD:ADA')}</td>
          <td>{inventory.countType('FLIP_CARD:JARVIS')}</td>
        </tr>
      </table>
      <table>
        <tr>
          <th>Shield</th>
          <th className="rarity_C">C</th>
          <th className="rarity_R">R</th>
          <th className="rarity_VR">VR</th>
          <th className="rarity_VR">Aegis</th>
        </tr>
        <tr>
          <th>{inventory.countType('RES_SHIELD') + inventory.countType('EXTRA_SHIELD')}</th>
          {C_R_VR.map((k) => (
            <td>{inventory.countType('RES_SHIELD', k)}</td>
          ))}
          <td>{inventory.countType('EXTRA_SHIELD')}</td>
        </tr>
      </table>
      <table>
        <tr>
          <th>Turret</th>
          <th>Force Amp</th>
          <th>Link Amp</th>
          {inventory.countType('LINK_AMPLIFIER', 'VERY_RARE') ? <th className="rarity_VR">LA VR</th> : null}
          <th>Ultra Link</th>
          <th>ITO +</th>
          <th>ITO -</th>
        </tr>
        <tr>
          <td>{inventory.countType('TURRET')}</td>
          <td>{inventory.countType('FORCE_AMP')}</td>
          <td>{inventory.countType('LINK_AMPLIFIER', 'RARE')}</td>
          {inventory.countType('LINK_AMPLIFIER', 'VERY_RARE') ? <td>{inventory.countType('LINK_AMPLIFIER', 'VERY_RARE')}</td> : null}
          <td>{inventory.countType('ULTRA_LINK_AMP')}</td>
          <td>{inventory.countType('TRANSMUTER_DEFENSE')}</td>
          <td>{inventory.countType('TRANSMUTER_ATTACK')}</td>
        </tr>
      </table>
      <table>
        <tr>
          <th>HeatSink</th>
          <th className="rarity_C">C</th>
          <th className="rarity_R">R</th>
          <th className="rarity_VR">VR</th>
          <th>MultiHack</th>
          <th className="rarity_C">C</th>
          <th className="rarity_R">R</th>
          <th className="rarity_VR">VR</th>
        </tr>
        <tr>
          <th>{inventory.countType('HEATSINK')}</th>
          {C_R_VR.map((k) => (
            <td>{inventory.countType('HEATSINK', k)}</td>
          ))}
          <th>{inventory.countType('MULTIHACK')}</th>
          {C_R_VR.map((k) => (
            <td>{inventory.countType('MULTIHACK', k)}</td>
          ))}
        </tr>
      </table>
      <table>
        <tr>
          <th>Capsule</th>
          <th>Quantum</th>
          <th>KeyLocker</th>
          <th>Kinetic</th>
          <th>Media</th>
        </tr>
        <tr>
          <td>{inventory.countType('CAPSULE')}</td>
          <td>{inventory.countType('INTEREST_CAPSULE')}</td>
          <td>{inventory.countType('KEY_CAPSULE')}</td>
          <td>
            <span className="rarity_C">{inventory.countType('KINETIC_CAPSULE', 'COMMON')}</span>
            {' + '}
            <span className="rarity_R">{inventory.countType('KINETIC_CAPSULE', 'RARE')}</span>
          </td>
          <td>{inventory.countType('MEDIA')}</td>
        </tr>
      </table>
      <table>
        <tr>
          <th>Apex</th>
          <th>Fracker</th>
          <th className="rarity_R">BB R</th>
          <th className="rarity_VR">BB VR</th>
          <th>Beacon</th>
          <th>FW ENL</th>
          <th>FW RES</th>
        </tr>
        <tr>
          <td>{inventory.countType('PLAYER_POWERUP:APEX')}</td>
          <td>{inventory.countType('PORTAL_POWERUP:FRACK')}</td>
          <td>{inventory.countType('PORTAL_POWERUP:BB_BATTLE_RARE')}</td>
          <td>{inventory.countType('PORTAL_POWERUP:BB_BATTLE')}</td>
          <td>{beacon}</td>
          <td>{inventory.countType('PORTAL_POWERUP:FW_ENL')}</td>
          <td>{inventory.countType('PORTAL_POWERUP:FW_RES')}</td>
        </tr>
      </table>
    </div>
  );
}
