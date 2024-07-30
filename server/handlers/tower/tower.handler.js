import { PacketType } from '../../constants.js';
import { getGameAssets } from '../../init/assets.js';
import { userGoldSubtract } from '../../models/gold.model.js';
import { initTowerData, towerSet, towersGet } from '../../models/tower.model.js';

export const towerInitHandler = (socket, data) => {
  const { userId } = data.payload;

  const towersCost = initTowerData(userId);
  socket.emit('towerCostInit', towersCost);

  return { status: 'success', message: '타워 초기 세팅 완료!' };
};

export const towerAddHandler = (socket, data) => {
  const { userId, towerId, posX, posY } = data.payload;

  let towerAsset = getGameAssets().towerData.data;

  const userTower = towersGet(userId); // 초기 ex) { length: 0 };

  for (let i = 0; i < towerAsset.length; i++) {
    if (towerAsset[i].id === towerId) {
      const check = userGoldSubtract(userId, towerAsset[i].cost);
      if (!check) return { status: 'fail', message: '타워를 설치 비용이 부족합니다.' };

      userTower[towerId] = { posX, posY }; // ex) 101 : { 55, 100 }
      towerSet(userId, towerId, { towerNumber: userTower.length + 1, posX, posY });

      let packet = {
        packetType: PacketType.S2C_TOWER_CREATE,
        towerData: towerAsset[i],
        posX,
        posY,
      };

      socket.emit('userTowerCreate', packet);
      return { status: 'success', message: '타워를 설치 요청 완료' };
    }
  }

  return { status: 'fail', message: '타워를 설치 요청에 실패하였습니다.' };
};

// ex
// userTower = {
//   userId : {
//     length: 0,
//     101 : [
//       {towerNum ,x, y },
//     ]
//   }
// }
