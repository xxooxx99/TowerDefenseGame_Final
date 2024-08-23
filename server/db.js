import { prisma } from './utils/prisma/index.js';

async function db_data_add() {
  //  #region Ability 1번 추가하는 구문
  let ability_1 = await prisma.AbilityInfo.findFirst({
    where: { id: 1 },
  });

  if (ability_1) {
  } else {
    ability_1 = await prisma.AbilityInfo.create({
      data: {
        id: 1,
        icon: '../images/ability/ability_money.png',
        name: '돈이 최고야!',
        explain:
          '일정 수 만큼의 몬스터를 사냥 할 시 추가 골드를 획득합니다. 골드 획득을 위한 몬스터의 수는 업그레이드에 따라 점점 줄어듭니다.',
        upgrade_1: '1레벨 : 몬스터 10마리 사냥 시 골드 100원을 획득합니다.',
        upgrade_2: '2레벨 : 몬스터 8마리 사냥 시 골드 100원을 획득합니다.',
        upgrade_3: '3레벨 : 몬스터 7마리 사냥 시 골드 100원을 획득합니다.',
        upgrade_4: '4레벨 : 몬스터 6마리 사냥 시 골드 100원을 획득합니다.',
        upgrade_5: '5레벨 : 몬스터 5마리 사냥 시 골드 100원을 획득합니다.',
        costTo_1: 100,
        costTo_2: 200,
        costTo_3: 300,
        costTo_4: 400,
        costTo_5: 500,
        needCount_1: 10,
        needCount_2: 8,
        needCount_3: 7,
        needCount_4: 6,
        needCount_5: 5,
      },
    });
  }

  // #endregion

  //  #region Ability 2번 추가하는 구문

  let ability_2 = await prisma.AbilityInfo.findFirst({
    where: { id: 2 },
  });

  if (ability_2) {
  } else {
    ability_2 = await prisma.AbilityInfo.create({
      data: {
        id: 2,
        icon: '../images/ability/ability_knife.png',
        name: '복수할테다...',
        explain:
          '일정 수 만큼의 몬스터를 사냥 할 시 상대방에게 몬스터를 전송합니다. 전송을 위한 몬스터의 수는 업그레이드에 따라 점점 줄어듭니다.',
        upgrade_1: '1레벨 : 몬스터 10마리 사냥 시 몬스터 1마리를 보냅니다.',
        upgrade_2: '2레벨 : 몬스터 8마리 사냥 시 몬스터 1마리를 보냅니다.',
        upgrade_3: '3레벨 : 몬스터 7마리 사냥 시 몬스터 1마리를 보냅니다.',
        upgrade_4: '4레벨 : 몬스터 6마리 사냥 시 몬스터 1마리를 보냅니다.',
        upgrade_5: '5레벨 : 몬스터 5마리 사냥 시 몬스터 1마리를 보냅니다.',
        costTo_1: 100,
        costTo_2: 200,
        costTo_3: 300,
        costTo_4: 400,
        costTo_5: 500,
        needCount_1: 10,
        needCount_2: 8,
        needCount_3: 7,
        needCount_4: 6,
        needCount_5: 5,
      },
    });
  }

  // #endregion
}

export { db_data_add };
