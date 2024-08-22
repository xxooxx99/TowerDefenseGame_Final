import { getGameAssets } from '../init/assets.js';

const towers = {};

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

export const towerSet = (userTower, towerType, towerId, newUserTowerData, upgrade = false) => {
  if (!upgrade) userTower.length++;

  const userTowerList = userTower[towerType][towerId];
  userTowerList.push(newUserTowerData);
};

export const towerDelete = (userTower, towerType, towerId, towerNumber) => {
  const userTowerList = userTower[towerType][towerId];

  for (let i = 0; i < userTowerList.length; i++) {
    if (userTowerList[i].number == towerNumber) return userTowerList.splice(i, 1);
  }
};

export const towerAttackTimeSet = (userTower, towerType, towerId, towerNumber, time) => {
  const userTowerList = userTower[towerType][towerId];

  for (let i = 0; i < userTowerList.length; i++) {
    if (userTowerList[i].number == towerNumber) {
      const tower = userTowerList[i];
      tower.attackTime = time;
    }
  }
};

export const getTowers = (uuid) => {
  return towers[uuid];
};

export const calculateDistance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
};
