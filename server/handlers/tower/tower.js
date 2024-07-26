import { getGameAssets } from '../../init/assets.js';
import { towersGet } from '../../models/tower.model.js';

export const towerAdd = (socket, data) => {
  const { userId, towerId } = data.payload;

  let count = userTower[userId].length + 1;
  let towerAsset = getGameAssets().towerData.data;
  for (let i = 0; i < towerAsset.length; i++) {
    //해당 타워 코드가 존재하는 것인지 확인.
    if (towerAsset[i].id === towerId) {
      userTower[userId][count] = towerId; // ex) 1: 101
      userTower[userId].length++;
      return count;
    }
  }

  // if(tower)

  //const { posX, posY } = data.payload;
};
