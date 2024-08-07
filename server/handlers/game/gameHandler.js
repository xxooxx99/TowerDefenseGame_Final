import { PacketType } from '../../constants.js';
import { getGameByUserId, getPlayData } from '../../models/playData.model.js';
import { sendGameSync } from './gameSyncHandler.js';
import { getBase, baseAttackMonster } from '../../models/baseUpgrade.js';

function handleMonsterBaseAttack(socket, uuid, payload) {
  const playerData = getPlayData(uuid);
  
  if (!playerData) {
    console.error(`Player data not found for UUID: ${uuid}`);
    return;
  }

  const newBaseHp = playerData.getBaseHp() - payload.damage;
  playerData.setBaseHp(newBaseHp);
  sendGameSync(socket, uuid, PacketType.S2C_UPDATE_BASE_HP, {
    playerBaseHp: playerData.getBaseHp(),
  });

  if (newBaseHp <= 0) {
    const game = getGameByUserId(uuid);
    if (game) {
      const opponentUuid = game.player1.userId === uuid ? game.player2.userId : game.player1.userId;
      const opponentScore = getPlayData(opponentUuid)?.getScore();

      if (opponentScore === undefined) {
        console.error(`Opponent score not found for UUID: ${opponentUuid}`);
        return;
      }
    } else {
      console.log(`No game found for UUID: ${uuid}`);
    }
  }
}

function handleBaseAttackMonster(socket, uuid, payload) {
  console.log('Received Base Attack Request:', uuid, payload);

  if (!payload || !payload.baseUuid || !payload.monsterIndices) {
    console.error('Invalid payload:', payload);
    return;
  }

  const { baseUuid, monsterIndices } = payload;

  try {
    const updatedMonsters = baseAttackMonster(baseUuid, monsterIndices);
    socket.emit('event', { packetType: PacketType.S2C_UPDATE_MONSTER_HP, payload: updatedMonsters });
  } catch (error) {
    console.error('Error in baseAttackMonster:', error);
  }
}

export { handleMonsterBaseAttack, handleBaseAttackMonster };
