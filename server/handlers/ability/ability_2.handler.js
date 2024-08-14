import { PacketType } from '../../constants.js';
import { getPlayData } from '../../models/playData.model.js';

async function active_ability_2(socket) {
  socket.emit('event', {
    PacketType: PacketType.S2C_SPAWN_ABILITY_ACTIVE,
  });
}

export { active_ability_2 };
