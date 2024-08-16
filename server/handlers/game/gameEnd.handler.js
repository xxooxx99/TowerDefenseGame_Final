import { PacketType } from '../../constants.js';
import { prisma } from '../../utils/prisma/index.js';
import { getMatchingList } from '../ability/gameAbilityActive.handler.js';

async function gameoverSignalReceive(socket, data) {
  const { userId } = data;
  let matchingInfo = getMatchingList(userId);

  if (matchingInfo.user1_id === userId) {
    gameSignalSend(matchingInfo.user1_socket, false);
    gameSignalSend(matchingInfo.user2_socket, true);
    addRecord(matchingInfo.user1_id, false);
    addRecord(matchingInfo.user2_id, true);
  } else if (matchingInfo.user2_id === userId) {
    gameSignalSend(matchingInfo.user1_socket, true);
    gameSignalSend(matchingInfo.user2_socket, false);
    addRecord(matchingInfo.user1_id, true);
    addRecord(matchingInfo.user2_id, false);
  }
}

async function gameSignalSend(socket, isWin) {
  socket.emit('gameOver', {
    isWin: isWin,
  });
}

async function addRecord(userId, isWin) {
  const userData = await prisma.UserInfo.findUnique({
    where: {
      userId: userId,
    },
  });

  let win = userData.win;
  let lose = userData.lose;

  if (isWin) {
    const newUser = await prisma.UserInfo.update({
      where: {
        userId: userId,
      },
      data: {
        win: win + 1,
      },
    });
  } else {
    const newUser = await prisma.UserInfo.update({
      where: {
        userId: userId,
      },
      data: {
        lose: lose + 1,
      },
    });
  }
}

export { gameoverSignalReceive };
