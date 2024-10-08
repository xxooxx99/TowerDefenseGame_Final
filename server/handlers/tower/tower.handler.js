import {
  towerSet,
  towerDelete,
  towerAttackTimeSet,
  calculateDistance,
} from '../../models/tower.model.js';
import { PacketType } from '../../constants.js';
import { getGameAssets } from '../../init/assets.js';
import { getPlayData } from '../../models/playData.model.js';
import { getMonsters, setDamagedMonsterHp, setPoisonMonster } from '../../models/monster.model.js';
import { CLIENTS } from '../match/matchMakingHandler.js';

export const towerAddHandler = (socket, data) => {
  const { userId, towerType, towerId, posX, posY } = data.payload;
  const towerAsset = getGameAssets().towerData.towerType;
  const userData = getPlayData(userId);

  let min = Infinity;
  for (const towerData in userData.towerInit) {
    if (towerData !== 'length') {
      const towerType = userData.towerInit[towerData];
      for (let towerId in towerType)
        for (let i = 0; i < towerType[towerId].length; i++) {
          const towerX = towerType[towerId][i].posX;
          const towerY = towerType[towerId][i].posY;

          const distance = calculateDistance(posX, posY, towerX, towerY);
          min = Math.min(min, distance);
        }
    }
  }

  if (min < 80) return { status: 'fail', message: '타워간 거리가 너무 가깝습니다!' };

  min = Infinity;
  for (const road of userData.monsterPath) {
    const distance = calculateDistance(posX, posY, road.x, road.y);
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

    towerUnLockCheck(socket, userId);
    const opponentPlayerId = userData.getOpponentInfo();
    const opponentSocket = CLIENTS[opponentPlayerId];
    socket.emit('userTowerCreate', packet);
    opponentSocket.emit('userTowerCreate', packet);
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
    const gold = userData.getGold();
    const index = towerId % 100;

    if (towerId % 100 >= 2)
      return { status: 'fail', message: '모든 업그레이드가 진행된 타워입니다.' };

    if (gold < towerAsset[towerType][index].cost)
      return { status: 'fail', message: '타워를 업그레이드 비용이 부족합니다.' };

    userData.spendGold(towerAsset[towerType][index].cost);
    const newTower = towerDelete(userData.towerInit, towerType, towerId, towerNumber);
    towerSet(userData.towerInit, towerType, towerId * 1 + 1, newTower[0], true);

    let packet = {
      packetType: PacketType.S2C_TOWER_CREATE,
      userId: userId,
      towerType: towerType,
      towerId: towerId * 1 + 1,
      towerCost: towerAsset[towerType][index].cost,
      towerData: newTower[0],
    };

    const opponentPlayerId = userData.getOpponentInfo();
    const opponentSocket = CLIENTS[opponentPlayerId];
    socket.emit('userTowerUpgrade', packet);
    opponentSocket.emit('userTowerUpgrade', packet);
  } catch (err) {
    console.log(err);
    return { status: 'fail', message: '타워를 업그레이드 요청에 실패하였습니다.' };
  }
};

export const towerAttack = (socket, data) => {
  try {
    const {
      time,
      userId,
      towerType,
      towerId,
      towerNumber,
      monsterIndexs,
      isExistSpeed,
      isExistPower,
    } = data.payload;

    const towerAsset = getGameAssets().towerData.towerType;
    const userData = getPlayData(userId);
    const monsters = getMonsters(userId);

    if (!userData || !monsters)
      return { status: 'fail', message: '해당 유저 정보가 존재하지 않습니다.' };

    let myTowerOfServer;
    const myTowerData = userData.towerInit[towerType][towerId];
    for (let i = 0; i < myTowerData.length; i++) {
      if (myTowerData[i].number == towerNumber) myTowerOfServer = myTowerData[i];
    }

    if (!myTowerOfServer) {
      console.log('타워가 존재하지 않습니다.');
      return;
    }

    const speedTowerId = isExistSpeed.towerId;
    const speedTowerNumber = isExistSpeed.towerNumber;

    let speed;
    if (speedTowerId) {
      for (let speedTower of userData.towerInit[speedSupportTower][speedTowerId]) {
        if (speedTower.number == speedTowerNumber) {
          const distance = calculateDistance(
            speedTower.posX,
            speedTower.posY,
            myTowerData.posX,
            myTowerData.posY,
          );

          for (let i = towerAsset.speedSupportTower.length - 1; i >= 0; i--) {
            if (towerAsset.speedSupportTower[i].id == speedTowerId) {
              const towerRange = towerAsset.speedSupportTower[i].bufRange;
              if (distance <= towerRange) {
                speed = towerAsset.speedSupportTower[i].addSpeed;
                break;
              }
            }
          }
        }
        if (speed) break;
      }
    }

    towerAttackTimeSet(userData.towerInit, towerType, towerId, towerNumber, time);

    const powerTowerId = isExistPower.towerId;
    const powerTowerNumber = isExistPower.towerNumber;

    let power;
    if (powerTowerId) {
      for (let powerTower of userData.towerInit.attackSupportTower[powerTowerId]) {
        if (powerTower.number == powerTowerNumber) {
          const distance = calculateDistance(
            powerTower.posX,
            powerTower.posY,
            myTowerOfServer.posX,
            myTowerOfServer.posY,
          );

          for (let i = 0; i < towerAsset.attackSupportTower.length; i++) {
            if (towerAsset.attackSupportTower[i].id == powerTowerId) {
              const towerRange = towerAsset.attackSupportTower[i].bufRange;
              if (distance <= towerRange) {
                power = towerAsset.attackSupportTower[i].addDamage;
                break;
              }
            }
          }
        }
        if (power) break;
      }
    }

    const towerStatus = towerAsset[towerType][towerId % 100];
    const critical =
      towerStatus.criticalPercent || 10 >= Math.floor(Math.random() * 101) ? true : false;

    let damage = 0;
    const baseDamage = towerStatus.power + (power || 0);
    const criticalDamage = towerStatus.criticalDamage || 1.2;

    if (critical) damage = baseDamage * criticalDamage;
    else damage = baseDamage;

    let attackedmonsters = [];

    if (data.payload.poisonDamage) {
      const poisonDamage = data.payload.poisonDamage;
      for (let monsterData of monsterIndexs) {
        attackedmonsters.push(
          setPoisonMonster(
            userId,
            damage,
            (towerId % 100) + 1,
            monsterData.monsterIndex,
            poisonDamage,
          ),
        );
      }
    } else {
      for (let monsterData of monsterIndexs) {
        attackedmonsters.push(setDamagedMonsterHp(userId, damage, monsterData.monsterIndex));
      }
    }

    if (data.payload.monstersSplash) {
      const monstersSplash = data.payload.monstersSplash;
      for (let monsterBySplash of monstersSplash) {
        let attackedMonsterBySplash = monsters.find(
          (monster) => monster.monsterIndex == monsterBySplash.monsterIndex,
        );
        attackedmonsters.push(
          setDamagedMonsterHp(userId, damage, attackedMonsterBySplash.monsterIndex),
        );
      }
    }

    let killCount = 0;
    for (let monster of attackedmonsters) {
      if (monster.hp <= 0) {
        killCount++;
      }
    }

    let packet = {
      packetType: PacketType.S2C_TOWER_ATTACK,
      userId: userId,
      towerType: towerType,
      towerId: towerId,
      towerNumber,
      attackedmonsters,
      killCount,
    };

    const opponentPlayerId = userData.getOpponentInfo();
    const opponentSocket = CLIENTS[opponentPlayerId];
    socket.emit('towerAttack', packet);
    opponentSocket.emit('towerAttack', packet);
  } catch (err) {
    console.log(err);
  }
};

