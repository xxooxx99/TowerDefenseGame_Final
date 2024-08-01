import { getGameAssets } from '../init/assets.js';

//const userTower = {};

//게임 시작시 유저가 가지고 있는 타워 초기화
export const userTowerDataInit = () => {
  let towerAsset = getGameAssets().towerData.data;
  let userTower = { length: 0 };
  for (let i = 0; i < towerAsset.length; i++) {
    const towerId = towerAsset[i].id;
    userTower[towerId] = [];
  }

  return userTower;
};

//타워 코스트 정의
export const towerCostInit = () => {
  let towersCost = {};
  let towerAsset = getGameAssets().towerData.data;
  for (let i = 0; i < towerAsset.length; i++) {
    const towerId = towerAsset[i].id;
    const towerCost = towerAsset[i].cost;
    towersCost[towerId] = towerCost;
  }

  return towersCost;
};

export const towerStatusDataInit = () => {
  let towerAsset = getGameAssets().towerData.data;
};

//타워 추가시 사용하는 함수
export const towerSet = (userTower, towerId, newUserTowerData) => {
  userTower.length++;
  userTower[towerId].push(newUserTowerData);
};

// newUserTowerData 형식
// posX: towerCoords2.x,
// posY: towerCoords2.y,
// number: i + 1,
