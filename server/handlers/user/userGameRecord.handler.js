import { PacketType } from '../../constants.js';
import { prisma } from '../../utils/prisma/index.js';

async function recordRecentGame(socket, packet) {
  const { userId, payload } = packet;
  const { isWin, score } = payload;
  const recentRecord = await prisma.UserRecentGame.findFirst({
    where: {
      userId: userId,
    },
  });

  if (!recentRecord) {
    const newRecentRecord = await prisma.UserRecentGame.create({
      data: {
        userId: userId,
        isWin: isWin,
        score: score,
      },
    });
  } else {
    const newRecentRecord = await prisma.UserRecentGame.update({
      where: {
        userId: userId,
      },
      data: {
        isWin: isWin,
        score: score,
      },
    });
  }

  const userData = await prisma.userInfo.findUnique({
    where: {
      userId: userId,
    },
  });

  // 유저 데이터가 존재하고 하이스코어를 넘겼다면 하이스코어를 갱신 시켜줌
  if (userData) {
    if (userData.highScore < score) {
      const newRecord = await prisma.UserInfo.update({
        where: {
          userId: userId,
        },
        data: {
          highScore: score,
        },
      });
    }
  }
}

async function sendRecentGameInfo(socket, packet) {
  const { userId } = packet;

  const userData = await prisma.userInfo.findUnique({
    where: {
      userId: userId,
    },
  });

  const recentRecord = await prisma.UserRecentGame.findFirst({
    where: {
      userId: userId,
    },
  });

  let isHighScore = userData.highScore <= recentRecord.score;

  if (!recentRecord) {
    socket.emit('event', {
      packetType: PacketType.S2C_FAILED_LOAD_RECENT_GAME,
    });
  } else {
    socket.emit('event', {
      packetType: PacketType.S2C_LOAD_RECENT_GAME_INFO,
      payload: recentRecord,
      isHighScore: isHighScore,
    });
  }
}

export { recordRecentGame, sendRecentGameInfo };
