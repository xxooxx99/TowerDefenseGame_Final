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

async function load_user_ability(socket, data) {
  const { userId } = data;

  const userAbilityList = await prisma.userAbilityList.findUnique({
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

  const abilityList = await prisma.AbilityInfo.findMany();

  const userInfo = await prisma.userInfo.findUnique({
    where: { userId: userId },
  });

  socket.emit('event', {
    packetType: PacketType.S2C_SEND_ABILITY_LIST,
    userAbilityList: userAbilityList,
    abilityList: abilityList,
    userInfo: userInfo,
  });
}

async function ability_upgrade(socket, data) {
  const { userId, abilityId, abilityLevel, hashId } = data;

  // 어떤 능력을 업그레이드 하려고 하는지 검색
  const ability = await prisma.AbilityInfo.findFirst({
    where: {
      id: abilityId,
    },
  });

  // 업그레이드 비용을 가져옴
  let upgrade_cost = ability[`costTo_${abilityLevel + 1}`];

  // 유저 정보를 가져옴
  const userData = await prisma.userInfo.findUnique({
    where: { userId: userId },
  });

  // 만약 업그레이드 비용을 가지고 있을 시
  if (userData.money >= upgrade_cost) {
    // 유저 금액을 감소시킨다.
    const updateUser = await prisma.userInfo.update({
      where: {
        userId: data.userId,
      },
      data: {
        money: userData.money - upgrade_cost,
      },
    });

    // 업그레이드 수치를 증가시킨다.
    const updateAbility = await prisma.userAbilityInfo.update({
      where: {
        hashId: hashId,
      },
      data: {
        currentUpgrade: abilityLevel + 1,
      },
    });

    // 클라이언트에 신호를 보낸다.
    socket.emit('event', {
      packetType: PacketType.S2C_UPGRADE_COMPLETE,
    });
  } else {
    // 업그레이드 비용을 지불 할 수 없을 시
    socket.emit('event', {
      packetType: PacketType.S2C_UPGRADE_FAILED,
    });
  }
}

async function ability_equip(socket, data) {
  const { userId, abilityId } = data;

  const currentAbility = await prisma.userAbilityList.findUnique({
    where: {
      userId: userId,
    },
  });

  if (currentAbility.equipAbilityId === abilityId) {
    socket.emit('event', {
      packetType: PacketType.S2C_ABILITY_EQUIP_FAILED,
    });
    return;
  }

  const userAbilityList = await prisma.userAbilityList.update({
    where: {
      userId: userId,
    },
    data: {
      equipAbilityId: abilityId,
    },
  });

  socket.emit('event', {
    packetType: PacketType.S2C_ABILITY_EQUIP_SUCCESS,
  });
}

export { load_ability, load_user_ability, ability_upgrade, ability_equip };
