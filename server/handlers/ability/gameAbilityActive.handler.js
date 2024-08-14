import { PacketType } from '../../constants.js';
import { getPlayData } from '../../models/playData.model.js';
import { prisma } from '../../utils/prisma/index.js';
import { active_ability_1 } from './ability_1.handler.js';
import { active_ability_2 } from './ability_2.handler.js';

let matchingList = [];
let ability_count_list = [];
let abilityList;

async function add_count(socket, data) {
  const { userId } = data;

  if (!abilityList) {
    abilityList = await prisma.AbilityInfo.findMany();
  }

  const user_ability = await prisma.userAbilityList.findUnique({
    where: {
      userId: userId,
    },
    include: {
      userAbilityInfo: {
        orderBy: {
          abilityId: 'asc', // abilityId를 오름차순으로 정렬
        },
      },
    },
  });

  let user_current_ability;

  user_ability.userAbilityInfo.forEach((element) => {
    if (element.abilityId === user_ability.equipAbilityId) {
      user_current_ability = element;
    }
  });

  let needActiveCount;
  abilityList.forEach((element) => {
    if (element.id === user_current_ability.abilityId) {
      needActiveCount = element[`needCount_${user_current_ability.currentUpgrade}`];
    }
  });

  const existingUser = ability_count_list.find((user) => user.userId === userId);
  if (!existingUser) {
    ability_count_list.push({
      socket: socket,
      userId: userId,
      count: 1,
      activeCount: needActiveCount,
      abilityId: user_current_ability.abilityId,
    });
  } else {
    existingUser.count++;
  }

  socket.on('disconnect', () => {
    ability_count_list = ability_count_list.filter((user) => user.userId !== userId);
    matchingList = matchingList.filter(
      (matching) => matching.user1_id !== userId && matching.user2_id !== userId,
    );
  });

  check_count(socket);
}

async function check_count(socket) {
  for (let index = 0; index < ability_count_list.length; index++) {
    let userAbility = ability_count_list[index];
    if (userAbility.count >= userAbility.activeCount) {
      userAbility.count = 0;
      requestAbility(socket, userAbility.abilityId, userAbility.userId);
    }
  }
}

async function requestAbility(socket, abilityId, userId) {
  switch (abilityId) {
    case 1:
      active_ability_1(socket, userId);
      break;
    case 2:
      let opponentUserSocket = findOpponentUserSocket(userId);
      active_ability_2(opponentUserSocket);
      break;
    default:
      console.log('지정되지 않은 능력을 작동하려고 시도했습니다.');
  }
}

function findOpponentUserSocket(id) {
  let result;
  matchingList.forEach((matching) => {
    if (matching.user1_id === id) {
      result = matching.user2_socket;
    } else if (matching.user2_id === id) {
      result = matching.user1_socket;
    } else {
      result = null;
    }
  });
  return result;
}

async function add_matching(user1_id, user1_socket, user2_id, user2_socket) {
  matchingList.push({
    user1_id: user1_id,
    user1_socket: user1_socket,
    user2_id: user2_id,
    user2_socket: user2_socket,
  });
}

export { add_count, add_matching };
