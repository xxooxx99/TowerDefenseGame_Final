import {
  INITIAL_TOWER_NUMBER,
  PacketType,
  RESOLUTION_HEIGHT,
  RESOLUTION_WIDTH,
} from '../../constants.js';
import { addAccept_queue } from './matchAcceptHandler.js';
import { prisma } from '../../utils/prisma/index.js';

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

async function tryMatch() {
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

        const User1Data = await prisma.userInfo.findFirst({
          where: { userId: player1.userId },
        });

        const User2Data = await prisma.userInfo.findFirst({
          where: { userId: player2.userId },
        });

        const packet = {
          PacketType: PacketType.S2C_MATCH_FOUND_NOTIFICATION,
          opponentId: player2.userId,
          ownUserData: User1Data,
          opponentUserData: User2Data,
          index: index,
        };

        player1.socket.emit('event', packet);
        player2.socket.emit('event', {
          ...packet,
          opponentId: player1.userId,
          ownUserData: User2Data,
          opponentUserData: User1Data,
        });

        addAccept_queue(index, player1, player2);
        index++;
        return;
      }
    }
  }
  setTimeout(tryMatch, 10000);
}

export { handleMatchRequest, CLIENTS };
