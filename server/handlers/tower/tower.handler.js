import { PacketType } from '../../constants.js';
import { getGameAssets } from '../../init/assets.js';
import { towerSet, towerDelete, towerAttackTimeSet } from '../../models/tower.model.js';
import { getPlayData } from '../../models/playData.model.js';
import { getOpponentInfo } from '../../models/playData.model.js';
import { getMonsters, setDamagedMonsterHp } from '../../models/monster.model.js';
import { sendGameSync } from '../game/gameSyncHandler.js';

export const towerAddHandler = (socket, data) => {
  const towerAsset = getGameAssets().towerData.towerType;
  const { userId, towerType, towerId, posX, posY } = data.payload;
  const userData = getPlayData(userId);

  let min = Infinity;
  for (const towerData in userData.towerInit) {
    if (towerData !== 'length') {
      const towerType = userData.towerInit[towerData];
      for (let towerId in towerType)
        for (let i = 0; i < towerType[towerId].length; i++) {
          const distance = Math.sqrt(
            Math.pow(posX - towerType[towerId][i].posX, 2) +
              Math.pow(posY - towerType[towerId][i].posY, 2),
          );
          min = Math.min(min, distance);
        }
    }
  }

  if (min < 80) return { status: 'fail', message: '타워간 거리가 너무 가깝습니다!' };

  min = Infinity;
  for (const road of userData.monsterPath) {
    const distance = Math.sqrt(Math.pow(posX - road.x, 2) + Math.pow(posY - road.y, 2));
    min = Math.min(min, distance);
  }

  if (min < 100) return { status: 'fail', message: '타워와 도로 간 거리가 너무 가깝습니다!' };

  const index = (towerId * 1) % 100;
  if (!towerAsset[towerType][index]) return { status: 'fail', message: '잘못된 접근입니다!' };

  try {
    const gold = userData.getGold();
    if (gold < towerAsset[towerType][index].cost)
      return { status: 'fail', message: '타워를 설치 비용이 부족합니다.' };

    userData.spendGold(towerAsset[towerType][index].cost);
    const newNumber = userData.towerInit.length + 1;
    towerSet(userData.towerInit, towerType, towerId * 1, {
      number: newNumber,
      posX,
      posY,
      attackTime: new Date().getTime(),
    });

    let packet = {
      packetType: PacketType.S2C_TOWER_CREATE,
      userId: userId,
      towerType: towerType,
      towerId: towerId,
      towerCost: towerAsset[towerType][index].cost,
      number: newNumber,
      posX,
      posY,
    };

    const opponentSocket = getOpponentInfo(userId);
    socket.emit('userTowerCreate', packet);
    opponentSocket.emit('userTowerCreate', packet);
    return { status: 'success', message: '타워를 설치 요청 완료' };
  } catch (err) {
    console.log(err);
    return { status: 'fail', message: '타워를 설치 요청에 실패하였습니다.' };
  }
};

export const towerUpgrade = (socket, data) => {
  try {
    const { userId, towerType, towerId, towerNumber } = data.payload;
    const towerAsset = getGameAssets().towerData.towerType;
    const userData = getPlayData(userId);
    const index = towerId % 100;
    const gold = userData.getGold();

    if (towerId % 100 >= 2)
      return { status: 'fail', message: '모든 업그레이드가 진행된 타워입니다.' };

    if (gold < towerAsset[towerType][index].cost)
      return { status: 'fail', message: '타워를 업그레이드 비용이 부족합니다.' };

    userData.spendGold(towerAsset[towerType][index].cost);
    const newTower = towerDelete(userData.towerInit, towerType, towerId * 1, towerNumber);
    towerSet(userData.towerInit, towerType, towerId * 1 + 1, newTower[0], true);

    let packet = {
      packetType: PacketType.S2C_TOWER_CREATE,
      userId: userId,
      towerType: towerType,
      towerId: towerId * 1 + 1,
      towerCost: towerAsset[towerType][index].cost,
      towerData: newTower[0],
    };

    const opponentSocket = getOpponentInfo(userId);
    socket.emit('userTowerUpgrade', packet);
    opponentSocket.emit('userTowerUpgrade', packet);

    return { status: 'success', message: '타워를 업그레이드 요청 완료' };
  } catch (err) {
    console.log(err);
    return { status: 'fail', message: '타워를 업그레이드 요청에 실패하였습니다.' };
  }
};

