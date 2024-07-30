import { getGameAssets } from '../init/assets.js';

const userTower = {};

//게임 시작시 유저가 가지고 있는 타워 초기화
export const initTowerData = (userId) => {
  let towersCost = {};
  let towerAsset = getGameAssets().towerData.data;
  userTower[userId] = { length: 0 };
  for (let i = 0; i < towerAsset.length; i++) {
    const towerId = towerAsset[i].id;
    userTower[userId][towerId] = [];

    const towerCost = towerAsset[i].cost;
    towersCost[towerId] = towerCost;
  }

  return towersCost;
};

//타워 추가시 사용하는 함수
export const towerSet = (userId, towerId, newUserTowerData) => {
  userTower[userId].length++;
  userTower[userId][towerId].push(newUserTowerData);
};

export const towersGet = (userId) => {
  return userTower[userId];
};
