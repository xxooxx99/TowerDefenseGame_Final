import { PacketType } from '../../constants.js';
import { getGameAssets } from '../../init/assets.js';
import { towerSet } from '../../models/tower.model.js';
import { getPlayData } from '../../models/playData.model.js';
import { getOpponentInfo } from '../../models/playData.model.js';

export const towerAddHandler = (socket, data) => {
  const towerAsset = getGameAssets().towerData.data;
  const { userId, towerId, posX, posY } = data;
  const userData = getPlayData(userId);

  let min = Infinity;
  for (const towerId in userData.towerInit) {
    if (towerId !== 'length') {
      const towers = userData.towerInit[towerId];
      for (const tower of towers) {
        const value = Math.abs(tower.posX - posX) + Math.abs(tower.posY - posY);
        min = Math.min(min, value);
      }
    }
  }

  if (min < 60) return { status: 'fail', message: '타워간 거리가 너무 가깝습니다!' };

  min = Infinity;
  for (const road of userData.monsterPath) {
    const value = Math.abs(road.x - posX) + Math.abs(road.y - posY);
    min = Math.min(min, value);
  }

  if (min < 100) return { status: 'fail', message: '타워와 도로 간 거리가 너무 가깝습니다!' };

  for (let i = 0; i < towerAsset.length; i++) {
    if (towerAsset[i].id === towerId) {
      const gold = userData.getGold();
      if (gold < towerAsset[i].cost)
        return { status: 'fail', message: '타워를 설치 비용이 부족합니다.' };

      userData.spendGold(towerAsset[i].cost);
      const newNumber = userData.towerInit.length + 1;
      towerSet(userData.towerInit, towerId, { number: newNumber, posX, posY });

      let packet = {
        packetType: PacketType.S2C_TOWER_CREATE,
        userId: userId,
        towerId: towerAsset[i].id,
        towerCost: towerAsset[i].cost,
        number: newNumber,
        posX,
        posY,
      };

      const opponentSocket = getOpponentInfo(userId);
      socket.emit('userTowerCreate', packet);
      opponentSocket.emit('userTowerCreate', packet);
      return { status: 'success', message: '타워를 설치 요청 완료' };
    }
  }

  return { status: 'fail', message: '타워를 설치 요청에 실패하였습니다.' };
};

// ex
// userTower = {
//     length: 0,
//     101 : [
//       {towerNum ,x, y },
//     ]
// }
