const towers = {};

export const createTowers = (uuid) => {
  towers[uuid] = [];
};

export const getTowers = (uuid) => {
  return towers[uuid];
};

export const setTower = (uuid, coordinateX, coordinateY, level, towerIndex) => {
  return towers[uuid].push({ tower: { X: coordinateX, Y: coordinateY }, level, towerIndex });
};
