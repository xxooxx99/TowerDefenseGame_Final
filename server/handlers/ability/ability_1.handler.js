import { PacketType } from '../../constants.js';
import { getPlayData } from '../../models/playData.model.js';

const abilityGold = 1;

async function active_ability_1(socket, userId) {
  socket.emit('event', {
    PacketType: PacketType.S2C_GOLD_ABILITY_ACTIVE,
  });
  const playerData = getPlayData(userId);
  playerData.addGold(abilityGold);
}

export { active_ability_1 };
