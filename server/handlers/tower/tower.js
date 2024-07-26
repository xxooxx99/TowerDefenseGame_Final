import { getGameAssets } from '../../init/assets.js';
import { towersGet } from '../../models/tower.model.js';

export const towerAdd = (socket, data) => {
  const { userId, towerId, posX, posY } = data.payload;

  let packet;

  const userTowers = towersGet(userId);
  let count = userTowers.length + 1;
  let towerAsset = getGameAssets().towerData.data;
  for (let i = 0; i < towerAsset.length; i++) {
    //해당 타워 코드가 존재하는 것인지 확인.
    if (towerAsset[i].id === towerId) {
      userTowers[userId][count] = towerId; // ex) 1: 101
      userTowers[userId].length++;
      return count;
    }
  }

  packet = {};
  //존재하지 않는다면 실패 반환한다.
  return socket.emit('towerAdd', packet);
};