export const towerSale = (socket, data) => {
  try {
    const { userId, towerType, towerId, towerNumber } = data.payload;
    const towerAsset = getGameAssets().towerData.towerType;
    const userData = getPlayData(userId);
    const index = towerId % 100;

    if (!userData) {
      console.log('플레이어가 존재하지 않습니다.');
      return;
    }

    let saleTower;
    const towers = userData.towerInit[towerType][towerId];
    for (let tower of towers) {
      if (tower.number == towerNumber) {
        saleTower = towerDelete(userData.towerInit, towerType, towerId, towerNumber);
        break;
      }
    }

    let gold;
    if (saleTower) {
      gold = Math.ceil(towerAsset[towerType][index].cost / 2);
      userData.addGold(gold);
    }

    let packet = {
      packetType: PacketType.S2C_TOWER_SALE,
      userId: userId,
      towerType: towerType,
      towerId: towerId,
      towerNumber: towerNumber,
      saledGold: gold,
    };

    const opponentPlayerId = userData.getOpponentInfo();
    const opponentSocket = CLIENTS[opponentPlayerId];
    socket.emit('towerSale', packet);
    opponentSocket.emit('towerSale', packet);
  } catch (err) {
    console.log(err);
  }
};

export const towerUnLockCheck = (socket, userId) => {
  const userData = getPlayData(userId);
  const userTowers = userData.towerInit;
  const userLock = userData.towerLock;

  const check = userLock.filter((boolean) => boolean == false);
  if (check.length == 0) return;

  //Speed Tower Part
  if (!userLock[1]) {
    let count = 0;
    for (let number in userTowers.baseTower) count += userTowers.baseTower[number].length;

    if (count >= 10) userLock[1] = true;
  }

  //speedSupport Tower Part
  if (!userLock[2]) {
    let count = 0;
    for (let number in userTowers.speedTower) count += userTowers.speedTower[number].length;
    if (count >= 10) userLock[2] = true;
  }

  //attackSupport Tower Part
  if (!userLock[3]) {
    let count = 0;
    for (let number in userTowers.strongTower) count += userTowers.strongTower[number].length;
    if (count >= 10) userLock[3] = true;
  }

  //strong Tower Part
  if (!userLock[4]) {
    let count = 0;
    for (let number in userTowers.baseTower) count += userTowers.baseTower[number].length;
    if (count >= 15) userLock[4] = true;
  }

  //splash Tower Part
  if (!userLock[5]) {
    const userGold = userData.getGold();
    if (userGold >= 15000) userLock[5] = true;
  }

  //multiShot Tower, poison Tower, growth Tower Part
  if (!userLock[6]) if (userTowers.length >= 50) userLock[6] = true;
  if (!userLock[7]) if (userTowers.length >= 70) userLock[7] = true;
  if (!userLock[8]) if (userTowers.length >= 90) userLock[8] = true;

  const hasChangedCheck = userLock.filter((boolean) => boolean == false);
  if (check.length != hasChangedCheck.length) {
    let packet = {
      packetType: PacketType.S2C_TOWER_ALLOW,
      userLock: userLock,
    };

    socket.emit('towerAllow', packet);
  }
};
