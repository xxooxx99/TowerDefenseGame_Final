import {
  INITIAL_TOWER_NUMBER,
  PacketType,
  RESOLUTION_HEIGHT,
  RESOLUTION_WIDTH,
} from '../../constants.js';
import { createPlayData, GameData, getPlayData } from '../../models/playData.model.js';
import { createTowers, setTower } from '../../models/tower.model.js';
import { addAccept_queue } from './matchAcceptHandler.js';

// 매칭 대기열
let matching_queue = [];

// 사용자 ID를 키, 소켓 객체를 값으로 저장하는 곳
let CLIENTS = {};

// 수락 대기열을 구별하기 위한 인덱스
let index = 0;

function generateRandomMonsterPath() {
  const canvasHeight = RESOLUTION_HEIGHT;
  const canvasWidth = RESOLUTION_WIDTH;
  const path = [];
  let currentX = 0;
  let currentY = Math.floor(Math.random() * 21) + 500;
  path.push({ x: currentX, y: currentY });
  while (currentX < canvasWidth) {
    currentX += Math.floor(Math.random() * 100) + 50;
    if (currentX > canvasWidth) {
      currentX = canvasWidth;
    }
    currentY += Math.floor(Math.random() * 200) - 100;
    if (currentY < 0) {
      currentY = 0;
    }
    if (currentY > canvasHeight) {
      currentY = canvasHeight;
    }
    path.push({ x: currentX, y: currentY });
  }
  return path;
}

function getRandomPositionNearPath(maxDistance, monsterPath) {
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

  return {
    x: posX + offsetX,
    y: posY + offsetY,
  };
}
async function handleMatchRequest(socket, data) {
  const { userId } = data;
  console.log(`매치 요청을 보낸 유저 ID: ${userId}`);

  const existingUser = matching_queue.find((user) => user.userId === userId);
  if (existingUser) {
    console.log(`유저 ID ${userId}는 이미 대기열에 있습니다.`);
    socket.emit('error', { message: '이미 대기열에 있습니다.' });
    return;
  }

  // const winRate = await getUserWinRate(userId);
  matching_queue.push({ socket, userId, startTime: Date.now() });
  console.log(`현재 대기열 상태: ${matching_queue.map((user) => user.userId).join(`, `)}`);

  socket.on('disconnect', () => {
    matching_queue = matching_queue.filter((user) => user.userId !== userId);
    console.log(
      `유저 ${userId}가 연결 해제되었습니다. 현재 대기열 상태: ${matching_queue.map((user) => user.userId).join(`, `)}`,
    );
  });

  tryMatch();
}

function tryMatch() {
  const now = Date.now();

  if (matching_queue.length < 2) {
    setTimeout(tryMatch, 10000);
    return;
  }

  for (let i = 0; i < matching_queue.length - 1; i++) {
    for (let j = i + 1; j < matching_queue.length; j++) {
      const player1 = matching_queue[i];
      const player2 = matching_queue[j];

      const elapsedSeconds = (now - player1.startTime) / 1000;
      const winRateThreshold = 0.1 + Math.floor(elapsedSeconds / 10) * 0.1;

      // 매칭 성공 시
      if (true) {
        //if (Math.abs(player1.winRate - player2.winRate) <= winRateThreshold) {
        matching_queue.splice(j, 1);
        matching_queue.splice(i, 1);

        CLIENTS[player1.userId] = player1.socket;
        CLIENTS[player2.userId] = player2.socket;

        console.log(`매칭 성공: ${player1.userId} vs ${player2.userId}`);

        const packet = {
          PacketType: PacketType.S2C_MATCH_FOUND_NOTIFICATION,
          opponentId: player2.userId,
          index: index,
        };

        createTowers(player1.userId);
        createTowers(player2.userId);

        const initialHp = 100;
        const player1MonsterPath = generateRandomMonsterPath();
        const player2MonsterPath = generateRandomMonsterPath();
        let player1InitialTowerCoords = [];
        let player2InitialTowerCoords = [];

        for (let i = 0; i < INITIAL_TOWER_NUMBER; i++) {
          const towerCoords1 = getRandomPositionNearPath(200, player1MonsterPath);
          const towerCoords2 = getRandomPositionNearPath(200, player2MonsterPath);

          player1InitialTowerCoords.push(towerCoords1);
          player2InitialTowerCoords.push(towerCoords2);

          setTower(player1.userId, towerCoords1.x, towerCoords1.y, 1, i + 1);
          setTower(player2.userId, towerCoords2.x, towerCoords2.y, 1, i + 1);
        }

        createPlayData(
          player1.userId,
          new GameData(
            player1MonsterPath,
            player1InitialTowerCoords,
            player1MonsterPath[player1MonsterPath.length - 1],
            player2MonsterPath,
            player2InitialTowerCoords,
            player2MonsterPath[player2MonsterPath.length - 1],
            player2.userId,
          ),
        );
        createPlayData(
          player2.userId,
          new GameData(
            player2MonsterPath,
            player2InitialTowerCoords,
            player2MonsterPath[player2MonsterPath.length - 1],
            player1MonsterPath,
            player1InitialTowerCoords,
            player1MonsterPath[player1MonsterPath.length - 1],
            player1.userId,
          ),
        );

        const player1Payload = {
          ...getPlayData(player1.userId),
          baseHp: initialHp,
          opponentBaseHp: initialHp,
        };
        const player2Payload = {
          ...getPlayData(player2.userId),
          baseHp: initialHp,
          opponentBaseHp: initialHp,
        };

        player1.socket.emit('event', packet, player1Payload);
        player2.socket.emit('event', { ...packet, opponentId: player1.userId }, player2Payload);

        addAccept_queue(index, player1, player2);
        index++;
        return;
      }
    }
  }
  setTimeout(tryMatch, 10000);
}

export { handleMatchRequest, CLIENTS };
