import { PacketType } from '../../constants.js';
import { getGameAssets } from '../../init/assets.js';
import { towerSet, towerDelete, towerAttackTimeSet } from '../../models/tower.model.js';
import { getPlayData } from '../../models/playData.model.js';
import { getOpponentInfo } from '../../models/playData.model.js';
import { getMonsters, setDamagedMonsterHp, setPoisonMonster } from '../../models/monster.model.js';
import { sendGameSync } from '../game/gameSyncHandler.js';

export const towerAddHandler = (socket, data) => {
  const { userId, towerType, towerId, posX, posY } = data.payload;
  const towerAsset = getGameAssets().towerData.towerType;
  const userData = getPlayData(userId);

  //#region 타워 간 거리 조정 로직
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
  //#endregion

  //#region 타워와 도로 간의 거리 조정 로직
  min = Infinity;
  for (const road of userData.monsterPath) {
    const distance = Math.sqrt(Math.pow(posX - road.x, 2) + Math.pow(posY - road.y, 2));
    min = Math.min(min, distance);
  }

  if (min < 100) return { status: 'fail', message: '타워와 도로 간 거리가 너무 가깝습니다!' };
  //#endregion

  //#region Tower Number Check
  const index = (towerId * 1) % 100;
  if (!towerAsset[towerType][index]) return { status: 'fail', message: '잘못된 접근입니다!' };
  //#endregion

  try {
    //#region Gold 관련 검증, 조정 로직
    const gold = userData.getGold();
    if (gold < towerAsset[towerType][index].cost)
      return { status: 'fail', message: '타워를 설치 비용이 부족합니다.' };

    userData.spendGold(towerAsset[towerType][index].cost);
    //#endregion

    //#region 서버 데이터에 타워 추가
    const newNumber = userData.towerInit.length + 1;
    towerSet(userData.towerInit, towerType, towerId * 1, {
      number: newNumber,
      posX,
      posY,
      attackTime: new Date().getTime(),
    });
    //#endregion

    //#region 보낼 Packet 정의
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
    //#endregion

    //#region Client 내용 전송
    const opponentSocket = getOpponentInfo(userId);
    socket.emit('userTowerCreate', packet);
    opponentSocket.emit('userTowerCreate', packet);
    //#endregion
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

    //#region Gold, Max Level Check
    if (towerId % 100 >= 2)
      return { status: 'fail', message: '모든 업그레이드가 진행된 타워입니다.' };

    if (gold < towerAsset[towerType][index].cost)
      return { status: 'fail', message: '타워를 업그레이드 비용이 부족합니다.' };
    //#endregion

    //#region User Tower 조정
    userData.spendGold(towerAsset[towerType][index].cost);
    const newTower = towerDelete(userData.towerInit, towerType, towerId, towerNumber);
    towerSet(userData.towerInit, towerType, towerId * 1 + 1, newTower[0], true);
    //#endregion

    //#region 보낼 Packet 정의
    let packet = {
      packetType: PacketType.S2C_TOWER_CREATE,
      userId: userId,
      towerType: towerType,
      towerId: towerId * 1 + 1,
      towerCost: towerAsset[towerType][index].cost,
      towerData: newTower[0],
    };
    //#endregion

    //#region Client 내용 전송
    const opponentSocket = getOpponentInfo(userId);
    socket.emit('userTowerUpgrade', packet);
    opponentSocket.emit('userTowerUpgrade', packet);
    //#endregion
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

    //#region User, Monster, Tower Check
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
    //#endregion

    //#region Speed Buf Tower Check
    const speedTowerId = isExistSpeed.towerId;
    const speedTowerNumber = isExistSpeed.towerNumber;

    let speed;
    if (speedTowerId) {
      for (let speedTower of userData.towerInit[speedSupportTower][speedTowerId]) {
        if (speedTower.number == speedTowerNumber) {
          const distance = Math.sqrt(
            Math.pow(speedTower.posX - myTowerData.posX, 2) +
              Math.pow(speedTower.posY - myTowerData.posY, 2),
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

    // const speedIncludeTowerId = speed
    //   ? time - myTowerOfServer.attackTime - (speed / 60) * 1000
    //   : time - myTowerOfServer.attackTime;

    // const selectSpeedTower = towerAsset[towerType][towerId % 100];

    // console.log(speedIncludeTowerId, (selectSpeedTower.attackCycle / 100) * 600);
    // if (speedIncludeTowerId < (selectSpeedTower.attackCycle / 100) * 600)
    //   console.log('현재 정상적이지 않은 공격속도입니다.');
    towerAttackTimeSet(userData.towerInit, towerType, towerId, towerNumber, time);
    //#endregion

    //#region Power Buf Tower Check
    const powerTowerId = isExistPower.towerId;
    const powerTowerNumber = isExistPower.towerNumber;

    let power;
    if (powerTowerId) {
      for (let powerTower of userData.towerInit.attackSupportTower[powerTowerId]) {
        if (powerTower.number == powerTowerNumber) {
          const distance = Math.sqrt(
            Math.pow(powerTower.posX - myTowerOfServer.posX, 2) +
              Math.pow(powerTower.posY - myTowerOfServer.posY, 2),
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
    //#endregion

    //#region Damage calculate
    const towerStatus = towerAsset[towerType][towerId % 100];
    const critical =
      towerStatus.criticalPercent || 10 >= Math.floor(Math.random() * 101) ? true : false;

    let damage = 0;
    const baseDamage = towerStatus.power + (power || 0);
    const criticalDamage = towerStatus.criticalDamage || 1.2;

    if (critical) damage = baseDamage * criticalDamage;
    else damage = baseDamage;
    //#endregion

    let attackedmonsters = [];

    //#region poison and different Tower Check
    if (data.payload.poisonDamage) {
      const poisonDamage = data.payload.poisonDamage;
      for (let monsterData of monsterIndexs) {
        let attackedMonster = monsters.find(
          (monster) => monster.monsterIndex == monsterData.monsterIndex,
        );
        attackedmonsters.push(
          setPoisonMonster(userId, damage, (towerId % 100) + 1, monsterData.monsterIndex),
        );
      }
    } else {
      for (let monsterData of monsterIndexs) {
        let attackedMonster = monsters.find(
          (monster) => monster.monsterIndex == monsterData.monsterIndex,
        );
        attackedmonsters.push(setDamagedMonsterHp(userId, damage, monsterData.monsterIndex));
      }
    }
    //#endregion

    //#region Splash Tower Check
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

    //#region Tower Kill Score
    let killCount = 0;
    for (let monster of attackedmonsters) {
      if (monster.hp <= 0) {
        killCount++;
      }
    }
    //#endregion

    let packet = {
      packetType: PacketType.S2C_TOWER_ATTACK,
      userId: userId,
      towerType: towerType,
      towerId: towerId,
      towerNumber,
      attackedmonsters,
      killCount,
    };

    const opponentSocket = getOpponentInfo(userId);
    socket.emit('towerAttack', packet);
    opponentSocket.emit('towerAttack', packet);
  } catch (err) {
    console.log(err);
  }
};

export const towerDestroy = (socket, data) => {};

// let attackedTower = { towerType, towerId, towerNumber };
// attackedMonster = setDamagedMonsterHp(userId, damage, monsterData.monsterIndex);
// sendGameSync(socket, userId, PacketType.S2C_TOWER_ATTACK, {
//   attackedMonster,
//   attackedTower,
// });
