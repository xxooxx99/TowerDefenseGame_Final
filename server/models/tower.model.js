import { getGameAssets } from '../init/assets.js';

const userTower = {};

export const initTowerData = (userId) => {
  userTower[userId] = { length: 0 };
};

export const towerSet = (userId, towerId, towerPos) => {
  //user의 골드 검증은 일단 재쳐둔 상태

  //x, y좌표를 이용해서 해당 타워가 건설될 수 있는 공간인지 확인 추가해야함.

  //해당 코드는 배열이 아닌 객체로 어떠한 타워를 가르키는지 사용하기 위해 사용됩니다.
  let count = userTower[userId].length + 1;

  let towerAsset = getGameAssets.towerData.data;
  for (let i = 0; i < towerAsset.length; i++) {
    //해당 타워 코드가 존재하는 것인지 확인.
    if (towerAsset[i].id === towerId) {
      userTower[userId][count] = towerId; // ex) 1: 101
      userTower[userId].length++;
      return count;
    }
  }

  //존재하지 않는다면 undefined를 반환한다.
  return undefined;
};

export const towersGet = (userId) => {
  return userTower[userId];
};
