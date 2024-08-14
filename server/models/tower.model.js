import { getGameAssets } from '../init/assets.js';

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
  userTower[towerType][towerId].push(newUserTowerData);
};

export const towerDelete = (userTower, towerType, towerId, towerNumber) => {
  for (let i = 0; i < userTower[towerType][towerId].length; i++) {
    if (userTower[towerType][towerId][i].number == towerNumber)
      return userTower[towerType][towerId].splice(i, 1);
  }
};

export const towerAttackTimeSet = (userTower, towerType, towerId, towerNumber, time) => {
  for (let i = 0; i < userTower[towerType][towerId].length; i++) {
    if (userTower[towerType][towerId][i].number == towerNumber) {
      const tower = userTower[towerType][towerId][i];
      tower.attackTime = time;
    }
  }
};
