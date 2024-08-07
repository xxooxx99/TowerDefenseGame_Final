import { PacketType } from '../../constants.js';
import { getGameByUserId, getPlayData } from '../../models/playData.model.js';
import { sendGameSync } from './gameSyncHandler.js';

function handleMonsterBaseAttack(socket, userId, payload) {
  const playerData = getPlayData(userId);
  const newBaseHp = playerData.getBaseHp() - payload.damage;
  playerData.setBaseHp(newBaseHp);
  sendGameSync(socket, userId, PacketType.S2C_UPDATE_BASE_HP, {
    playerBaseHp: playerData.getBaseHp(),
  });

  if (newBaseHp <= 0) {
    const game = getGameByUserId(userId);
    if (game) {
      const opponentUserId =
        game.player1.userId === userId ? game.player2.userId : game.player1.userId;
      const opponentScore = getPlayData(opponentUserId)?.getScore();

      if (opponentScore === undefined) {
        console.error(`Opponent score not found for User ID: ${opponentUserId}`);
        return;
      }
    } else {
      console.log(`No game found for User ID: ${userId}`);
    }
  }
}

export { handleMonsterBaseAttack };
