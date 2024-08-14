import { PacketType } from '../../constants.js';
import { prisma } from '../../utils/prisma/index.js';

async function load_ability(socket, data) {
  const { abilityId } = data;
  let ability_info = await prisma.AbilityInfo.findFirst({
    where: {
      id: abilityId,
    },
  });
  socket.emit('event', {
    packetType: PacketType.S2C_SEND_ABILITY_INFO,
    ability_info: ability_info,
  });
}

export { load_ability };
