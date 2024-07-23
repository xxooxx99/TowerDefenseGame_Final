import { prisma } from '../../utils/prisma/index.js';

let matchQ = [];
let CLIENTS = {};

async function getUserWinRate(userId) {
  const userInfo = await prisma.userInfo.findUnique({
    where: { userId: userId },
  });

  if (!userInfo) {
    throw new Error(`User info not found for userId: ${userId}`);
  }
  const winRate = userInfo.win / (userInfo.win + userInfo.lose);
  return winRate;
}

async function handleMatchRequest(socket, data) {
  const { userId } = data;
  console.log(`매치 요청을 보낸 유저 ID: ${userId}`);

  const winRate = await getUserWinRate(userId);
  matchQ.push({ socket, userId, winRate });
  console.log(`현재 대기열 상태: ${matchQ.map((user) => user.userId).join()}`);

  if (matchQ.length >= 2) {
    attemptMatch();
  }
}

function attemptMatch() {
  let maxWinRateDifference = 0.1; // 초기 허용 승률

  let intervalId = setInterval(() => {
    let matchedPlayers = new Set();

    for (let i = 0; i < matchQ.length - 1; i++) {
      if (matchedPlayers.has(matchQ[i].userId)) continue;
      for (let j = i + 1; j < matchQ.length; j++) {
        if (matchedPlayers.has(matchQ[j].userId)) continue;

        const player1 = matchQ[i];
        const player2 = matchQ[j];

        const winRateDifference = Math.abs(player1.winRate - player2.winRate);

        if (winRateDifference <= maxWinRateDifference) {
          console.log(`매칭 성공: ${player1.userId} vs ${player2.userId}`);

          CLIENTS[player1.userId] = player1.socket;
          CLIENTS[player2.userId] = player2.socket;

          matchedPlayers.add(player1.userId);
          matchedPlayers.add(player2.userId);

          break;
        }
      }
    }
    matchQ = matchQ.filter((player) => !matchedPlayers.has(player.userId));

    if (matchQ.length < 2) {
      clearInterval(intervalId);
    } else {
      maxWinRateDifference += 0.1;
      console.log(`다음 매치 시도까지 허용 승률 차이: ${maxWinRateDifference * 100}`);
    }
  }, 10000);
}
