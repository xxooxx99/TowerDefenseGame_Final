import { PacketType } from '../../constants.js';
import { getGameAssets } from '../../init/assets.js';
import { towerSet, towerDelete } from '../../models/tower.model.js';
import { getPlayData } from '../../models/playData.model.js';
import { getOpponentInfo } from '../../models/playData.model.js';

export const towerAddHandler = (socket, data) => {
  const towerAsset = getGameAssets().towerData.towerType;
  const { userId, towerType, towerId, posX, posY } = data;
  const userData = getPlayData(userId);

  let min = Infinity;
  for (const towerData in userData.towerInit) {
    if (towerData !== 'length') {
      const towerType = userData.towerInit[towerData];
      for (let towerId in towerType)
        for (let i = 0; i < towerType[towerId].length; i++) {
          const value =
            Math.abs(towerType[towerId][i].posX - posX) +
            Math.abs(towerType[towerId][i].posY - posY);
          min = Math.min(min, value);
        }
    }
  }

  if (min < 80) return { status: 'fail', message: '타워간 거리가 너무 가깝습니다!' };

  min = Infinity;
  for (const road of userData.monsterPath) {
    const value = Math.abs(road.x - posX) + Math.abs(road.y - posY);
    min = Math.min(min, value);
  }

  if (min < 100) return { status: 'fail', message: '타워와 도로 간 거리가 너무 가깝습니다!' };

  const index = towerId % 100;
  if (!towerAsset[towerType][index]) return { status: 'fail', message: '잘못된 접근입니다!' };

  try {
    const gold = userData.getGold();
    if (gold < towerAsset[towerType][index].cost)
      return { status: 'fail', message: '타워를 설치 비용이 부족합니다.' };

    userData.spendGold(towerAsset[towerType][index].cost);
    const newNumber = userData.towerInit.length + 1;
    towerSet(userData.towerInit, towerType, towerId, { number: newNumber, posX, posY });

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
    const { userId, towerType, towerId, towerNumber } = data;
    const towerAsset = getGameAssets().towerData.towerType;
    const userData = getPlayData(userId);
    const index = towerId % 100;
    const gold = userData.getGold();

    if (towerId % 100 >= 6)
      return { status: 'fail', message: '모든 업그레이드가 진행된 타워입니다.' };

    if (gold < towerAsset[towerType][index].cost)
      return { status: 'fail', message: '타워를 업그레이드 비용이 부족합니다.' };

    userData.spendGold(towerAsset[towerType][index].cost);

    const newTower = towerDelete(userData.towerInit, towerType, towerId, towerNumber);
    towerSet(userData.towerInit, towerType, towerId + 1, newTower[0], true);

    //console.log(typeof newTower[0].number, typeof newTower[0].posX, typeof newTower[0].posY);
    let packet = {
      packetType: PacketType.S2C_TOWER_CREATE,
      userId: userId,
      towerType: towerType,
      towerId: towerId + 1,
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

// ex
// userTower = {
//     length: 0,
//       towerType: {
//          ID : [
//           {towerNum ,x, y },
//          ]
//       }
// }
