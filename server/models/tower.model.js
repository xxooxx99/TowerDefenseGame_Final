import { getGameAssets } from '../init/assets.js';

//const userTower = {};

//게임 시작시 유저가 가지고 있는 타워 초기화
export const userTowerDataInit = () => {
  let towerAsset = getGameAssets().towerData.towerType;
  let userTower = { length: 0 };
  for (let towerData in towerAsset) {
    const towers = towerAsset[towerData];
    userTower[towerData] = {};
    for (let i = 0; i < towers.length; i++) {
      const towerId = towers[i].id;
      userTower[towerData][towerId] = [];
    }
  }

  return userTower;
};

//타워 추가시 사용하는 함수
export const towerSet = (userTower, towerType, towerId, newUserTowerData) => {
  userTower.length++;
  userTower[towerType][towerId].push(newUserTowerData);
};
