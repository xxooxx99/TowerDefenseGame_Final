import { PacketType } from '../../constants.js';
import { getPlayData } from '../../models/playData.model.js';

const abilityGold = 1;
const abilityActiveNeedCount = 5;

let ability_count_list = [];

async function add_count(socket, data) {
  const { userId } = data;
  const existingUser = ability_count_list.find((user) => user.userId === userId);
  if (!existingUser) {
    ability_count_list.push({ socket: socket, userId: userId, count: 1 });
  } else {
    existingUser.count++;
  }

  console.log(ability_count_list);
  for (let index = 0; index < ability_count_list.length; index++) {
    if (ability_count_list[index].count >= abilityActiveNeedCount) {
      ability_count_list[index].socket.emit('event', {
        PacketType: PacketType.S2C_GOLD_ABILITY_ACTIVE,
      });
      const playerData = getPlayData(userId);
      playerData.addGold(abilityGold);
      ability_count_list.splice(index, 1);
    }
  }
}

export { add_count };