export const towerAttack = (socket, data) => {
  try {
    const {
      userId,
      towerType,
      towerId,
      towerNumber,
      monsterIndexs,
      time,
      isExistSpeed,
      isExistPower,
    } = data.payload;

    const towerAsset = getGameAssets().towerData.towerType;
    const userData = getPlayData(userId);
    const monsters = getMonsters(userId);

    if (!userData || !monsters)
      return { status: 'fail', message: '해당 유저 정보가 존재하지 않습니다.' };

    let myTower;
    let myTowerStatus = towerAsset[towerType][towerId % 100];
    const myTowerType = userData.towerInit[towerType][towerId];
    for (let i = 0; i < myTowerType.length; i++) {
      if (myTowerType[i].number == towerNumber) myTower = myTowerType[i];
    }

    if (!myTower) return { status: 'fail', message: '해당 타워가 존재하지 않습니다.' };

    const speedTowerId = isExistSpeed.towerId;
    const speedTowerNumber = isExistSpeed.towerNumber;
    const powerTowerId = isExistPower.towerId;
    const powerTowerNumber = isExistPower.towerNumber;

    let speed;
    if (speedTowerId) {
      for (let speedTower of userData.towerInit[speedSupportTower][speedTowerId]) {
        if (speedTower.number == speedTowerNumber) {
          const distance = Math.sqrt(
            Math.pow(speedTower.posX - myTowerType.posX, 2) +
              Math.pow(speedTower.posY - myTowerType.posY, 2),
          );

          for (let i = towerAsset.speedSupportTower.length - 1; i >= 0; i--) {
            if (towerAsset.speedSupportTower[i].id == speedTowerId) {
              const towerRange = towerAsset.speedSupportTower[i].bufRange;
              if (distance <= towerRange) {
                speed = towerAsset.speedSupportTower[i].addSpeed;
              }
            }

            if (speed) break;
          }
        }
        if (speed) break;
      }
    }

    const speedIncludeTowerId = speed
      ? time - myTower.attackTime - (speed / 90) * 1000
      : time - myTower.attackTime;

    if (speedIncludeTowerId < (towerAsset[towerType][towerId % 100].attackCycle / 100) * 1000) {
      console.log(
        speedIncludeTowerId,
        (towerAsset[towerType][towerId % 100].attackCycle / 90) * 1000,
        '정상적이지 않은 공격속도',
      );
      return { status: 'fail', message: '현재 정상적인 공격속도가 아닙니다.' };
    }
    towerAttackTimeSet(userData.towerInit, towerType, towerId, towerNumber, time);

    let power;
    if (powerTowerId) {
      for (let powerTower of userData.towerInit.attackSupportTower[powerTowerId]) {
        if (powerTower.number == powerTowerNumber) {
          const distance = Math.sqrt(
            Math.pow(powerTower.posX - myTowerType.posX, 2) +
              Math.pow(powerTower.posY - myTowerType.posY, 2),
          );

          for (let i = 0; i < towerAsset.attackSupportTower.length; i++) {
            if (towerAsset.attackSupportTower[i].id == powerTowerId) {
              const towerRange = towerAsset.attackSupportTower[i].bufRange;
              if (distance <= towerRange) {
                power = towerAsset.attackSupportTower[i].addDamage;
              }
            }
            if (power) break;
          }
        }
        if (power) break;
      }
    }

    const critical =
      towerAsset[towerType][towerId % 100].criticalPercent || 10 >= Math.floor(Math.random() * 101)
        ? true
        : false;

    let damage = 0;
    const baseDamage = towerAsset[towerType][towerId % 100].power + (power || 0);
    const criticalDamage = towerAsset[towerType][towerId % 100].criticalDamage || 1.2;

    if (critical) damage = baseDamage * criticalDamage;
    else damage = baseDamage;

    for (let monsterData of monsterIndexs) {
      let attackedMonster = monsters.find(
        (monster) => monster.monsterIndex == monsterData.monsterIndex,
      );
      let attackedTower = { towerType, towerId, towerNumber };
      attackedMonster = setDamagedMonsterHp(userId, damage, monsterData.monsterIndex);
      sendGameSync(socket, userId, PacketType.S2C_TOWER_ATTACK, {
        attackedMonster,
        attackedTower,
      });
    }
  } catch (err) {
    console.log(err);
  }
};

export const towerDestroy = (socket, data) => {};
