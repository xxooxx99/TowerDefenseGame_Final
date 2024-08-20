import { createPlayData } from '../models/playData.model.js';
import { userTowerDataInit } from '../models/tower.model.js';
import { towerSet } from '../models/tower.model.js';
import { getPlayData } from '../models/playData.model.js';
import { getGameAssets } from './assets.js';
import {
  RESOLUTION_HEIGHT,
  RESOLUTION_WIDTH,
  INITIAL_TOWER_NUMBER,
  PacketType,
} from '../constants.js';

export const initData = (user1, user2) => {
  const userId1 = user1.id;
  const userId2 = user2.id;
  const userSocket1 = user1.socket;
  const userSocket2 = user2.socket;

  //몬스터 이동위치 초기화
  const myMonsterPath = generateRandomMonsterPath();
  const opponentMonsterPath = generateRandomMonsterPath();

  //유저 타워 초기화
  const myTowerInit = userTowerDataInit();
  const opponentTowerInit = userTowerDataInit();

  //타워 비용 초기화
  const towersData = getGameAssets().towerData.towerType;

  //유저 초기 타워 3개 배치
  for (let i = 0; i < INITIAL_TOWER_NUMBER; i++) {
    const towerCoords1 = getRandomPositionNearPath(100, myMonsterPath);
    const towerCoords2 = getRandomPositionNearPath(100, opponentMonsterPath);

    towerSet(myTowerInit, 'baseTower', 100, {
      posX: towerCoords1.x,
      posY: towerCoords1.y,
      number: i + 1,
      attackTime: new Date().getTime(),
    });
    towerSet(opponentTowerInit, 'baseTower', 100, {
      posX: towerCoords2.x,
      posY: towerCoords2.y,
      number: i + 1,
      attackTime: new Date().getTime(),
    });
  }

  //base 위치 초기화
  const myBasePos = myMonsterPath[myMonsterPath.length - 1];
  const opponentBasePos = opponentMonsterPath[opponentMonsterPath.length - 1];

  //서버 내 데이터 추가
  createPlayData(userId1, {
    monsterPath: myMonsterPath,
    towerInit: myTowerInit,
    basePos: myBasePos,
    opponentMonsterPath: opponentMonsterPath,
    opponentTowerInit: opponentTowerInit,
    opponentBasePos: opponentBasePos,
    opponentUserInfo: userId2,
  });
  createPlayData(userId2, {
    monsterPath: opponentMonsterPath,
    towerInit: opponentTowerInit,
    basePos: opponentBasePos,
    opponentMonsterPath: myMonsterPath,
    opponentTowerInit: myTowerInit,
    opponentBasePos: myBasePos,
    opponentUserInfo: userId1,
  });

  // S2C 보낼 데이터
  const myPayload = {
    ...getPlayData(userId1),
  };
  const opponentPayload = {
    ...getPlayData(userId2),
  };

  let packet = {
    PacketType: PacketType.S2C_GAME_INIT_DATA,
  };

  userSocket1.emit('gameInit', packet, { Payload: myPayload, towersData });
  userSocket2.emit('gameInit', packet, { Payload: opponentPayload, towersData });
};

// 초기 몬스터 경로 설정에만 사용
const generateRandomMonsterPath = () => {
  const canvasHeight = RESOLUTION_HEIGHT;
  const canvasWidth = RESOLUTION_WIDTH;
  const path = [];
  let currentX = 0;
  let currentY = Math.floor(Math.random() * 21) + 500;
  path.push({ x: currentX, y: currentY });
  while (currentX < canvasWidth - 50) {
    currentX += Math.floor(Math.random() * 100) + 50;
    if (currentX > canvasWidth - 50) {
      currentX = canvasWidth - 50;
    }
    currentY += Math.floor(Math.random() * 200) - 100;
    if (currentY < 50) {
      currentY = 50;
    }
    if (currentY > canvasHeight - 50) {
      currentY = canvasHeight - 50;
    }
    path.push({ x: currentX, y: currentY });
  }
  return path;
};

//초기 타워 건설에만 사용
const getRandomPositionNearPath = (maxDistance, monsterPath) => {
  const segmentIndex = Math.floor(Math.random() * (monsterPath.length - 1));
  const startX = monsterPath[segmentIndex].x;
  const startY = monsterPath[segmentIndex].y;
  const endX = monsterPath[segmentIndex + 1].x;
  const endY = monsterPath[segmentIndex + 1].y;

  const t = Math.random();
  const posX = startX + t * (endX - startX);
  const posY = startY + t * (endY - startY);

  const offsetX = (Math.random() - 0.5) * 2 * maxDistance;
  const offsetY = (Math.random() - 0.5) * 2 * maxDistance;
  console.log(`초기타워 위치 + ${posX}, ${offsetX}, ${posY}, ${offsetY}`);

  return {
    x: posX + offsetX,
    y: posY + offsetY,
  };
};
