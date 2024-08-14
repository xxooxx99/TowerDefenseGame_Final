import { PacketType } from '../../constants.js';
import { getPlayData } from '../../models/playData.model.js';
import { CLIENTS } from '../match/matchMakingHandler.js';

// 상태 동기화 패킷 생성 및 전송
function sendGameSync(socket, userId, packetType, payload) {
  const { mainTowers, mainMonsters, attackedMonster, attackedTower, destroyedMonsterIndex } =
    payload;

  const playerData = getPlayData(userId);
  if (!playerData) {
    console.error(`Player data not found for User Id: ${userId}`);
    return;
  }

  const opponentPlayerId = playerData.getOpponentInfo();
  const opponentClient = CLIENTS[opponentPlayerId];

  if (!opponentClient) {
    console.error(`Opponent client not found for opponent User ID: ${opponentPlayerId}`);
    return;
  }

  const playerPacket = {
    packetType: PacketType.S2C_GAMESYNC,
    data: {
      gold: playerData.getGold(),
      score: playerData.getScore(),
      attackedMonster,
      baseHp: playerData.getBaseHp(),
    },
  };

  const opponentPacket = {
    packetType,
    data: {
      opponentTowers: mainTowers,
      opponentMonsters: mainMonsters,
      opponentBaseHp: playerData.getBaseHp(),
      attackedOpponentMonster: attackedMonster,
      attackedOpponentTower: attackedTower,
      destroyedOpponentMonsterIndex: destroyedMonsterIndex,
    },
  };

  socket.emit('gameSync', playerPacket);
  opponentClient.emit('gameSync', opponentPacket);
}

export { sendGameSync };
